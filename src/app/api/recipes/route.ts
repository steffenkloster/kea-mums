import { getDb } from "@/app/api/_helpers";
import { authOptions } from "@/lib/auth";
import type { FavoriteRecipeModel, Recipe } from "@/types";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search") || "";
		const cuisineType = searchParams.get("cuisineType") || "";
		const mealType = searchParams.get("mealType") || "";
		const difficulty = searchParams.get("difficulty") || "";
		const dietaryCategories = searchParams.getAll("dietaryCategories") || [];
		const page = Number.parseInt(searchParams.get("page") || "1");
		const limit = Number.parseInt(searchParams.get("limit") || "12");
		const skip = (page - 1) * limit;

		const db = await getDb();
		const recipes = db.collection<Recipe>("Recipe");
		const favorites = db.collection<FavoriteRecipeModel>("FavoriteRecipe");

		let filter: Record<string, any> = { isPublic: true };

		if (search) {
			filter = {
				...filter,
				$or: [
					{ title: { $regex: search, $options: "i" } },
					{ description: { $regex: search, $options: "i" } },
				],
			};
		}

		if (cuisineType) {
			filter.cuisineType = cuisineType;
		}

		if (mealType) {
			filter.mealType = mealType;
		}

		if (difficulty) {
			filter.difficulty = difficulty;
		}

		if (dietaryCategories.length > 0) {
			filter.dietaryCategories = { $all: dietaryCategories };
		}

		const totalRecipes = await recipes.countDocuments(filter);

		const recipesList = await recipes
			.find(filter)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.toArray();

		const userFavorites = await favorites
			.find({
				userId: session.user.id,
			})
			.toArray();

		const favoriteIds = userFavorites.map((fav) => fav.recipeId);

		const formattedRecipes = recipesList.map((recipe) => ({
			id: recipe._id.toString(),
			title: recipe.title,
			description: recipe.description,
			imageUrl: recipe.imageUrl || "/images/recipe-placeholder.jpg",
			prepTime: recipe.prepTime,
			cookTime: recipe.cookTime,
			totalTime: recipe.totalTime,
			servings: recipe.servings,
			difficulty: recipe.difficulty,
			cuisineType: recipe.cuisineType,
			mealType: recipe.mealType,
			dietaryCategories: recipe.dietaryCategories || [],
			isFavorite: favoriteIds.includes(recipe._id.toString()),
		}));

		const distinctCuisineTypes = await recipes.distinct("cuisineType", {
			cuisineType: { $exists: true, $ne: "" },
		});
		const distinctMealTypes = await recipes.distinct("mealType", {
			mealType: { $exists: true, $ne: "" },
		});
		const distinctDietaryCategories =
			await recipes.distinct("dietaryCategories");

		const response = {
			recipes: formattedRecipes,
			totalRecipes,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(totalRecipes / limit),
				limit,
			},
			categories: {
				cuisineTypes: distinctCuisineTypes,
				mealTypes: distinctMealTypes,
				dietaryCategories: distinctDietaryCategories,
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Recipes API error:", error);

		return NextResponse.json(
			{
				error: "Failed to fetch recipes",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
