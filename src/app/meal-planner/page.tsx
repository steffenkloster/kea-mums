"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useApi } from "@/hooks/useApi";
import type { MealPlan, MealPlanItem, Recipe } from "@/types";
import { Dialog, Transition } from "@headlessui/react";
import {
	ArrowPathIcon,
	CalendarIcon,
	PlusIcon,
	ShoppingCartIcon,
	TrashIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// TODO: Replace with enum or constants file
const DAYS_OF_WEEK = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function MealPlannerPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [isCreatingPlan, setIsCreatingPlan] = useState(false);
	const [isAddingMeal, setIsAddingMeal] = useState(false);
	const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
	const [selectedDay, setSelectedDay] = useState("");
	const [selectedMealType, setSelectedMealType] = useState(MEAL_TYPES[0]);
	const [newPlanName, setNewPlanName] = useState("");
	const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
	const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
	const [servings, setServings] = useState(2);
	const [searchQuery, setSearchQuery] = useState("");
	const [showShoppingListConfirm, setShowShoppingListConfirm] = useState(false);

	// Use useApi hook for all API calls
	const {
		data: mealPlans,
		error: mealPlansError,
		isLoading: isMealPlansLoading,
		makeRequest: fetchMealPlans,
	} = useApi<MealPlan[]>({ url: "/api/meal-plans", method: "GET" });

	const {
		data: currentPlan,
		error: currentPlanError,
		isLoading: isCurrentPlanLoading,
		makeRequest: fetchCurrentPlan,
	} = useApi<MealPlan>({
		url: currentPlanId ? `/api/meal-plans/${currentPlanId}` : "",
		method: "GET",
	});

	const {
		data: searchResults,
		error: searchError,
		isLoading: isSearchLoading,
		makeRequest: searchRecipes,
	} = useApi<Recipe[]>({ url: "/api/recipes/search", method: "GET" });

	const {
		error: createPlanError,
		isLoading: isCreatingPlanLoading,
		makeRequest: createMealPlan,
	} = useApi({ url: "/api/meal-plans", method: "POST" });

	const {
		error: addMealError,
		isLoading: isAddingMealLoading,
		makeRequest: addMealToCurrentPlan,
	} = useApi({
		url: currentPlanId ? `/api/meal-plans/${currentPlanId}/meals` : "",
		method: "POST",
	});

	const {
		error: removeMealError,
		isLoading: isRemovingMeal,
		makeRequest: removeMealFromPlan,
	} = useApi({ url: "", method: "DELETE" });

	const {
		error: generateShoppingListError,
		isLoading: isGeneratingShoppingList,
		makeRequest: generateShoppingList,
	} = useApi({
		url: currentPlanId ? `/api/meal-plans/${currentPlanId}/shopping-list` : "",
		method: "POST",
	});

	const {
		error: generatePlanError,
		isLoading: isGeneratingPlanLoading,
		makeRequest: generatePlan,
	} = useApi({ url: "/api/meal-plans/generate", method: "POST" });

	// Fetch meal plans on mount and when authenticated
	useEffect(() => {
		if (status === "authenticated") {
			fetchMealPlans();
		}
	}, [status, fetchMealPlans]);

	// Fetch current plan when selected
	useEffect(() => {
		if (currentPlanId) {
			fetchCurrentPlan();
		}
	}, [currentPlanId, fetchCurrentPlan]);

	// Select most recent plan by default
	useEffect(() => {
		if (mealPlans?.length && !currentPlanId) {
			setCurrentPlanId(mealPlans[0].id);
		}
	}, [mealPlans, currentPlanId]);

	// Search recipes handler
	const handleSearch = useCallback(() => {
		searchRecipes({ query: { query: searchQuery, limit: 10 } });
	}, [searchQuery, searchRecipes]);

	// Handle creating a new meal plan
	const handleCreatePlan = useCallback(async () => {
		if (!newPlanName.trim()) return;
		const startDate = new Date();
		const endDate = new Date();
		endDate.setDate(startDate.getDate() + 6);
		await createMealPlan({
			body: {
				name: newPlanName,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			},
			onSuccess: (data) => {
				setCurrentPlanId(data.id);
				setIsCreatingPlan(false);
				setNewPlanName("");
				fetchMealPlans();
			},
		});
	}, [newPlanName, createMealPlan, fetchMealPlans]);

	// Handle adding a meal to the plan
	const handleAddMeal = useCallback(async () => {
		if (!selectedRecipe || !selectedDay || !selectedMealType || !currentPlanId)
			return;
		const startDate = currentPlan?.startDate
			? new Date(currentPlan.startDate)
			: new Date();
		const dayIndex = DAYS_OF_WEEK.indexOf(selectedDay);
		if (dayIndex === -1) return;
		const mealDate = new Date(startDate);
		mealDate.setDate(startDate.getDate() + dayIndex);
		await addMealToCurrentPlan({
			body: {
				recipeId: selectedRecipe.id,
				date: mealDate.toISOString(),
				mealType: selectedMealType,
				servings,
			},
			onSuccess: () => {
				setIsAddingMeal(false);
				setSelectedRecipe(null);
				setSearchQuery("");
				fetchCurrentPlan();
			},
		});
	}, [
		selectedRecipe,
		selectedDay,
		selectedMealType,
		servings,
		currentPlanId,
		currentPlan,
		addMealToCurrentPlan,
		fetchCurrentPlan,
	]);

	// Handle removing a meal
	const handleRemoveMeal = useCallback(
		async (mealItemId: string) => {
			if (!currentPlanId) return;
			await removeMealFromPlan({
				url: `/api/meal-plans/${currentPlanId}/meals/${mealItemId}`,
				onSuccess: () => fetchCurrentPlan(),
			});
		},
		[currentPlanId, removeMealFromPlan, fetchCurrentPlan],
	);

	// Handle generating meal plan
	const handleGeneratePlan = useCallback(async () => {
		setIsGeneratingPlan(true);
		await generatePlan({
			body: {
				name: `Meal Plan - ${new Date().toLocaleDateString()}`,
				days: 7,
				preferences: session?.user?.dietaryPreferences || [],
			},
			onSuccess: (data) => {
				setCurrentPlanId(data.id);
				setIsGeneratingPlan(false);
				fetchMealPlans();
			},
			onError: () => setIsGeneratingPlan(false),
		});
	}, [generatePlan, session, fetchMealPlans]);

	// Handle creating shopping list
	const handleCreateShoppingList = useCallback(async () => {
		if (!currentPlanId) return;
		await generateShoppingList({
			body: { name: `${currentPlan?.name || "Meal Plan"} Shopping List` },
			onSuccess: (data) => {
				setShowShoppingListConfirm(false);
				router.push(`/shopping-list/${data.id}`);
			},
		});
	}, [currentPlanId, currentPlan, generateShoppingList, router]);

	// Open add meal modal
	const openAddMealModal = useCallback((day: string) => {
		setSelectedDay(day);
		setIsAddingMeal(true);
	}, []);

	// Combine all loading states
	const isPageLoading = status === "loading" || isMealPlansLoading;

	// Redirect if not authenticated
	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	if (isPageLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-screen">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
				</div>
			</DashboardLayout>
		);
	}

	// Helper: get date display for header
	const getDateDisplay = (dayIndex: number) => {
		if (!currentPlan?.startDate) return "";
		const date = new Date(currentPlan.startDate);
		date.setDate(date.getDate() + dayIndex);
		return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	};

	// Helper: get meals for day and type
	const getMealsForDayAndType = (dayIndex: number, mealType: string) => {
		if (!currentPlan?.mealItems) return [];
		const startDate = new Date(currentPlan.startDate);
		const targetDate = new Date(startDate);
		targetDate.setDate(startDate.getDate() + dayIndex);
		targetDate.setHours(0, 0, 0, 0);
		return currentPlan.mealItems.filter((item: MealPlanItem) => {
			const itemDate = new Date(item.date);
			itemDate.setHours(0, 0, 0, 0);
			return (
				itemDate.getTime() === targetDate.getTime() &&
				item.mealType === mealType
			);
		});
	};

	return (
		<DashboardLayout>
			<DndProvider backend={HTML5Backend}>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					{/* Header with actions */}
					<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
							<h1 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">
								Meal Planner
							</h1>
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => setIsCreatingPlan(true)}
									className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
								>
									<PlusIcon className="h-5 w-5 mr-1" /> New Plan
								</button>
								<button
									type="button"
									onClick={handleGeneratePlan}
									disabled={isGeneratingPlanLoading}
									className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
								>
									<ArrowPathIcon className="h-5 w-5 mr-1" />
									{isGeneratingPlanLoading ? "Generating..." : "Generate Plan"}
								</button>
								{currentPlanId && (
									<button
										type="button"
										onClick={() => setShowShoppingListConfirm(true)}
										className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
									>
										<ShoppingCartIcon className="h-5 w-5 mr-1" />
										Shopping List
									</button>
								)}
							</div>
						</div>

						{/* Plan selector */}
						{(mealPlans?.length || 0) > 0 ? (
							<div className="mb-4">
								<label
									htmlFor="plan-selector"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Select Meal Plan
								</label>
								<select
									id="plan-selector"
									value={currentPlanId || ""}
									onChange={(e) => setCurrentPlanId(e.target.value || null)}
									className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
								>
									{mealPlans?.map((plan: MealPlan) => (
										<option key={plan.id} value={plan.id}>
											{plan.name} (
											{new Date(plan.startDate).toLocaleDateString()} -{" "}
											{new Date(plan.endDate).toLocaleDateString()})
										</option>
									))}
								</select>
							</div>
						) : (
							<div className="bg-gray-50 p-4 rounded-lg">
								<p className="text-gray-600">
									You don't have any meal plans yet. Create a new plan or
									generate one automatically.
								</p>
							</div>
						)}
					</div>

					{/* Meal plan grid */}
					{currentPlanId && !isCurrentPlanLoading ? (
						<div className="overflow-x-auto pb-4">
							<div className="min-w-max">
								{/* Header row with day names */}
								<div className="grid grid-cols-8 gap-2 mb-2">
									<div className="bg-gray-100 p-2 rounded-lg">
										<span className="font-medium text-gray-700">Meal Type</span>
									</div>
									{DAYS_OF_WEEK.map((day, index) => (
										<div key={day} className="bg-gray-100 p-2 rounded-lg">
											<div className="flex flex-col">
												<span className="font-medium text-gray-700">{day}</span>
												<span className="text-xs text-gray-500">
													{getDateDisplay(index)}
												</span>
											</div>
										</div>
									))}
								</div>

								{/* Meal type rows */}
								{MEAL_TYPES.map((mealType) => (
									<div key={mealType} className="grid grid-cols-8 gap-2 mb-4">
										{/* Meal type cell */}
										<div className="bg-white p-2 rounded-lg shadow-sm flex items-center">
											<span className="font-medium text-gray-700">
												{mealType}
											</span>
										</div>

										{/* Day cells */}
										{DAYS_OF_WEEK.map((day, dayIndex) => (
											<div
												key={`${mealType}-${day}`}
												className="bg-white p-2 rounded-lg shadow-sm min-h-32 flex flex-col"
											>
												{/* Meals in this cell */}
												{getMealsForDayAndType(dayIndex, mealType).map(
													(meal: MealPlanItem) => (
														<MealItemCard
															key={meal.id}
															meal={meal}
															onRemove={handleRemoveMeal}
														/>
													),
												)}

												{/* Add meal button */}
												<button
													type="button"
													onClick={() => openAddMealModal(day)}
													className="mt-auto flex items-center justify-center w-full p-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg border border-dashed border-emerald-300"
												>
													<PlusIcon className="h-4 w-4 mr-1" />
													Add
												</button>
											</div>
										))}
									</div>
								))}
							</div>
						</div>
					) : currentPlanId && isCurrentPlanLoading ? (
						<div className="flex items-center justify-center h-64">
							<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
						</div>
					) : (
						<div className="bg-white rounded-lg shadow-sm p-6">
							<div className="text-center py-8">
								<CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
								<h2 className="text-xl font-medium text-gray-900 mb-2">
									No Meal Plan Selected
								</h2>
								<p className="text-gray-600 mb-6">
									Create a new meal plan or generate one automatically to get
									started.
								</p>
								<div className="flex flex-wrap justify-center gap-4">
									<button
										type="button"
										onClick={() => setIsCreatingPlan(true)}
										className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
									>
										Create New Plan
									</button>
									<button
										type="button"
										onClick={handleGeneratePlan}
										disabled={isGeneratingPlanLoading}
										className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
									>
										{isGeneratingPlanLoading
											? "Generating..."
											: "Generate Plan"}
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Error displays */}
					{(mealPlansError || currentPlanError || generatePlanError) && (
						<div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
							<div className="flex">
								<div className="flex-shrink-0">
									<XCircleIcon
										className="h-5 w-5 text-red-400"
										aria-hidden="true"
									/>
								</div>
								<div className="ml-3">
									<p className="text-sm text-red-700">
										{mealPlansError?.message ||
											currentPlanError?.message ||
											generatePlanError?.message ||
											"An error occurred with the meal planner."}
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Create Plan Modal */}
				<Transition appear show={isCreatingPlan} as={Fragment}>
					<Dialog
						as="div"
						className="relative z-10"
						onClose={() => setIsCreatingPlan(false)}
					>
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0"
							enterTo="opacity-50"
							leave="ease-in duration-200"
							leaveFrom="opacity-50"
							leaveTo="opacity-0"
						>
							<div className="fixed inset-0 bg-black opacity-50" />
						</Transition.Child>

						<div className="fixed inset-0 overflow-y-auto">
							<div className="flex min-h-full items-center justify-center p-4">
								<Transition.Child
									as={Fragment}
									enter="ease-out duration-300"
									enterFrom="opacity-0 scale-95"
									enterTo="opacity-100 scale-100"
									leave="ease-in duration-200"
									leaveFrom="opacity-100 scale-100"
									leaveTo="opacity-0 scale-95"
								>
									<Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
										<Dialog.Title
											as="h3"
											className="text-lg font-medium leading-6 text-gray-900"
										>
											Create New Meal Plan
										</Dialog.Title>
										{createPlanError && (
											<div className="mt-2 bg-red-50 border-l-4 border-red-400 p-3">
												<p className="text-sm text-red-700">
													{createPlanError.message}
												</p>
											</div>
										)}
										<div className="mt-4">
											<label
												htmlFor="plan-name"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Plan Name
											</label>
											<input
												type="text"
												id="plan-name"
												value={newPlanName}
												onChange={(e) => setNewPlanName(e.target.value)}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
												placeholder="Weekly Dinner Plan"
											/>
										</div>
										<div className="mt-6 flex justify-end gap-3">
											<button
												type="button"
												className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
												onClick={() => setIsCreatingPlan(false)}
											>
												Cancel
											</button>
											<button
												type="button"
												className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
												onClick={handleCreatePlan}
												disabled={!newPlanName.trim() || isCreatingPlanLoading}
											>
												{isCreatingPlanLoading ? "Creating..." : "Create Plan"}
											</button>
										</div>
									</Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</Dialog>
				</Transition>

				{/* Add Meal Modal */}
				<Transition appear show={isAddingMeal} as={Fragment}>
					<Dialog
						as="div"
						className="relative z-10"
						onClose={() => setIsAddingMeal(false)}
					>
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0"
							enterTo="opacity-50"
							leave="ease-in duration-200"
							leaveFrom="opacity-50"
							leaveTo="opacity-0"
						>
							<div className="fixed inset-0 bg-black opacity-50" />
						</Transition.Child>

						<div className="fixed inset-0 overflow-y-auto">
							<div className="flex min-h-full items-center justify-center p-4">
								<Transition.Child
									as={Fragment}
									enter="ease-out duration-300"
									enterFrom="opacity-0 scale-95"
									enterTo="opacity-100 scale-100"
									leave="ease-in duration-200"
									leaveFrom="opacity-100 scale-100"
									leaveTo="opacity-0 scale-95"
								>
									<Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
										<Dialog.Title
											as="h3"
											className="text-lg font-medium leading-6 text-gray-900"
										>
											Add Meal for {selectedDay} - {selectedMealType}
										</Dialog.Title>
										{addMealError && (
											<div className="mt-2 bg-red-50 border-l-4 border-red-400 p-3">
												<p className="text-sm text-red-700">
													{addMealError.message}
												</p>
											</div>
										)}
										<div className="mt-4">
											{/* Meal type selector */}
											<div className="mb-4">
												<label
													className="block text-sm font-medium text-gray-700 mb-1"
													htmlFor="meal-type"
												>
													Meal Type
												</label>
												<select
													id="meal-type"
													value={selectedMealType}
													onChange={(e) => setSelectedMealType(e.target.value)}
													className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
												>
													{MEAL_TYPES.map((type) => (
														<option key={type} value={type}>
															{type}
														</option>
													))}
												</select>
											</div>
											{/* Servings input */}
											<div className="mb-4">
												<label
													className="block text-sm font-medium text-gray-700 mb-1"
													htmlFor="servings"
												>
													Servings
												</label>
												<input
													id="servings"
													type="number"
													min="1"
													value={servings}
													onChange={(e) =>
														setServings(Number.parseInt(e.target.value) || 1)
													}
													className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
												/>
											</div>
											{/* Recipe search */}
											<div className="mb-4">
												<label
													className="block text-sm font-medium text-gray-700 mb-1"
													htmlFor="recipe-search"
												>
													Find Recipe
												</label>
												<div className="flex">
													<input
														id="recipe-search"
														type="text"
														value={searchQuery}
														onChange={(e) => setSearchQuery(e.target.value)}
														className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
														placeholder="Search recipes..."
													/>
													<button
														type="button"
														onClick={handleSearch}
														disabled={isSearchLoading || !searchQuery.trim()}
														className="px-4 py-2 bg-emerald-600 text-white rounded-r-md hover:bg-emerald-700 disabled:opacity-50"
													>
														{isSearchLoading ? "Searching..." : "Search"}
													</button>
												</div>
											</div>
											{/* Search Results */}
											<div className="mt-4 mb-2">
												<h4 className="font-medium text-gray-700 mb-2">
													{searchResults ? "Search Results" : "Selected Recipe"}
												</h4>
												{/* Selected Recipe */}
												{selectedRecipe && (
													<div className="bg-emerald-50 p-3 rounded-lg mb-4 flex items-center">
														<div className="relative w-16 h-16 rounded overflow-hidden mr-3">
															{selectedRecipe.imageUrl ? (
																<Image
																	src={selectedRecipe.imageUrl}
																	alt={selectedRecipe.title}
																	fill
																	className="object-cover"
																/>
															) : (
																<div className="w-full h-full bg-gray-200 flex items-center justify-center">
																	<span className="text-xs text-gray-400">
																		No img
																	</span>
																</div>
															)}
														</div>
														<div className="flex-1">
															<h5 className="font-medium text-gray-900">
																{selectedRecipe.title}
															</h5>
															<div className="flex flex-wrap gap-1 mt-1">
																{selectedRecipe.dietaryCategories?.map(
																	(category) => (
																		<span
																			key={category}
																			className="px-2 py-0.5 bg-emerald-200 text-emerald-800 text-xs rounded-full"
																		>
																			{category}
																		</span>
																	),
																)}
															</div>
														</div>
														<button
															type="button"
															onClick={() => setSelectedRecipe(null)}
															className="text-gray-500 hover:text-gray-700"
														>
															<XCircleIcon className="h-5 w-5" />
														</button>
													</div>
												)}
												{/* Recipe Search Results */}
												{!selectedRecipe && searchResults && (
													<div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
														{searchResults.length === 0 ? (
															<div className="p-4 text-center text-gray-500">
																No recipes found. Try a different search term.
															</div>
														) : (
															<ul className="divide-y divide-gray-200">
																{searchResults.map((recipe: Recipe) => (
																	<li key={recipe.id}>
																		<button
																			type="button"
																			className="w-full px-4 py-3 hover:bg-gray-50 flex items-center text-left"
																			onClick={() => setSelectedRecipe(recipe)}
																		>
																			<div className="relative w-12 h-12 rounded overflow-hidden mr-3">
																				{recipe.imageUrl ? (
																					<Image
																						src={recipe.imageUrl}
																						alt={recipe.title}
																						fill
																						className="object-cover"
																					/>
																				) : (
																					<div className="w-full h-full bg-gray-200 flex items-center justify-center">
																						<span className="text-xs text-gray-400">
																							No img
																						</span>
																					</div>
																				)}
																			</div>
																			<div className="flex-1">
																				<h5 className="font-medium text-gray-900">
																					{recipe.title}
																				</h5>
																				<div className="flex flex-wrap gap-1 mt-1">
																					{recipe.dietaryCategories?.map(
																						(category) => (
																							<span
																								key={category}
																								className="px-2 py-0.5 bg-emerald-200 text-emerald-800 text-xs rounded-full"
																							>
																								{category}
																							</span>
																						),
																					)}
																				</div>
																			</div>
																		</button>
																	</li>
																))}
															</ul>
														)}
													</div>
												)}
												{/* No recipe selected yet */}
												{!selectedRecipe && !searchResults && (
													<div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
														Search for recipes above or browse your recent
														recipes.
													</div>
												)}
											</div>
										</div>
										<div className="mt-6 flex justify-end gap-3">
											<button
												type="button"
												className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
												onClick={() => setIsAddingMeal(false)}
											>
												Cancel
											</button>
											<button
												type="button"
												className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
												onClick={handleAddMeal}
												disabled={!selectedRecipe || isAddingMealLoading}
											>
												{isAddingMealLoading ? "Adding..." : "Add to Plan"}
											</button>
										</div>
									</Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</Dialog>
				</Transition>

				{/* Shopping List Confirmation Modal */}
				<Transition appear show={showShoppingListConfirm} as={Fragment}>
					<Dialog
						as="div"
						className="relative z-10"
						onClose={() => setShowShoppingListConfirm(false)}
					>
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0"
							enterTo="opacity-50"
							leave="ease-in duration-200"
							leaveFrom="opacity-50"
							leaveTo="opacity-0"
						>
							<div className="fixed inset-0 bg-black opacity-50" />
						</Transition.Child>

						<div className="fixed inset-0 overflow-y-auto">
							<div className="flex min-h-full items-center justify-center p-4">
								<Transition.Child
									as={Fragment}
									enter="ease-out duration-300"
									enterFrom="opacity-0 scale-95"
									enterTo="opacity-100 scale-100"
									leave="ease-in duration-200"
									leaveFrom="opacity-100 scale-100"
									leaveTo="opacity-0 scale-95"
								>
									<Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
										<Dialog.Title
											as="h3"
											className="text-lg font-medium leading-6 text-gray-900"
										>
											Create Shopping List
										</Dialog.Title>
										{generateShoppingListError && (
											<div className="mt-2 bg-red-50 border-l-4 border-red-400 p-3">
												<p className="text-sm text-red-700">
													{generateShoppingListError.message}
												</p>
											</div>
										)}
										<div className="mt-4">
											<p className="text-gray-700">
												Generate a shopping list for{" "}
												{currentPlan?.name || "this meal plan"}?
											</p>
											<p className="mt-2 text-sm text-gray-500">
												This will create a new shopping list with all the
												ingredients needed for the recipes in your meal plan.
											</p>
										</div>
										<div className="mt-6 flex justify-end gap-3">
											<button
												type="button"
												className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
												onClick={() => setShowShoppingListConfirm(false)}
											>
												Cancel
											</button>
											<button
												type="button"
												className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
												onClick={handleCreateShoppingList}
												disabled={isGeneratingShoppingList}
											>
												{isGeneratingShoppingList
													? "Creating..."
													: "Create List"}
											</button>
										</div>
									</Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</Dialog>
				</Transition>
			</DndProvider>
		</DashboardLayout>
	);
}

// Meal Item Card Component
interface MealItemCardProps {
	meal: MealPlanItem;
	onRemove: (id: string) => void;
}

function MealItemCard({ meal, onRemove }: MealItemCardProps) {
	return (
		<div className="bg-gray-50 p-2 rounded-lg mb-2 overflow-hidden">
			<div className="flex items-center">
				<div className="flex-1 min-w-0">
					<h4 className="font-medium text-gray-900 text-sm truncate">
						{meal.recipe.title}
					</h4>
					<div className="flex items-center text-xs text-gray-500 mt-1">
						<span>
							{meal.servings} {meal.servings > 1 ? "servings" : "serving"}
						</span>
					</div>
				</div>
				<button
					type="button"
					onClick={() => onRemove(meal.id)}
					className="ml-2 text-gray-500 hover:text-red-500"
				>
					<TrashIcon className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}
