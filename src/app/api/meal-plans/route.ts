import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { type NextRequest, NextResponse } from "next/server";

// GET - Get all meal plans for the authenticated user
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { db } = await connectToDatabase();
		const userId = session.user.id;

		const mealPlansCollection = db.collection("MealPlan");

		const mealPlans = await mealPlansCollection
			.find({ userId: userId })
			.sort({ createdAt: -1 })
			.toArray();

		const formattedMealPlans = mealPlans.map((plan) => ({
			id: plan._id.toString(),
			name: plan.name,
			startDate: plan.startDate,
			endDate: plan.endDate,
			createdAt: plan.createdAt,
			updatedAt: plan.updatedAt,
		}));

		return NextResponse.json(formattedMealPlans);
	} catch (error) {
		console.error("Meal plans fetch error:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch meal plans",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}

// POST - Create a new meal plan
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { name, startDate, endDate } = body;

		if (!name || !startDate || !endDate) {
			return NextResponse.json(
				{
					error: "Missing required fields",
					details: [
						!name && { path: ["name"], message: "Name is required" },
						!startDate && {
							path: ["startDate"],
							message: "Start date is required",
						},
						!endDate && { path: ["endDate"], message: "End date is required" },
					].filter(Boolean),
				},
				{ status: 400 },
			);
		}

		const { db } = await connectToDatabase();
		const userId = session.user.id;

		const mealPlansCollection = db.collection("MealPlan");

		const now = new Date();
		const result = await mealPlansCollection.insertOne({
			name,
			startDate: new Date(startDate),
			endDate: new Date(endDate),
			userId,
			createdAt: now,
			updatedAt: now,
		});

		if (!result.acknowledged) {
			throw new Error("Failed to create meal plan");
		}

		return NextResponse.json({
			id: result.insertedId.toString(),
			name,
			startDate,
			endDate,
			createdAt: now,
			updatedAt: now,
		});
	} catch (error) {
		console.error("Meal plan creation error:", error);
		return NextResponse.json(
			{
				error: "Failed to create meal plan",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
