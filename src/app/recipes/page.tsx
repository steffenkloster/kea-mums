"use client";

import { useApi } from "@/hooks/useApi";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeFilters from "@/components/recipes/RecipeFilters";
import RecipeSearchBar from "@/components/recipes/RecipeSearchBar";

import type {
	FilterState,
	RecipeCard as RecipeCardType,
	RecipesData,
} from "@/types";

import { FunnelIcon, PlusIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { ClipboardIcon } from "@heroicons/react/24/outline";

export default function RecipesPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState<string>("");
	const [filters, setFilters] = useState<FilterState>({
		cuisineType: "",
		mealType: "",
		dietaryCategories: [],
		difficulty: "",
	});
	const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

	const {
		data: recipesData,
		error,
		isLoading: isDataLoading,
		makeRequest: fetchRecipesData,
	} = useApi<RecipesData>({
		url: "/api/recipes",
		method: "GET",
		query: {
			search: searchQuery,
			...filters,
			cacheBuster: "",
		},
		cache: true, // Enable caching to prevent redundant requests
	});

	const isPageLoading = status === "loading" || isDataLoading;

	const fetchData = useCallback(() => {
		console.log(`Fetching with query: ${searchQuery}, filters:`, filters);

		if (status === "authenticated") {
			fetchRecipesData();
		}
	}, [status, fetchRecipesData, searchQuery, filters]);

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}

		if (status === "authenticated") {
			fetchData();
		}
	}, [status, router, fetchData]);

	const handleSearchChange = (query: string) => {
		setSearchQuery(query);
	};

	const handleFilterChange = (newFilters: Partial<FilterState>) => {
		setFilters((prevFilters) => ({
			...prevFilters,
			...newFilters,
		}));
	};

	const handleToggleFavorite = async (
		recipeId: string,
		isFavorite: boolean,
	): Promise<void> => {
		try {
			const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
				method: isFavorite ? "DELETE" : "POST",
				headers: { "Content-Type": "application/json" },
			});

			if (response.ok) {
				// Force a cache-busting refetch by adding a timestamp
				fetchRecipesData({ cacheBuster: Date.now() });
			}
		} catch (error) {
			console.error("Error toggling favorite:", error);
		}
	};

	if (isPageLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-screen">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
				</div>
			</DashboardLayout>
		);
	}

	if (error) {
		return (
			<DashboardLayout>
				<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
					<div className="flex">
						<div className="flex-shrink-0">
							<XCircleIcon className="h-5 w-5 text-red-400" />
						</div>
						<div className="ml-3">
							<p className="text-sm text-red-700">
								There was an error loading recipes. Please try refreshing the
								page.
							</p>
						</div>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	const { recipes = [], totalRecipes = 0, categories = {} } = recipesData || {};

	return (
		<DashboardLayout>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
							<p className="text-gray-600 mt-1">
								Explore {totalRecipes} delicious recipes
							</p>
						</div>
						<div className="mt-4 md:mt-0">
							<Link
								href="/recipes/create"
								className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
							>
								<PlusIcon className="-ml-1 mr-2 h-5 w-5" />
								Create Recipe
							</Link>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="md:col-span-3">
							<RecipeSearchBar
								onSearch={handleSearchChange}
								initialQuery={searchQuery}
							/>
						</div>
						<div className="md:col-span-1">
							<button
								type="button"
								className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
								onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
							>
								<div className="flex items-center justify-center">
									<FunnelIcon className="h-5 w-5 mr-2" />
									Filter
								</div>
							</button>
						</div>
					</div>

					{isFilterDrawerOpen && (
						<div id="filter-drawer" className="mt-4 hidden md:block">
							<RecipeFilters
								categories={categories}
								activeFilters={filters}
								onFilterChange={handleFilterChange}
							/>
						</div>
					)}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{recipes.length > 0 ? (
						recipes.map((recipe: RecipeCardType) => (
							<RecipeCard
								key={recipe.id}
								recipe={recipe}
								onToggleFavorite={handleToggleFavorite}
							/>
						))
					) : (
						<div className="col-span-3 py-12">
							<div className="text-center">
								<ClipboardIcon className="mx-auto h-12 w-12 text-gray-400" />
								<h3 className="mt-2 text-lg font-medium text-gray-900">
									No recipes found
								</h3>
								<p className="mt-1 text-sm text-gray-500">
									Try adjusting your search or filter to find what you're
									looking for.
								</p>
								<div className="mt-6">
									<button
										type="button"
										onClick={() => {
											setSearchQuery("");
											setFilters({
												cuisineType: "",
												mealType: "",
												dietaryCategories: [],
												difficulty: "",
											});
										}}
										className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
									>
										Clear filters
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}
