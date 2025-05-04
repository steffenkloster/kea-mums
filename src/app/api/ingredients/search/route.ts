import { getDb } from "@/app/api/_helpers";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const searchParams = request.nextUrl.searchParams;
		const query = searchParams.get("query") || "";
		const limit = Number.parseInt(searchParams.get("limit") || "10");
		const category = searchParams.get("category") || null;

		const db = await getDb();

		const searchQuery: any = {};

		if (query && query.trim() !== "") {
			searchQuery.$or = [
				{ name: { $regex: query, $options: "i" } },
				{ alternativeNames: { $elemMatch: { $regex: query, $options: "i" } } },
			];
		}

		if (category) {
			searchQuery.category = category;
		}

		const ingredientsCollection = db.collection("Ingredient");

		const ingredients = await ingredientsCollection
			.find(searchQuery)
			.limit(limit)
			.toArray();

		const formattedIngredients = ingredients.map((ingredient) => ({
			id: ingredient._id.toString(),
			name: ingredient.name,
			category: ingredient.category,
			units: ingredient.units || [],
			imageUrl: ingredient.imageUrl,
		}));

		return NextResponse.json(formattedIngredients);
	} catch (error) {
		console.error("Ingredient search error:", error);
		return NextResponse.json(
			{
				error: "Failed to search ingredients",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
