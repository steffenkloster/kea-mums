import {
	errorResponse,
	findMealPlanById,
	findRecipeById,
	getDb,
	getSessionUserId,
	handleError,
	validateObjectId,
} from "@/app/api/_helpers";
import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await getSessionUserId();
		const { id: mealPlanId } = await params;

		validateObjectId(mealPlanId, "meal plan ID");

		const body = await request.json();
		const { recipeId, date, mealType, servings, notes } = body;

		const missingFields = [];
		if (!recipeId)
			missingFields.push({
				path: ["recipeId"],
				message: "Recipe ID is required",
			});
		if (!date)
			missingFields.push({ path: ["date"], message: "Date is required" });
		if (!mealType)
			missingFields.push({
				path: ["mealType"],
				message: "Meal type is required",
			});
		if (missingFields.length > 0) {
			return NextResponse.json(
				{ error: "Missing required fields", details: missingFields },
				{ status: 400 },
			);
		}

		validateObjectId(recipeId, "recipe ID");

		const db = await getDb();
		const mealPlan = await findMealPlanById(db, mealPlanId, userId);
		if (!mealPlan) return errorResponse("Meal plan not found", 404);

		const recipe = await findRecipeById(db, recipeId);
		if (!recipe) return errorResponse("Recipe not found", 404);

		const now = new Date();
		const mealPlanItem = {
			mealPlanId,
			recipeId,
			date: new Date(date),
			mealType,
			servings: servings || recipe.servings || 1,
			notes: notes || null,
			createdAt: now,
			updatedAt: now,
		};

		const mealPlanItemsCollection = db.collection("MealPlanItem");
		const mealPlansCollection = db.collection("MealPlan");

		const result = await mealPlanItemsCollection.insertOne(mealPlanItem);
		if (!result.acknowledged) throw new Error("Failed to add meal to plan");

		await mealPlansCollection.updateOne(
			{ _id: new ObjectId(mealPlanId) },
			{ $set: { updatedAt: now } },
		);

		return NextResponse.json({
			id: result.insertedId.toString(),
			mealPlanId,
			date,
			mealType,
			servings: mealPlanItem.servings,
			notes: mealPlanItem.notes,
			recipe: {
				id: recipeId,
				title: recipe.title,
				imageUrl: recipe.imageUrl,
			},
			createdAt: now,
			updatedAt: now,
		});
	} catch (error) {
		return handleError(error, "Failed to add meal to plan");
	}
}
