import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { type NextRequest, NextResponse } from "next/server";

// POST - Create or update a review
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const recipeId = params.id;

		if (!ObjectId.isValid(recipeId)) {
			return NextResponse.json(
				{ error: "Invalid recipe ID format" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { rating, comment } = body;

		if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
			return NextResponse.json(
				{ error: "Rating must be a number between 1 and 5" },
				{ status: 400 },
			);
		}

		const { db } = await connectToDatabase();
		const userId = session.user.id;

		const recipesCollection = db.collection("Recipe");
		const recipe = await recipesCollection.findOne({
			_id: new ObjectId(recipeId),
		});

		if (!recipe) {
			return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
		}

		const reviewsCollection = db.collection("Review");

		const existingReview = await reviewsCollection.findOne({
			userId: userId,
			recipeId: recipeId,
		});

		const now = new Date();

		if (existingReview) {
			await reviewsCollection.updateOne(
				{ _id: existingReview._id },
				{
					$set: {
						rating: rating,
						comment: comment,
						updatedAt: now,
					},
				},
			);

			return NextResponse.json({
				message: "Review updated successfully",
				reviewId: existingReview._id.toString(),
			});
		}

		const result = await reviewsCollection.insertOne({
			userId: userId,
			recipeId: recipeId,
			rating: rating,
			comment: comment,
			createdAt: now,
			updatedAt: now,
		});

		return NextResponse.json({
			message: "Review created successfully",
			reviewId: result.insertedId.toString(),
		});
	} catch (error) {
		console.error("Review submission error:", error);
		return NextResponse.json(
			{
				error: "Failed to submit review",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

// GET - Get a user's review for a recipe
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const recipeId = params.id;

		if (!ObjectId.isValid(recipeId)) {
			return NextResponse.json(
				{ error: "Invalid recipe ID format" },
				{ status: 400 },
			);
		}

		const { db } = await connectToDatabase();
		const userId = session.user.id;

		const reviewsCollection = db.collection("Review");

		const review = await reviewsCollection.findOne({
			userId: userId,
			recipeId: recipeId,
		});

		if (!review) {
			return NextResponse.json({
				message: "No review found",
				hasReview: false,
			});
		}

		return NextResponse.json({
			id: review._id.toString(),
			rating: review.rating,
			comment: review.comment,
			createdAt: review.createdAt,
			updatedAt: review.updatedAt,
			hasReview: true,
		});
	} catch (error) {
		console.error("Review fetch error:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch review",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
