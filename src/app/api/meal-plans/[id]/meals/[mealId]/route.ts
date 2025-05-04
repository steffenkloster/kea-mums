import {
	errorResponse,
	findMealPlanById,
	getDb,
	getSessionUserId,
	handleError,
	validateObjectId,
} from "@/app/api/_helpers";
import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; mealId: string }> },
) {
	try {
		const userId = await getSessionUserId();
		const { id: mealPlanId, mealId } = await params;

		validateObjectId(mealPlanId, "meal plan ID");
		validateObjectId(mealId, "meal ID");

		const db = await getDb();
		const mealPlansCollection = db.collection("MealPlan");
		const mealPlanItemsCollection = db.collection("MealPlanItem");

		const mealPlan = await findMealPlanById(db, mealPlanId, userId);
		if (!mealPlan) return errorResponse("Meal plan not found", 404);

		const mealItem = await mealPlanItemsCollection.findOne({
			_id: new ObjectId(mealId),
			mealPlanId: mealPlanId,
		});
		if (!mealItem) return errorResponse("Meal not found in this plan", 404);

		const result = await mealPlanItemsCollection.deleteOne({
			_id: new ObjectId(mealId),
		});
		if (!result.deletedCount)
			return errorResponse("Failed to remove meal from plan", 500);

		await mealPlansCollection.updateOne(
			{ _id: new ObjectId(mealPlanId) },
			{ $set: { updatedAt: new Date() } },
		);

		return NextResponse.json({
			message: "Meal removed from plan successfully",
		});
	} catch (error) {
		return handleError(error, "Failed to remove meal from plan");
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; mealId: string }> },
) {
	try {
		const userId = await getSessionUserId();
		const { id: mealPlanId, mealId } = await params;

		validateObjectId(mealPlanId, "meal plan ID");
		validateObjectId(mealId, "meal ID");

		const body = await request.json();
		const { date, mealType, servings, notes } = body;

		const db = await getDb();
		const mealPlansCollection = db.collection("MealPlan");
		const mealPlanItemsCollection = db.collection("MealPlanItem");

		const mealPlan = await findMealPlanById(db, mealPlanId, userId);
		if (!mealPlan) return errorResponse("Meal plan not found", 404);

		const mealItem = await mealPlanItemsCollection.findOne({
			_id: new ObjectId(mealId),
			mealPlanId: mealPlanId,
		});
		if (!mealItem) return errorResponse("Meal not found in this plan", 404);

		const updateFields: Record<string, any> = { updatedAt: new Date() };
		if (date !== undefined) updateFields.date = new Date(date);
		if (mealType !== undefined) updateFields.mealType = mealType;
		if (servings !== undefined) updateFields.servings = servings;
		if (notes !== undefined) updateFields.notes = notes;

		const result = await mealPlanItemsCollection.updateOne(
			{ _id: new ObjectId(mealId) },
			{ $set: updateFields },
		);
		if (!result.matchedCount)
			return errorResponse("Failed to update meal", 500);

		await mealPlansCollection.updateOne(
			{ _id: new ObjectId(mealPlanId) },
			{ $set: { updatedAt: new Date() } },
		);

		return NextResponse.json({ id: mealId, ...updateFields });
	} catch (error) {
		return handleError(error, "Failed to update meal");
	}
}
