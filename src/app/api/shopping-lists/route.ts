import { getDb } from "@/app/api/_helpers";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { type NextRequest, NextResponse } from "next/server";

// GET - Get all shopping lists for the authenticated user
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const db = await getDb();
		const userId = session.user.id;

		const shoppingListCollection = db.collection("ShoppingList");
		const shoppingListItemCollection = db.collection("ShoppingListItem");
		const mealPlansCollection = db.collection("MealPlan");

		const shoppingLists = await shoppingListCollection
			.find({ userId: userId })
			.sort({ createdAt: -1 })
			.toArray();

		const shoppingListIds = shoppingLists.map((list) => list._id.toString());

		const allItems = await shoppingListItemCollection
			.find({ shoppingListId: { $in: shoppingListIds } })
			.toArray();

		const itemsByListId: Record<string, any[]> = {};
		for (const item of allItems) {
			const listId = item.shoppingListId;
			if (!itemsByListId[listId]) {
				itemsByListId[listId] = [];
			}
			itemsByListId[listId].push(item);
		}

		const mealPlanIds = shoppingLists
			.filter((list) => list.mealPlanId)
			.map((list) => new ObjectId(list.mealPlanId));

		const mealPlans =
			mealPlanIds.length > 0
				? await mealPlansCollection
						.find({ _id: { $in: mealPlanIds } })
						.project({ _id: 1, name: 1 })
						.toArray()
				: [];

		const mealPlanMap: Record<string, any> = {};
		for (const plan of mealPlans) {
			mealPlanMap[plan._id.toString()] = plan;
		}

		const formattedLists = shoppingLists.map((list) => {
			const listId = list._id.toString();
			const items = itemsByListId[listId] || [];
			const mealPlan = list.mealPlanId ? mealPlanMap[list.mealPlanId] : null;

			return {
				id: listId,
				name: list.name,
				items: items.map((item) => ({
					id: item._id.toString(),
					isChecked: item.isChecked,
				})),
				mealPlan: mealPlan
					? {
							id: mealPlan._id.toString(),
							name: mealPlan.name,
						}
					: null,
				createdAt: list.createdAt,
				updatedAt: list.updatedAt,
			};
		});

		return NextResponse.json(formattedLists);
	} catch (error) {
		console.error("Shopping lists fetch error:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch shopping lists",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

// POST - Create a new shopping list
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { name, mealPlanId } = body;

		if (!name) {
			return NextResponse.json({ error: "Name is required" }, { status: 400 });
		}

		if (mealPlanId && !ObjectId.isValid(mealPlanId)) {
			return NextResponse.json(
				{ error: "Invalid meal plan ID format" },
				{ status: 400 },
			);
		}

		const db = await getDb();
		const userId = session.user.id;

		const shoppingListCollection = db.collection("ShoppingList");
		const mealPlansCollection = db.collection("MealPlan");

		if (mealPlanId) {
			const mealPlan = await mealPlansCollection.findOne({
				_id: new ObjectId(mealPlanId),
				userId: userId,
			});

			if (!mealPlan) {
				return NextResponse.json(
					{ error: "Meal plan not found" },
					{ status: 404 },
				);
			}
		}

		const now = new Date();
		const shoppingList = {
			name,
			userId,
			mealPlanId: mealPlanId || null,
			createdAt: now,
			updatedAt: now,
		};

		const result = await shoppingListCollection.insertOne(shoppingList);

		if (!result.acknowledged) {
			throw new Error("Failed to create shopping list");
		}

		return NextResponse.json({
			id: result.insertedId.toString(),
			name,
			mealPlanId: mealPlanId || null,
			items: [],
			createdAt: now,
			updatedAt: now,
		});
	} catch (error) {
		console.error("Shopping list creation error:", error);
		return NextResponse.json(
			{
				error: "Failed to create shopping list",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
