import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session || !session.user) {
		throw new Error("Unauthorized");
	}
	return session.user.id;
}

export function validateObjectId(id: string, name = "ID") {
	if (!ObjectId.isValid(id)) {
		throw new Error(`Invalid ${name} format`);
	}
}

export async function getDb() {
	const { db } = await connectToDatabase();
	return db;
}

export function errorResponse(message: string, status = 400) {
	return NextResponse.json({ error: message }, { status });
}

export function handleError(
	error: unknown,
	defaultMessage: string,
	status = 500,
) {
	console.error(defaultMessage, error);
	const message = error instanceof Error ? error.message : defaultMessage;
	return NextResponse.json({ error: defaultMessage, message }, { status });
}

export async function findUserById(db: any, userId: string) {
	const user = await db
		.collection("User")
		.findOne({ _id: new ObjectId(userId) });
	return user;
}

export async function findMealPlanById(
	db: any,
	mealPlanId: string,
	userId: string,
) {
	const mealPlan = await db.collection("MealPlan").findOne({
		_id: new ObjectId(mealPlanId),
		userId,
	});
	return mealPlan;
}

export async function findShoppingListById(
	db: any,
	shoppingListId: string,
	userId: string,
) {
	const shoppingList = await db.collection("ShoppingList").findOne({
		_id: new ObjectId(shoppingListId),
		userId,
	});
	return shoppingList;
}

export async function findRecipeById(db: any, recipeId: string) {
	const recipe = await db
		.collection("Recipe")
		.findOne({ _id: new ObjectId(recipeId) });
	return recipe;
}
