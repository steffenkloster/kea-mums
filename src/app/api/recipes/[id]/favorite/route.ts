import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import type { FavoriteRecipeModel, Recipe } from "@/types";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface RouteParams {
	params: {
		id: string;
	};
}

// POST to add a recipe to favorites
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;
		const userId = session.user.id;

		const { db } = await connectToDatabase();

		if (!ObjectId.isValid(id)) {
			return NextResponse.json(
				{ error: "Invalid recipe ID format" },
				{ status: 400 },
			);
		}

		const recipes = db.collection<Recipe>("Recipe");
		const recipe = await recipes.findOne({ _id: new ObjectId(id) });

		if (!recipe) {
			return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
		}

		const favorites = db.collection<FavoriteRecipeModel>("FavoriteRecipe");
		const existingFavorite = await favorites.findOne({
			userId: userId,
			recipeId: id,
		});

		if (existingFavorite) {
			return NextResponse.json(
				{ message: "Recipe is already in favorites" },
				{ status: 200 },
			);
		}

		const result = await favorites.insertOne({
			userId: userId,
			recipeId: id,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return NextResponse.json({
			message: "Recipe added to favorites",
			id: result.insertedId,
		});
	} catch (error) {
		console.error("Add to favorites API error:", error);

		return NextResponse.json(
			{
				error: "Failed to add recipe to favorites",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

// DELETE to remove a recipe from favorites
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;
		const userId = session.user.id;

		const { db } = await connectToDatabase();

		if (!ObjectId.isValid(id)) {
			return NextResponse.json(
				{ error: "Invalid recipe ID format" },
				{ status: 400 },
			);
		}

		const favorites = db.collection<FavoriteRecipeModel>("FavoriteRecipe");
		const result = await favorites.deleteOne({
			userId: userId,
			recipeId: id,
		});

		if (result.deletedCount === 0) {
			return NextResponse.json(
				{ message: "Recipe was not in favorites" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			message: "Recipe removed from favorites",
		});
	} catch (error) {
		console.error("Remove from favorites API error:", error);

		return NextResponse.json(
			{
				error: "Failed to remove recipe from favorites",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
