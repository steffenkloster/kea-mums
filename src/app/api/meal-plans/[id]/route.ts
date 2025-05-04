import { getDb } from "@/app/api/_helpers";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { type NextRequest, NextResponse } from "next/server";

// GET - Get a single meal plan by ID with its meal items
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const mealPlanId = params.id;

		if (!ObjectId.isValid(mealPlanId)) {
			return NextResponse.json(
				{ error: "Invalid meal plan ID format" },
				{ status: 400 },
			);
		}

		const db = await getDb();
		const userId = session.user.id;

		const mealPlansCollection = db.collection("MealPlan");
		const mealPlanItemsCollection = db.collection("MealPlanItem");
		const recipesCollection = db.collection("Recipe");

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

		const mealItems = await mealPlanItemsCollection
			.find({ mealPlanId: mealPlanId })
			.toArray();

		const recipeIds = mealItems.map((item) => new ObjectId(item.recipeId));
		const recipes =
			recipeIds.length > 0
				? await recipesCollection
						.find({ _id: { $in: recipeIds } })
						.project({
							_id: 1,
							title: 1,
							imageUrl: 1,
							prepTime: 1,
							cookTime: 1,
							totalTime: 1,
							dietaryCategories: 1,
						})
						.toArray()
				: [];

		const recipesMap: Record<string, any> = {};
		for (const recipe of recipes) {
			recipesMap[recipe._id.toString()] = recipe;
		}

		const formattedMealItems = mealItems.map((item) => {
			const recipe = recipesMap[item.recipeId] || {};
			return {
				id: item._id.toString(),
				date: item.date,
				mealType: item.mealType,
				servings: item.servings,
				notes: item.notes,
				recipe: {
					id: recipe._id?.toString() || item.recipeId,
					title: recipe.title || "Unknown Recipe",
					imageUrl: recipe.imageUrl,
					prepTime: recipe.prepTime,
					cookTime: recipe.cookTime,
					totalTime: recipe.totalTime,
					dietaryCategories: recipe.dietaryCategories || [],
				},
			};
		});

		const formattedMealPlan = {
			id: mealPlan._id.toString(),
			name: mealPlan.name,
			startDate: mealPlan.startDate,
			endDate: mealPlan.endDate,
			mealItems: formattedMealItems,
			createdAt: mealPlan.createdAt,
			updatedAt: mealPlan.updatedAt,
		};

		return NextResponse.json(formattedMealPlan);
	} catch (error) {
		console.error("Meal plan fetch error:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch meal plan",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

// PATCH - Update a meal plan
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const mealPlanId = params.id;

		if (!ObjectId.isValid(mealPlanId)) {
			return NextResponse.json(
				{ error: "Invalid meal plan ID format" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { name, startDate, endDate } = body;

		const db = await getDb();
		const userId = session.user.id;

		const mealPlansCollection = db.collection("MealPlan");

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

		const updateFields: Record<string, any> = {
			updatedAt: new Date(),
		};

		if (name !== undefined) updateFields.name = name;
		if (startDate !== undefined) updateFields.startDate = new Date(startDate);
		if (endDate !== undefined) updateFields.endDate = new Date(endDate);

		const result = await mealPlansCollection.updateOne(
			{ _id: new ObjectId(mealPlanId) },
			{ $set: updateFields },
		);

		if (!result.matchedCount) {
			return NextResponse.json(
				{ error: "Meal plan not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			id: mealPlanId,
			...updateFields,
		});
	} catch (error) {
		console.error("Meal plan update error:", error);
		return NextResponse.json(
			{
				error: "Failed to update meal plan",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

// DELETE - Delete a meal plan
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const mealPlanId = params.id;

		if (!ObjectId.isValid(mealPlanId)) {
			return NextResponse.json(
				{ error: "Invalid meal plan ID format" },
				{ status: 400 },
			);
		}

		const db = await getDb();
		const userId = session.user.id;

		const mealPlansCollection = db.collection("MealPlan");
		const mealPlanItemsCollection = db.collection("MealPlanItem");

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

		await mealPlanItemsCollection.deleteMany({ mealPlanId: mealPlanId });

		const result = await mealPlansCollection.deleteOne({
			_id: new ObjectId(mealPlanId),
		});

		if (!result.deletedCount) {
			return NextResponse.json(
				{ error: "Failed to delete meal plan" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ message: "Meal plan deleted successfully" });
	} catch (error) {
		console.error("Meal plan deletion error:", error);
		return NextResponse.json(
			{
				error: "Failed to delete meal plan",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
