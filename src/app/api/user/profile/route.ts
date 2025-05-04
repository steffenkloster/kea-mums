import {
	errorResponse,
	findUserById,
	getDb,
	getSessionUserId,
	handleError,
} from "@/app/api/_helpers";
import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
	try {
		const userId = await getSessionUserId();
		const db = await getDb();

		const user = await findUserById(db, userId);
		if (!user) return errorResponse("User not found", 404);

		const body = await request.json();
		const { name } = body;
		if (!name || typeof name !== "string")
			return errorResponse("Invalid name format", 400);

		const usersCollection = db.collection("User");
		const result = await usersCollection.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { name } },
		);

		if (result.matchedCount === 0)
			return errorResponse("Failed to update preferences", 500);

		return NextResponse.json({ message: "Name updated successfully", name });
	} catch (error) {
		return handleError(error, "Internal server error");
	}
}
