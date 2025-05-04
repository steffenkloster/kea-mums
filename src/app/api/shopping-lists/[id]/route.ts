import { getDb } from "@/app/api/_helpers";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { type NextRequest, NextResponse } from "next/server";

// GET - Get a shopping list by ID
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const shoppingListId = params.id;

		if (!ObjectId.isValid(shoppingListId)) {
			return NextResponse.json(
				{ error: "Invalid shopping list ID format" },
				{ status: 400 },
			);
		}

		const db = await getDb();
		const userId = session.user.id;

		const shoppingListCollection = db.collection("ShoppingList");
		const shoppingListItemCollection = db.collection("ShoppingListItem");
		const ingredientsCollection = db.collection("Ingredient");
		const mealPlansCollection = db.collection("MealPlan");

		const shoppingList = await shoppingListCollection.findOne({
			_id: new ObjectId(shoppingListId),
			userId: userId,
		});

		if (!shoppingList) {
			return NextResponse.json(
				{ error: "Shopping list not found" },
				{ status: 404 },
			);
		}

		let mealPlan = null;
		if (shoppingList.mealPlanId) {
			mealPlan = await mealPlansCollection.findOne({
				_id: new ObjectId(shoppingList.mealPlanId),
			});
		}

		const shoppingListItems = await shoppingListItemCollection
			.find({ shoppingListId: shoppingListId })
			.toArray();

		const ingredientIds = shoppingListItems.map(
			(item) => new ObjectId(item.ingredientId),
		);

		const ingredients =
			ingredientIds.length > 0
				? await ingredientsCollection
						.find({ _id: { $in: ingredientIds } })
						.toArray()
				: [];

		const ingredientsMap: Record<string, any> = {};
		for (const ingredient of ingredients) {
			ingredientsMap[ingredient._id.toString()] = ingredient;
		}

		const formattedItems = shoppingListItems.map((item) => {
			const ingredient = ingredientsMap[item.ingredientId] || {};
			return {
				id: item._id.toString(),
				quantity: item.quantity,
				unit: item.unit,
				isChecked: item.isChecked,
				notes: item.notes,
				ingredient: {
					id: ingredient._id?.toString() || item.ingredientId,
					name: ingredient.name || "Unknown Ingredient",
					category: ingredient.category,
					imageUrl: ingredient.imageUrl,
					units: ingredient.units || [],
				},
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			};
		});

		formattedItems.sort((a, b) => {
			if (a.isChecked !== b.isChecked) {
				return a.isChecked ? 1 : -1;
			}

			const categoryA = a.ingredient.category || "Other";
			const categoryB = b.ingredient.category || "Other";
			if (categoryA !== categoryB) {
				return categoryA.localeCompare(categoryB);
			}

			return a.ingredient.name.localeCompare(b.ingredient.name);
		});

		const formattedShoppingList = {
			id: shoppingList._id.toString(),
			name: shoppingList.name,
			mealPlan: mealPlan
				? {
						id: mealPlan._id.toString(),
						name: mealPlan.name,
					}
				: null,
			items: formattedItems,
			createdAt: shoppingList.createdAt,
			updatedAt: shoppingList.updatedAt,
		};

		return NextResponse.json(formattedShoppingList);
	} catch (error) {
		console.error("Shopping list fetch error:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch shopping list",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

// DELETE - Delete a shopping list
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const shoppingListId = params.id;

		if (!ObjectId.isValid(shoppingListId)) {
			return NextResponse.json(
				{ error: "Invalid shopping list ID format" },
				{ status: 400 },
			);
		}

		const db = await getDb();
		const userId = session.user.id;

		const shoppingListCollection = db.collection("ShoppingList");
		const shoppingListItemCollection = db.collection("ShoppingListItem");

		const shoppingList = await shoppingListCollection.findOne({
			_id: new ObjectId(shoppingListId),
			userId: userId,
		});

		if (!shoppingList) {
			return NextResponse.json(
				{ error: "Shopping list not found" },
				{ status: 404 },
			);
		}

		await shoppingListItemCollection.deleteMany({
			shoppingListId: shoppingListId,
		});

		const result = await shoppingListCollection.deleteOne({
			_id: new ObjectId(shoppingListId),
		});

		if (!result.deletedCount) {
			return NextResponse.json(
				{ error: "Failed to delete shopping list" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ message: "Shopping list deleted successfully" });
	} catch (error) {
		console.error("Shopping list deletion error:", error);
		return NextResponse.json(
			{
				error: "Failed to delete shopping list",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

// PATCH - Update a shopping list
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const shoppingListId = params.id;

		if (!ObjectId.isValid(shoppingListId)) {
			return NextResponse.json(
				{ error: "Invalid shopping list ID format" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { name } = body;

		if (!name) {
			return NextResponse.json({ error: "Name is required" }, { status: 400 });
		}

		const db = await getDb();
		const userId = session.user.id;

		const shoppingListCollection = db.collection("ShoppingList");

		const shoppingList = await shoppingListCollection.findOne({
			_id: new ObjectId(shoppingListId),
			userId: userId,
		});

		if (!shoppingList) {
			return NextResponse.json(
				{ error: "Shopping list not found" },
				{ status: 404 },
			);
		}

		const result = await shoppingListCollection.updateOne(
			{ _id: new ObjectId(shoppingListId) },
			{
				$set: {
					name,
					updatedAt: new Date(),
				},
			},
		);

		if (!result.matchedCount) {
			return NextResponse.json(
				{ error: "Failed to update shopping list" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			id: shoppingListId,
			name,
			updatedAt: new Date(),
			message: "Shopping list updated successfully",
		});
	} catch (error) {
		console.error("Shopping list update error:", error);
		return NextResponse.json(
			{
				error: "Failed to update shopping list",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
