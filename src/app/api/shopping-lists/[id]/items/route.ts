import { getDb } from "@/app/api/_helpers";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { type NextRequest, NextResponse } from "next/server";

// POST - Add a new item to a shopping list
export async function POST(
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
		const { name, quantity, unit, notes, ingredientId } = body;

		if (!name || quantity === undefined || !unit) {
			return NextResponse.json(
				{
					error: "Missing required fields",
					details: [
						!name && { path: ["name"], message: "Item name is required" },
						quantity === undefined && {
							path: ["quantity"],
							message: "Quantity is required",
						},
						!unit && { path: ["unit"], message: "Unit is required" },
					].filter(Boolean),
				},
				{ status: 400 },
			);
		}

		const db = await getDb();
		const userId = session.user.id;

		const shoppingListCollection = db.collection("ShoppingList");
		const shoppingListItemCollection = db.collection("ShoppingListItem");
		const ingredientsCollection = db.collection("Ingredient");

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

		let ingredient: any;

		if (ingredientId && ObjectId.isValid(ingredientId)) {
			ingredient = await ingredientsCollection.findOne({
				_id: new ObjectId(ingredientId),
			});

			if (!ingredient) {
				return NextResponse.json(
					{ error: "Ingredient not found" },
					{ status: 404 },
				);
			}
		} else {
			ingredient = await ingredientsCollection.findOne({
				name: { $regex: new RegExp(`^${name}$`, "i") }, // Case-insensitive exact match
			});

			if (!ingredient) {
				const newIngredient = {
					name,
					category: "Other",
					units: [unit],
					alternativeNames: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const result = await ingredientsCollection.insertOne(newIngredient);
				if (!result.acknowledged) {
					throw new Error("Failed to create ingredient");
				}

				ingredient = {
					_id: result.insertedId,
					...newIngredient,
				};
			}
		}

		const now = new Date();
		const newItem = {
			shoppingListId,
			ingredientId: ingredient._id.toString(),
			quantity: Number.parseFloat(quantity.toString()), // Ensure numeric
			unit,
			isChecked: false,
			notes: notes || null,
			createdAt: now,
			updatedAt: now,
		};

		const result = await shoppingListItemCollection.insertOne(newItem);

		if (!result.acknowledged) {
			throw new Error("Failed to add item to shopping list");
		}

		await shoppingListCollection.updateOne(
			{ _id: new ObjectId(shoppingListId) },
			{ $set: { updatedAt: now } },
		);

		return NextResponse.json({
			id: result.insertedId.toString(),
			quantity: newItem.quantity,
			unit: newItem.unit,
			isChecked: newItem.isChecked,
			notes: newItem.notes,
			ingredient: {
				id: ingredient._id.toString(),
				name: ingredient.name,
				category: ingredient.category,
				units: ingredient.units,
			},
			createdAt: now,
			updatedAt: now,
		});
	} catch (error) {
		console.error("Add shopping list item error:", error);
		return NextResponse.json(
			{
				error: "Failed to add item to shopping list",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
