// types/recipe.ts
// Recipe-related type definitions using common utility types

import { ObjectId } from "mongodb";
import {
	type BaseModel,
	type ListResponse,
	PaginationData,
	type WithId,
} from "./common";
import type { RecipeIngredient } from "./ingredient";
import type { UserProfile } from "./user";

// ===== MongoDB Models =====

export interface RecipeModel extends BaseModel {
	title: string;
	description?: string;
	instructions: string[];
	prepTime: number;
	cookTime: number;
	totalTime: number;
	servings: number;
	difficulty?: string;
	imageUrl?: string;
	videoUrl?: string;
	isPublic: boolean;
	nutritionFacts?: any;
	sourceUrl?: string;
	notes?: string;
	cuisineType?: string;
	mealType?: string;
	dishType?: string;
	dietaryCategories: string[];
	userId: string;
}

export interface ReviewModel extends BaseModel {
	rating: number;
	comment?: string;
	userId: string;
	recipeId: string;
}

export interface FavoriteRecipeModel extends BaseModel {
	userId: string;
	recipeId: string;
}

export interface CollectionModel extends BaseModel {
	name: string;
	description?: string;
	imageUrl?: string;
	isPublic: boolean;
	userId: string;
}

export interface CollectionRecipeModel extends BaseModel {
	collectionId: string;
	recipeId: string;
}

export interface MealPlanModel extends BaseModel {
	name: string;
	startDate: Date;
	endDate: Date;
	userId: string;
}

export interface MealPlanItemModel extends BaseModel {
	date: Date;
	mealType: string;
	servings: number;
	notes?: string;
	mealPlanId: string;
	recipeId: string;
}

// ===== Frontend Types =====

// Base recipe type with common properties
export interface Recipe extends WithId<Omit<RecipeModel, "_id" | "userId">> {
	isFavorite: boolean;
	favoriteDate?: Date;
}

// Extended recipe detail type
export interface RecipeDetail extends Recipe {
	ingredients: RecipeIngredient[];
	reviews: RecipeReview[];
	author: UserProfile;
	averageRating: number;
	reviewsCount: number;
}

// Review with user information
export interface RecipeReview
	extends WithId<Omit<ReviewModel, "_id" | "userId" | "recipeId">> {
	user: {
		id: string;
		name: string;
		image?: string;
	};
}

// Collection of recipes
export interface Collection
	extends WithId<Omit<CollectionModel, "_id" | "userId">> {
	recipeCount: number;
	recipes?: Recipe[];
}

// Meal plan with recipes
export interface MealPlan
	extends WithId<Omit<MealPlanModel, "_id" | "userId">> {
	meals: MealPlanItem[];
}

export interface MealPlanItem
	extends WithId<Omit<MealPlanItemModel, "_id" | "mealPlanId" | "recipeId">> {
	recipe: {
		id: string;
		title: string;
		imageUrl?: string;
		prepTime: number;
		cookTime: number;
	};
}

// ===== Request & Response Types =====

export interface FilterState {
	cuisineType: string;
	mealType: string;
	dietaryCategories: string[];
	difficulty: string;
}

export interface CategoryOptions {
	cuisineTypes: string[];
	mealTypes: string[];
	dietaryCategories: string[];
	difficulties?: string[];
}

export interface RecipesData extends ListResponse<Recipe> {
	categories: CategoryOptions;
}

export interface CreateRecipeRequest {
	title: string;
	description?: string;
	instructions: string[];
	prepTime: number;
	cookTime: number;
	servings: number;
	difficulty?: string;
	imageUrl?: string;
	videoUrl?: string;
	isPublic: boolean;
	nutritionFacts?: any;
	sourceUrl?: string;
	notes?: string;
	cuisineType?: string;
	mealType?: string;
	dishType?: string;
	dietaryCategories: string[];
	ingredients: {
		ingredientId: string;
		quantity: number;
		unit: string;
		preparation?: string;
		isOptional: boolean;
	}[];
}

export interface UpdateRecipeRequest extends Partial<CreateRecipeRequest> {
	id: string;
}

export interface CreateReviewRequest {
	recipeId: string;
	rating: number;
	comment?: string;
}

export interface UpdateReviewRequest {
	id: string;
	rating?: number;
	comment?: string;
}

// ===== Utility Types Using TypeScript Features =====

// Type for recipe search params
export type RecipeSearchParams = Partial<FilterState> & {
	search?: string;
	page?: number;
	limit?: number;
	sort?: string;
	order?: "asc" | "desc";
};

// Type for recipe with optional fields
export type PartialRecipe = Partial<Recipe>;

// Type for creating a recipe draft
export type RecipeDraft = Omit<CreateRecipeRequest, "isPublic"> & {
	isDraft: boolean;
};

// Type for a minimal recipe card display
export type RecipeCard = Pick<
	Recipe,
	| "id"
	| "description"
	| "title"
	| "imageUrl"
	| "prepTime"
	| "cookTime"
	| "difficulty"
	| "dietaryCategories"
	| "isFavorite"
>;

// Union type for recipe difficulty
export type RecipeDifficulty = "Easy" | "Medium" | "Hard";

// Union type for meal types
export type MealType =
	| "Breakfast"
	| "Lunch"
	| "Dinner"
	| "Snack"
	| "Dessert"
	| "Drink";
