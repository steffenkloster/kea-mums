// types/common.ts
// Common types used across multiple domains

import type { ObjectId } from "mongodb";

// Reusable pagination types
export interface PaginationParams {
	page: number;
	limit: number;
}

export interface PaginationData {
	currentPage: number;
	totalPages: number;
	limit: number;
	totalItems: number;
}

// Generic API response types
export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message?: string;
}

export interface ApiErrorResponse {
	error: string;
	message: string;
	statusCode: number;
}

// Common MongoDB model fields
export interface BaseModel {
	_id?: ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

// Utility type to convert MongoDB models to frontend types
export type WithId<T> = T & { id: string };

// Type for API query parameters
export interface QueryParams {
	[key: string]: string | string[] | number | boolean | undefined;
}

// Sorting options
export type SortDirection = "asc" | "desc";

export interface SortOption {
	field: string;
	direction: SortDirection;
}

// Generic types for different API endpoints
export interface ListResponse<T> {
	items: T[];
	pagination: PaginationData;
}

export interface CreateResponse<T> {
	item: T;
	success: boolean;
	message?: string;
}

export interface UpdateResponse<T> {
	item: T;
	success: boolean;
	message?: string;
}
