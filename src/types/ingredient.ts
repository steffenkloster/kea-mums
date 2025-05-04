// types/ingredient.ts
// Ingredient-related type definitions

import { ObjectId } from "mongodb";
import type { BaseModel, WithId } from "./common";

// MongoDB Ingredient model
export interface IngredientModel extends BaseModel {
	id: string;
	name: string;
	category?: string;
	imageUrl?: string;
	units: string[];
	alternativeNames: string[];
	nutritionPerUnit?: any;
}

// Frontend Ingredient type
export interface Ingredient extends WithId<Omit<IngredientModel, "_id">> {
	// Frontend-specific properties
}

// MongoDB RecipeIngredient model (join table)
export interface RecipeIngredientModel extends BaseModel {
	recipeId: string;
	ingredientId: string;
	quantity: number;
	unit: string;
	preparation?: string;
	isOptional: boolean;
}

// Frontend RecipeIngredient type
export interface RecipeIngredient {
	id: string;
	name: string;
	quantity: number;
	unit: string;
	preparation?: string;
	isOptional: boolean;
}

// Ingredient category with count for filtering
export interface IngredientCategory {
	name: string;
	count: number;
}

// Pantry item model
export interface PantryItemModel extends BaseModel {
	userId: string;
	ingredientId: string;
	quantity: number;
	unit: string;
	purchaseDate?: Date;
	expirationDate?: Date;
	location?: string;
}

// Frontend Pantry item
export interface PantryItem
	extends WithId<Omit<PantryItemModel, "_id" | "userId" | "ingredientId">> {
	ingredient: {
		id: string;
		name: string;
		imageUrl?: string;
		category?: string;
	};
}

export interface ShoppingList {
	id: string;
	name: string;
	userId: string;
	mealPlan?: {
		id: string;
		name: string;
	};
	items: ShoppingListItem[];
	createdAt: string;
	updatedAt: string;
}

// Shopping list item model
export interface ShoppingListItemModel extends BaseModel {
	shoppingListId: string;
	ingredientId: string;
	quantity: number;
	unit: string;
	isChecked: boolean;
	notes?: string;
}

// Frontend Shopping list item
export interface ShoppingListItem
	extends WithId<
		Omit<ShoppingListItemModel, "_id" | "shoppingListId" | "ingredientId">
	> {
	ingredient: {
		id: string;
		name: string;
		imageUrl?: string;
		category?: string;
	};
}

// Ingredient substitutions
export interface IngredientSubstitution {
	id: string;
	originalIngredientId: string;
	originalIngredientName: string;
	substituteIngredientId: string;
	substituteIngredientName: string;
	conversionRatio: number;
	notes?: string;
}

// Nutrition information
export interface NutritionInfo {
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	sugar?: number;
	sodium?: number;
	fiber?: number;
	servingSize: string;
}
