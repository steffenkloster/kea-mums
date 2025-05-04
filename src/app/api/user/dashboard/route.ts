import {
	errorResponse,
	findUserById,
	getDb,
	getSessionUserId,
	handleError,
} from "@/app/api/_helpers";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const userId = await getSessionUserId();
		const db = await getDb();

		const user = await findUserById(db, userId);
		if (!user) return errorResponse("User not found", 404);

		const recipes = db.collection("Recipe");
		const favorites = db.collection("FavoriteRecipe");
		const mealPlans = db.collection("MealPlan");

		const savedRecipesCount = await favorites.countDocuments({ userId });
		const mealPlansCount = await mealPlans.countDocuments({ userId });
		const completedMealsCount = 0; // TODO: Implement logic to count completed meals

		const userDietaryPreferences = user.dietaryPreferences || [];

		let recommendedRecipes = await recipes
			.find({
				dietaryCategories: { $in: userDietaryPreferences },
				isPublic: true,
			})
			.limit(3)
			.toArray();

		if (recommendedRecipes.length < 3) {
			const additionalRecipes = await recipes
				.find({
					isPublic: true,
					_id: { $nin: recommendedRecipes.map((r) => r._id) },
				})
				.sort({ createdAt: -1 })
				.limit(3 - recommendedRecipes.length)
				.toArray();
			recommendedRecipes = [...recommendedRecipes, ...additionalRecipes];
		}

		const formattedRecommendations = recommendedRecipes.map((recipe) => ({
			id: recipe._id.toString(),
			title: recipe.title,
			imageUrl: recipe.imageUrl || "/images/recipe-placeholder.jpg",
			prepTime: `${recipe.prepTime} mins`,
			nutritionFacts: recipe.nutritionFacts || {},
			dietaryCategories: recipe.dietaryCategories || [],
		}));

		const recentFavorites = await favorites
			.find({ userId })
			.sort({ createdAt: -1 })
			.limit(5)
			.toArray();
		const recentMealPlans = await mealPlans
			.find({ userId })
			.sort({ createdAt: -1 })
			.limit(5)
			.toArray();

		const recipeIds = recentFavorites.map((fav) => new ObjectId(fav.recipeId));
		const recipesMap: Record<string, any> = {};
		if (recipeIds.length > 0) {
			const recipeDetails = await recipes
				.find({ _id: { $in: recipeIds } })
				.toArray();
			for (const recipe of recipeDetails) {
				recipesMap[recipe._id.toString()] = recipe;
			}
		}

		const favoriteActivities = recentFavorites.map((favorite) => ({
			id: favorite._id.toString(),
			type: "recipe_saved",
			description: `Saved ${recipesMap[favorite.recipeId]?.title || "a recipe"} to favorites`,
			date: favorite.createdAt,
			icon: "heart",
		}));

		const mealPlanActivities = recentMealPlans.map((plan) => ({
			id: plan._id.toString(),
			type: "meal_plan_created",
			description: `Created meal plan: ${plan.name}`,
			date: plan.createdAt,
			icon: "calendar",
		}));

		const allActivities = [...favoriteActivities, ...mealPlanActivities]
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 5);

		const formattedActivities = allActivities.map((activity) => ({
			...activity,
			date: new Date(activity.date).toISOString(),
		}));

		return NextResponse.json({
			user: {
				id: user._id.toString(),
				name: user.name,
				email: user.email,
				dietaryPreferences: user.dietaryPreferences || [],
				createdAt: user.createdAt,
			},
			stats: {
				mealPlans: mealPlansCount,
				savedRecipes: savedRecipesCount,
				completedMeals: completedMealsCount,
			},
			recommendations: formattedRecommendations,
			recentActivity: formattedActivities,
		});
	} catch (error) {
		return handleError(error, "Failed to fetch dashboard data");
	}
}
