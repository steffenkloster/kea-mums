import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type {
	FavoriteRecipeModel,
	IngredientModel,
	RecipeIngredientModel,
	RecipeModel,
	ReviewModel,
	UserModel,
} from "@/types";

interface RouteParams {
	params: {
		id: string;
	};
}

// GET a single recipe by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;

		const { db } = await connectToDatabase();

		if (!ObjectId.isValid(id)) {
			return NextResponse.json(
				{ error: "Invalid recipe ID format" },
				{ status: 400 },
			);
		}

		const recipes = db.collection<RecipeModel>("Recipe");
		const recipe = await recipes.findOne({ _id: new ObjectId(id) });

		if (!recipe) {
			return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
		}

		if (!recipe.isPublic && recipe.userId !== session.user.id) {
			return NextResponse.json(
				{ error: "You don't have permission to view this recipe" },
				{ status: 403 },
			);
		}

		const recipeIngredients =
			db.collection<RecipeIngredientModel>("RecipeIngredient");
		const ingredients = db.collection<IngredientModel>("Ingredient");

		const recipeIngredientsData = await recipeIngredients
			.find({
				recipeId: id,
			})
			.toArray();

		const ingredientIds = recipeIngredientsData.map(
			(item) => new ObjectId(item.ingredientId),
		);

		const ingredientDetails = await ingredients
			.find({
				_id: { $in: ingredientIds },
			})
			.toArray();

		const ingredientMap: Record<string, IngredientModel> = {};
		for (const ingredient of ingredientDetails) {
			ingredientMap[ingredient._id.toString()] = ingredient;
		}

		const formattedIngredients = recipeIngredientsData.map((item) => ({
			id: item._id.toString(),
			name: ingredientMap[item.ingredientId]?.name || "Unknown Ingredient",
			quantity: item.quantity,
			unit: item.unit,
			preparation: item.preparation,
			isOptional: item.isOptional,
		}));

		const favorites = db.collection<FavoriteRecipeModel>("FavoriteRecipe");
		const isFavorite = await favorites.findOne({
			userId: session.user.id,
			recipeId: id,
		});

		const reviews = db.collection<ReviewModel>("Review");
		const recipeReviews = await reviews
			.find({
				recipeId: id,
			})
			.sort({ createdAt: -1 })
			.toArray();

		const users = db.collection<UserModel>("User");
		const userIds = recipeReviews.map((review) => new ObjectId(review.userId));

		const usersData = await users
			.find({
				_id: { $in: userIds },
			})
			.toArray();

		const userMap: Record<string, UserModel> = {};
		for (const user of usersData) {
			userMap[user._id.toString()] = user;
		}

		const formattedReviews = recipeReviews.map((review) => ({
			id: review._id.toString(),
			rating: review.rating,
			comment: review.comment,
			createdAt: review.createdAt,
			user: {
				id: review.userId,
				name: userMap[review.userId]?.name || "Anonymous User",
				image: userMap[review.userId]?.image,
			},
		}));

		const averageRating =
			recipeReviews.length > 0
				? recipeReviews.reduce((acc, review) => acc + review.rating, 0) /
					recipeReviews.length
				: 0;

		const recipeUser = await users.findOne({
			_id: new ObjectId(recipe.userId),
		});

		const recipeData = {
			id: recipe._id.toString(),
			title: recipe.title,
			description: recipe.description,
			instructions: recipe.instructions,
			prepTime: recipe.prepTime,
			cookTime: recipe.cookTime,
			totalTime: recipe.totalTime,
			servings: recipe.servings,
			difficulty: recipe.difficulty,
			imageUrl: recipe.imageUrl,
			videoUrl: recipe.videoUrl,
			isPublic: recipe.isPublic,
			nutritionFacts: recipe.nutritionFacts,
			sourceUrl: recipe.sourceUrl,
			notes: recipe.notes,
			cuisineType: recipe.cuisineType,
			mealType: recipe.mealType,
			dishType: recipe.dishType,
			dietaryCategories: recipe.dietaryCategories || [],
			user: {
				id: recipeUser?._id.toString(),
				name: recipeUser?.name || "Unknown User",
				image: recipeUser?.image || "/images/user-placeholder.jpg",
			},
			createdAt: recipe.createdAt,
			updatedAt: recipe.updatedAt,
			ingredients: formattedIngredients,
			reviews: formattedReviews,
			isFavorite: !!isFavorite,
			averageRating,
			reviewsCount: recipeReviews.length,
		};

		return NextResponse.json(recipeData);
	} catch (error) {
		console.error("Recipe detail API error:", error);

		return NextResponse.json(
			{
				error: "Failed to fetch recipe details",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
