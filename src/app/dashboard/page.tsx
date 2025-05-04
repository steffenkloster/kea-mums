"use client";

import { useApi } from "@/hooks/useApi";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

// Dashboard components
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DietaryPreferences from "@/components/dashboard/DietaryPreferences";
import MealRecommendations from "@/components/dashboard/MealRecommendations";
import RecentActivity from "@/components/dashboard/RecentActivity";
import StatsSummary from "@/components/dashboard/StatsSummary";
import UserProfile from "@/components/dashboard/UserProfile";

import {
	ClipboardIcon,
	Cog8ToothIcon,
	HeartIcon,
	ShoppingCartIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";

export default function DashboardPage() {
	const { data: session, status } = useSession();
	const [localDietaryPreferences, setLocalDietaryPreferences] = useState<
		string[]
	>([]);
	const router = useRouter();

	// Fetch user dashboard data
	const {
		data: dashboardData,
		error,
		isLoading: isDataLoading,
		makeRequest: fetchDashboardData,
	} = useApi({
		url: "/api/user/dashboard",
		method: "GET",
		cache: true, // Enable caching to prevent redundant requests
	});

	// Combine all loading states into one
	const isPageLoading = status === "loading" || isDataLoading;

	// Use useCallback to prevent the function from being recreated on each render
	const fetchData = useCallback(() => {
		if (status === "authenticated") {
			fetchDashboardData();
		}
	}, [status, fetchDashboardData]);

	useEffect(() => {
		if (dashboardData?.user?.dietaryPreferences) {
			setLocalDietaryPreferences(dashboardData.user.dietaryPreferences);
		}
	}, [dashboardData]);

	const handleUpdatePreferences = useCallback(
		async (newPreferences: string[]) => {
			console.log("Updating preferences:", newPreferences);
			try {
				// Optimistic UI update
				setLocalDietaryPreferences(newPreferences);

				// API call to update preferences
				const response = await fetch("/api/user/preferences", {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ dietaryPreferences: newPreferences }),
				});

				if (!response.ok) throw new Error("Update failed");

				// Optional: Refresh dashboard data
				await fetchDashboardData();
			} catch (error) {
				// Revert on error
				setLocalDietaryPreferences(
					dashboardData?.user?.dietaryPreferences || [],
				);
				console.error("Update failed:", error);
				// Add user feedback here (e.g., toast notification)
			}
		},
		[dashboardData, fetchDashboardData],
	);

	useEffect(() => {
		// If user is not authenticated, redirect to login
		if (status === "unauthenticated") {
			router.push("/login");
		}

		// When session is loaded and user is authenticated, fetch dashboard data once
		if (status === "authenticated") {
			fetchData();
		}
	}, [status, router, fetchData]); // No need to handle isPageLoading anymore

	// Show loading state
	if (isPageLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-screen">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
				</div>
			</DashboardLayout>
		);
	}

	// Show error state
	if (error) {
		return (
			<DashboardLayout>
				<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
					<div className="flex">
						<div className="flex-shrink-0">
							<XCircleIcon
								className="h-5 w-5 text-red-400"
								aria-hidden="true"
							/>
						</div>
						<div className="ml-3">
							<p className="text-sm text-red-700">
								There was an error loading your dashboard data. Please try
								refreshing the page.
							</p>
						</div>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	const { user, stats, recommendations, recentActivity } = dashboardData || {
		user: session?.user,
		stats: { mealPlans: 0, savedRecipes: 0, completedMeals: 0 },
		recommendations: [],
		recentActivity: [],
	};

	return (
		<DashboardLayout>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Welcome Header */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<h1 className="text-2xl font-bold text-gray-900">
						Welcome back, {user?.name || "User"}!
					</h1>
					<p className="text-gray-600 mt-1">
						{new Date().toLocaleDateString("en-US", {
							weekday: "long",
							month: "long",
							day: "numeric",
						})}
					</p>
				</div>

				{/* Dashboard Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left Column */}
					<div className="lg:col-span-2 space-y-6">
						{/* Stats Summary */}
						<StatsSummary stats={stats} />

						{/* Meal Recommendations */}
						<div className="bg-white rounded-lg shadow-sm p-6">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-lg font-medium text-gray-900">
									Meal Recommendations
								</h2>
								<Link
									href="/recipes"
									className="text-sm text-emerald-600 hover:text-emerald-500"
								>
									View all recipes
								</Link>
							</div>
							<MealRecommendations recommendations={recommendations} />
						</div>

						{/* Recent Activity */}
						<div className="bg-white rounded-lg shadow-sm p-6">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-lg font-medium text-gray-900">
									Recent Activity
								</h2>
								<Link
									href="/activity"
									className="text-sm text-emerald-600 hover:text-emerald-500"
								>
									View all activity
								</Link>
							</div>
							<RecentActivity user={user} activities={recentActivity} />
						</div>
					</div>

					{/* Right Column */}
					<div className="space-y-6">
						{/* User Profile Card */}
						<div className="bg-white rounded-lg shadow-sm p-6">
							<UserProfile user={user} />
						</div>

						{/* Dietary Preferences */}
						<div className="bg-white rounded-lg shadow-sm p-6">
							<h2 className="text-lg font-medium text-gray-900 mb-4">
								Your Dietary Preferences
							</h2>
							<DietaryPreferences
								preferences={localDietaryPreferences}
								onUpdatePreferences={handleUpdatePreferences}
							/>
						</div>

						{/* Quick Actions */}
						<div className="bg-white rounded-lg shadow-sm p-6">
							<h2 className="text-lg font-medium text-gray-900 mb-4">
								Quick Actions
							</h2>
							<div className="grid grid-cols-2 gap-4">
								<Link
									href="/meal-planner"
									className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
								>
									<ClipboardIcon className="h-8 w-8 text-emerald-600 mb-2" />
									<span className="text-sm font-medium text-gray-700">
										Create Meal Plan
									</span>
								</Link>
								<Link
									href="/shopping-list"
									className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
								>
									<ShoppingCartIcon className="h-8 w-8 text-emerald-600 mb-2" />

									<span className="text-sm font-medium text-gray-700">
										Shopping List
									</span>
								</Link>
								<Link
									href="/recipes/favorites"
									className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
								>
									<HeartIcon className="h-8 w-8 text-emerald-600 mb-2" />

									<span className="text-sm font-medium text-gray-700">
										Saved Recipes
									</span>
								</Link>
								<Link
									href="/settings"
									className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
								>
									<Cog8ToothIcon className="h-8 w-8 text-emerald-600 mb-2" />

									<span className="text-sm font-medium text-gray-700">
										Settings
									</span>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
