import {
	errorResponse,
	findMealPlanById,
	findRecipeById,
	getDb,
	getSessionUserId,
	handleError,
	validateObjectId,
} from "@/app/api/_helpers";
import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";

// export async function DELETE(
// 	request: NextRequest,
// 	{ params }: { params: Promise<{ id: string }> },
// ) {
// 	try {
// 		// Reuse DELETE from meal-plans/[id]/meals/[mealId]
// 		// Just call that handler or duplicate logic here
// 		// For now, reuse logic by importing the handler
// 		const { DELETE: deleteMeal } = await import(
// 			"@/app/api/meal-plans/[id]/meals/[mealId]/route"
// 		);
// 		return await deleteMeal(request, { params });
// 	} catch (error) {
// 		return handleError(error, "Failed to remove meal from plan");
// 	}
// }

// export async function PATCH(
// 	request: NextRequest,
// 	{ params }: { params: { id: string; mealId: string } },
// ) {
// 	try {
// 		// Reuse PATCH from meal-plans/[id]/meals/[mealId]
// 		const { PATCH: patchMeal } = await import(
// 			"@/app/api/meal-plans/[id]/meals/[mealId]/route"
// 		);
// 		return await patchMeal(request, { params });
// 	} catch (error) {
// 		return handleError(error, "Failed to update meal");
// 	}
// }

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await getSessionUserId();
		const { id: mealPlanId } = await params;

		validateObjectId(mealPlanId, "meal plan ID");

		const body = await request.json();
		const { name } = body;

		if (!name) return errorResponse("Shopping list name is required", 400);

		const db = await getDb();
		const mealPlan = await findMealPlanById(db, mealPlanId, userId);
		if (!mealPlan) return errorResponse("Meal plan not found", 404);

		const mealPlanItemsCollection = db.collection("MealPlanItem");
		const recipesCollection = db.collection("Recipe");
		const recipeIngredientsCollection = db.collection("RecipeIngredient");
		const ingredientsCollection = db.collection("Ingredient");
		const shoppingListCollection = db.collection("ShoppingList");
		const shoppingListItemCollection = db.collection("ShoppingListItem");
		const mealPlansCollection = db.collection("MealPlan");

		const mealItems = await mealPlanItemsCollection
			.find({ mealPlanId })
			.toArray();
		if (mealItems.length === 0)
			return errorResponse("Meal plan has no meals", 400);

		const recipeIds = mealItems.map((item) => item.recipeId);
		const recipeIngredients = await recipeIngredientsCollection
			.find({ recipeId: { $in: recipeIds } })
			.toArray();
		if (recipeIngredients.length === 0)
			return errorResponse(
				"No ingredients found for recipes in this meal plan",
				400,
			);

		const ingredientIds = recipeIngredients.map(
			(ri) => new ObjectId(ri.ingredientId),
		);
		const ingredients = await ingredientsCollection
			.find({ _id: { $in: ingredientIds } })
			.toArray();

		const recipes = await recipesCollection
			.find({ _id: { $in: recipeIds.map((id) => new ObjectId(id)) } })
			.project({ _id: 1, servings: 1 })
			.toArray();

		const recipeServingsMap: Record<string, number> = {};
		for (const recipe of recipes) {
			recipeServingsMap[recipe._id.toString()] = recipe.servings || 1;
		}

		const mealServingsMap: Record<string, number> = {};
		for (const item of mealItems) {
			mealServingsMap[item.recipeId] =
				(mealServingsMap[item.recipeId] || 0) + (item.servings || 1);
		}

		const consolidatedIngredients: Record<
			string,
			{
				ingredientId: string;
				name: string;
				quantity: number;
				unit: string;
				category: string;
			}
		> = {};

		for (const ri of recipeIngredients) {
			if (ri.isOptional) continue;

			const ingredient = ingredients.find(
				(ing) => ing._id.toString() === ri.ingredientId,
			);
			if (!ingredient) continue;

			const recipeId = ri.recipeId;
			const originalServings = recipeServingsMap[recipeId] || 1;
			const targetServings = mealServingsMap[recipeId] || 0;
			if (targetServings === 0) continue;

			const scalingFactor = targetServings / originalServings;
			const scaledQuantity = ri.quantity * scalingFactor;
			const key = `${ri.ingredientId}_${ri.unit}`;

			if (consolidatedIngredients[key]) {
				consolidatedIngredients[key].quantity += scaledQuantity;
			} else {
				consolidatedIngredients[key] = {
					ingredientId: ri.ingredientId,
					name: ingredient.name,
					quantity: scaledQuantity,
					unit: ri.unit,
					category: ingredient.category,
				};
			}
		}

		const now = new Date();
		const shoppingListResult = await shoppingListCollection.insertOne({
			name,
			userId,
			mealPlanId,
			createdAt: now,
			updatedAt: now,
		});
		if (!shoppingListResult.acknowledged)
			throw new Error("Failed to create shopping list");

		const shoppingListId = shoppingListResult.insertedId.toString();

		const shoppingListItems = Object.values(consolidatedIngredients).map(
			(ci) => ({
				shoppingListId,
				ingredientId: ci.ingredientId,
				quantity: ci.quantity,
				unit: ci.unit,
				isChecked: false,
				notes: null,
				createdAt: now,
				updatedAt: now,
			}),
		);

		if (shoppingListItems.length > 0) {
			await shoppingListItemCollection.insertMany(shoppingListItems);
		}

		await mealPlansCollection.updateOne(
			{ _id: new ObjectId(mealPlanId) },
			{ $set: { updatedAt: now } },
		);

		return NextResponse.json({
			id: shoppingListId,
			name,
			mealPlanId,
			itemCount: shoppingListItems.length,
			createdAt: now,
			message: "Shopping list created successfully",
		});
	} catch (error) {
		return handleError(error, "Failed to generate shopping list");
	}
}
