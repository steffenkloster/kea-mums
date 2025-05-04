import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { type NextRequest, NextResponse } from "next/server";

// POST - Generate a meal plan automatically
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { name, days = 7, preferences = [] } = body;

		if (!name) {
			return NextResponse.json(
				{ error: "Meal plan name is required" },
				{ status: 400 },
			);
		}

		const { db } = await connectToDatabase();
		const userId = session.user.id;

		const recipesCollection = db.collection("Recipe");
		const mealPlansCollection = db.collection("MealPlan");
		const mealPlanItemsCollection = db.collection("MealPlanItem");

		// TODO: Make into a constant
		const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];

		const startDate = new Date();
		const endDate = new Date(startDate);
		endDate.setDate(startDate.getDate() + days - 1);

		const now = new Date();
		const mealPlanResult = await mealPlansCollection.insertOne({
			name,
			userId,
			startDate,
			endDate,
			createdAt: now,
			updatedAt: now,
		});

		if (!mealPlanResult.acknowledged) {
			throw new Error("Failed to create meal plan");
		}

		const mealPlanId = mealPlanResult.insertedId.toString();

		const recipeQuery: any = { isPublic: true };

		if (preferences && preferences.length > 0) {
			recipeQuery.dietaryCategories = { $in: preferences };
		}

		const mealPlanItems = [];

		for (let i = 0; i < days; i++) {
			const dayDate = new Date(startDate);
			dayDate.setDate(startDate.getDate() + i);

			for (const mealType of MEAL_TYPES) {
				const typeQuery: any = { ...recipeQuery };

				if (mealType === "Breakfast") {
					typeQuery.mealType = "Breakfast";
				} else if (mealType === "Lunch") {
					typeQuery.mealType = { $in: ["Lunch", "Any", null] };
				} else if (mealType === "Dinner") {
					typeQuery.mealType = { $in: ["Dinner", "Any", null] };
				}

				const recipes = await recipesCollection
					.aggregate([
						{ $match: typeQuery },
						{ $sample: { size: 1 } }, // Get a random recipe
						{ $project: { _id: 1, servings: 1 } },
					])
					.toArray();

				if (recipes.length > 0) {
					const recipe = recipes[0];

					const mealDate = new Date(dayDate);

					if (mealType === "Breakfast") {
						mealDate.setHours(8, 0, 0, 0);
					} else if (mealType === "Lunch") {
						mealDate.setHours(13, 0, 0, 0);
					} else if (mealType === "Dinner") {
						mealDate.setHours(19, 0, 0, 0);
					}

					mealPlanItems.push({
						mealPlanId,
						recipeId: recipe._id.toString(),
						date: mealDate,
						mealType,
						servings: recipe.servings || 2,
						notes: null,
						createdAt: now,
						updatedAt: now,
					});
				}
			}
		}

		if (mealPlanItems.length > 0) {
			await mealPlanItemsCollection.insertMany(mealPlanItems);
		}

		return NextResponse.json({
			id: mealPlanId,
			name,
			startDate,
			endDate,
			mealCount: mealPlanItems.length,
			message: "Meal plan generated successfully",
		});
	} catch (error) {
		console.error("Meal plan generation error:", error);
		return NextResponse.json(
			{
				error: "Failed to generate meal plan",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
