import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { type NextRequest, NextResponse } from "next/server";

// PATCH - Update a shopping list item
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; itemId: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: shoppingListId, itemId } = await params;

		if (!ObjectId.isValid(shoppingListId)) {
			return NextResponse.json(
				{ error: "Invalid shopping list ID format" },
				{ status: 400 },
			);
		}

		if (!ObjectId.isValid(itemId)) {
			return NextResponse.json(
				{ error: "Invalid item ID format" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { quantity, unit, notes, isChecked } = body;

		const { db } = await connectToDatabase();
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

		const shoppingListItem = await shoppingListItemCollection.findOne({
			_id: new ObjectId(itemId),
			shoppingListId: shoppingListId,
		});

		if (!shoppingListItem) {
			return NextResponse.json(
				{ error: "Item not found in shopping list" },
				{ status: 404 },
			);
		}

		const updateFields: Record<string, any> = {
			updatedAt: new Date(),
		};

		if (quantity !== undefined)
			updateFields.quantity = Number.parseFloat(quantity.toString());
		if (unit !== undefined) updateFields.unit = unit;
		if (notes !== undefined) updateFields.notes = notes;
		if (isChecked !== undefined) updateFields.isChecked = isChecked;

		const result = await shoppingListItemCollection.updateOne(
			{ _id: new ObjectId(itemId) },
			{ $set: updateFields },
		);

		if (!result.matchedCount) {
			return NextResponse.json(
				{ error: "Failed to update item" },
				{ status: 500 },
			);
		}

		await shoppingListCollection.updateOne(
			{ _id: new ObjectId(shoppingListId) },
			{ $set: { updatedAt: new Date() } },
		);

		return NextResponse.json({
			id: itemId,
			...updateFields,
			message: "Item updated successfully",
		});
	} catch (error) {
		console.error("Update shopping list item error:", error);
		return NextResponse.json(
			{
				error: "Failed to update shopping list item",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

// DELETE - Remove a shopping list item
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; itemId: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: shoppingListId, itemId } = await params;

		if (!ObjectId.isValid(shoppingListId)) {
			return NextResponse.json(
				{ error: "Invalid shopping list ID format" },
				{ status: 400 },
			);
		}

		if (!ObjectId.isValid(itemId)) {
			return NextResponse.json(
				{ error: "Invalid item ID format" },
				{ status: 400 },
			);
		}

		const { db } = await connectToDatabase();
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

		const result = await shoppingListItemCollection.deleteOne({
			_id: new ObjectId(itemId),
			shoppingListId: shoppingListId,
		});

		if (!result.deletedCount) {
			return NextResponse.json(
				{ error: "Item not found or already deleted" },
				{ status: 404 },
			);
		}

		await shoppingListCollection.updateOne(
			{ _id: new ObjectId(shoppingListId) },
			{ $set: { updatedAt: new Date() } },
		);

		return NextResponse.json({ message: "Item removed successfully" });
	} catch (error) {
		console.error("Delete shopping list item error:", error);
		return NextResponse.json(
			{
				error: "Failed to remove shopping list item",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
