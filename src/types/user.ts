// types/user.ts
// User-related type definitions

import { ObjectId } from "mongodb";
import type { BaseModel, WithId } from "./common";

// MongoDB User model
export interface UserModel extends BaseModel {
	name?: string;
	email?: string;
	emailVerified?: Date;
	password?: string;
	image?: string;
	dietaryPreferences: string[];
}

// Frontend User type
export interface User extends WithId<Omit<UserModel, "_id">> {
	// Frontend-specific properties can be added here
}

// User profile for display
export interface UserProfile {
	id: string;
	name?: string;
	email?: string;
	image?: string;
	dietaryPreferences: string[];
	createdAt: Date;
}

// Types for user settings
export interface UserSettings {
	id: string;
	emailNotifications: boolean;
	weeklyDigest: boolean;
	mealPlanReminders: boolean;
	theme: "light" | "dark" | "system";
	measurementSystem: "metric" | "imperial";
}

// Dashboard user stats
export interface UserStats {
	mealPlans: number;
	savedRecipes: number;
	completedMeals: number;
	createdRecipes: number;
	averageRating?: number;
}

// User preferences
export interface UserPreferences {
	dietaryPreferences: string[];
	excludedIngredients: string[];
	favoriteIngredients: string[];
	favoriteCuisines: string[];
}

// Request body for updating user
export interface UpdateUserRequest {
	name?: string;
	image?: string;
	dietaryPreferences?: string[];
}

// Types for authentication
export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterUserRequest {
	name: string;
	email: string;
	password: string;
	dietaryPreferences?: string[];
}
