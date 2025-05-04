import { getDb } from "@/app/api/_helpers";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import { type NextRequest, NextResponse } from "next/server";

// GET - Search for recipes
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const searchParams = request.nextUrl.searchParams;
		const query = searchParams.get("query") || "";
		const limit = Number.parseInt(searchParams.get("limit") || "10");
		const mealType = searchParams.get("mealType") || null;
		const cuisineType = searchParams.get("cuisineType") || null;
		const dishType = searchParams.get("dishType") || null;
		const dietaryCategories = searchParams.getAll("dietary") || [];

		const db = await getDb();

		const searchQuery: any = {
			isPublic: true,
		};

		if (query && query.trim() !== "") {
			searchQuery.$or = [
				{ title: { $regex: query, $options: "i" } },
				{ description: { $regex: query, $options: "i" } },
			];
		}

		if (mealType) {
			searchQuery.mealType = mealType;
		}

		if (cuisineType) {
			searchQuery.cuisineType = cuisineType;
		}

		if (dishType) {
			searchQuery.dishType = dishType;
		}

		if (dietaryCategories.length > 0) {
			searchQuery.dietaryCategories = { $all: dietaryCategories };
		}

		const recipesCollection = db.collection("Recipe");

		const recipes = await recipesCollection
			.find(searchQuery)
			.project({
				_id: 1,
				title: 1,
				imageUrl: 1,
				prepTime: 1,
				cookTime: 1,
				totalTime: 1,
				servings: 1,
				mealType: 1,
				cuisineType: 1,
				dishType: 1,
				dietaryCategories: 1,
			})
			.limit(limit)
			.toArray();

		const formattedRecipes = recipes.map((recipe) => ({
			id: recipe._id.toString(),
			title: recipe.title,
			imageUrl: recipe.imageUrl,
			prepTime: recipe.prepTime,
			cookTime: recipe.cookTime,
			totalTime: recipe.totalTime,
			servings: recipe.servings,
			mealType: recipe.mealType,
			cuisineType: recipe.cuisineType,
			dishType: recipe.dishType,
			dietaryCategories: recipe.dietaryCategories || [],
		}));

		return NextResponse.json(formattedRecipes);
	} catch (error) {
		console.error("Recipe search error:", error);
		return NextResponse.json(
			{
				error: "Failed to search recipes",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
