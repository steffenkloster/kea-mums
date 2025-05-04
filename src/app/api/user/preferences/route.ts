import {
	errorResponse,
	getDb,
	getSessionUserId,
	handleError,
} from "@/app/api/_helpers";
import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
	try {
		const userId = await getSessionUserId();
		const body = await req.json();
		const { dietaryPreferences } = body;

		if (
			!Array.isArray(dietaryPreferences) ||
			!dietaryPreferences.every((pref) => typeof pref === "string")
		) {
			return errorResponse("Invalid dietary preferences format", 400);
		}

		if (!ObjectId.isValid(userId)) {
			return errorResponse("Invalid user ID", 400);
		}

		const db = await getDb();
		const usersCollection = db.collection("User");

		const result = await usersCollection.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { dietaryPreferences } },
		);

		if (result.matchedCount === 0) {
			return errorResponse("User not found", 404);
		}

		return NextResponse.json({ message: "Preferences updated successfully" });
	} catch (error) {
		return handleError(error, "Internal server error");
	}
}
