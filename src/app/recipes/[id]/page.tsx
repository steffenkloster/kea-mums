"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useApi } from "@/hooks/useApi";
import type { Recipe, RecipeIngredient, RecipeReview } from "@/types";
import { Dialog, Transition } from "@headlessui/react";
import {
	ArrowLeftIcon,
	BeakerIcon,
	CheckCircleIcon,
	ClockIcon,
	HeartIcon,
	PrinterIcon,
	ShareIcon,
	UserIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Fragment } from "react";

export default function RecipePage() {
	const params = useParams();
	const recipeId = params.id as string;
	const router = useRouter();
	const { data: session, status } = useSession();
	const [isScalingModalOpen, setIsScalingModalOpen] = useState(false);
	const [scaledServings, setScaledServings] = useState(0);
	const [scalingFactor, setScalingFactor] = useState(1);

	// Fetch recipe data
	const {
		data: recipe,
		error,
		isLoading,
		makeRequest: fetchRecipe,
	} = useApi<Recipe>({
		url: `/api/recipes/${recipeId}`,
		method: "GET",
		cache: true,
	});

	// Fetch recipe on component mount
	useEffect(() => {
		if (recipeId) {
			fetchRecipe();
		}
	}, [recipeId, fetchRecipe]);

	// Toggle favorite status
	const { isLoading: isFavoritingLoading, makeRequest: toggleFavorite } =
		useApi({
			url: `/api/recipes/${recipeId}/favorite`,
			method: "POST",
		});

	const handleToggleFavorite = useCallback(async () => {
		if (!session) {
			router.push(
				`/login?returnUrl=${encodeURIComponent(`/recipes/${recipeId}`)}`,
			);
			return;
		}

		await toggleFavorite({
			body: { isFavorited: !recipe?.isFavorited },
			onSuccess: () => {
				// Update the recipe in the local state
				if (recipe) {
					fetchRecipe();
				}
			},
		});
	}, [session, recipe, recipeId, router, toggleFavorite, fetchRecipe]);

	// Handle recipe scaling
	const openScalingModal = () => {
		if (recipe) {
			setScaledServings(recipe.servings);
			setScalingFactor(1);
			setIsScalingModalOpen(true);
		}
	};

	const handleServingsChange = (newServings: number) => {
		if (recipe && newServings > 0) {
			setScaledServings(newServings);
			setScalingFactor(newServings / recipe.servings);
		}
	};

	// Format date
	const formatDate = (date: string | Date) => {
		const dateObj = typeof date === "string" ? new Date(date) : date;
		return dateObj.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Calculate scaled quantity
	const getScaledQuantity = (quantity: number) => {
		return (quantity * scalingFactor).toFixed(
			Number.isInteger(quantity * scalingFactor) ? 0 : 1,
		);
	};

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-screen">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
				</div>
			</DashboardLayout>
		);
	}

	if (error || !recipe) {
		return (
			<DashboardLayout>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
									{error?.message ||
										"Recipe not found. It may have been deleted or you don't have permission to view it."}
								</p>
								<div className="mt-4">
									<Link
										href="/recipes"
										className="text-sm font-medium text-red-700 hover:text-red-600"
									>
										Go back to recipes
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Back Navigation */}
				<div className="mb-4">
					<button
						onClick={() => router.back()}
						type="button"
						className="flex items-center text-gray-600 hover:text-emerald-600"
					>
						<ArrowLeftIcon className="h-4 w-4 mr-1" />
						<span>Back</span>
					</button>
				</div>

				{/* Recipe Header */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<div className="flex flex-col lg:flex-row">
						{/* Recipe Image */}
						<div className="lg:w-1/2 mb-6 lg:mb-0 lg:pr-6">
							<div className="relative w-full h-80 rounded-lg overflow-hidden">
								{recipe.imageUrl ? (
									<Image
										src={recipe.imageUrl}
										alt={recipe.title}
										fill
										className="object-cover"
									/>
								) : (
									<div className="w-full h-full bg-gray-200 flex items-center justify-center">
										<span className="text-gray-400">No image available</span>
									</div>
								)}
							</div>
						</div>

						{/* Recipe Info */}
						<div className="lg:w-1/2">
							<h1 className="text-3xl font-bold text-gray-900 mb-2">
								{recipe.title}
							</h1>

							{/* Recipe metadata */}
							<div className="flex items-center mb-4">
								<div className="flex items-center">
									<StarIcon className="h-5 w-5 text-yellow-400" />
									<span className="ml-1 text-gray-600">
										{recipe.averageRating
											? recipe.averageRating.toFixed(1)
											: "No ratings"}
										{recipe.reviews.length > 0 &&
											` (${recipe.reviews.length} reviews)`}
									</span>
								</div>
								<span className="mx-2 text-gray-300">•</span>
								<div className="flex items-center">
									<UserIcon className="h-5 w-5 text-gray-400" />
									<span className="ml-1 text-gray-600">
										By {recipe?.user?.name ?? "Unkown"}
									</span>
								</div>
								<span className="mx-2 text-gray-300">•</span>
								<div className="text-gray-600 text-sm">
									{formatDate(recipe.createdAt)}
								</div>
							</div>

							{/* Description */}
							<p className="text-gray-600 mb-4">{recipe.description}</p>

							{/* Recipe details */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
								<div className="bg-gray-50 p-3 rounded-lg text-center">
									<ClockIcon className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
									<p className="text-xs text-gray-500">Prep Time</p>
									<p className="font-medium">{recipe.prepTime} min</p>
								</div>
								<div className="bg-gray-50 p-3 rounded-lg text-center">
									<ClockIcon className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
									<p className="text-xs text-gray-500">Cook Time</p>
									<p className="font-medium">{recipe.cookTime} min</p>
								</div>
								<div className="bg-gray-50 p-3 rounded-lg text-center">
									<ClockIcon className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
									<p className="text-xs text-gray-500">Total Time</p>
									<p className="font-medium">{recipe.totalTime} min</p>
								</div>
								<div className="bg-gray-50 p-3 rounded-lg text-center">
									<UserIcon className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
									<p className="text-xs text-gray-500">Servings</p>
									<p className="font-medium">{recipe.servings}</p>
								</div>
							</div>

							{/* Tags/Categories */}
							<div className="flex flex-wrap gap-2 mb-6">
								{recipe.dietaryCategories.map(
									(category: string, index: number) => (
										<span
											key={recipe.id + category}
											className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full"
										>
											{category}
										</span>
									),
								)}
								{recipe.cuisineType && (
									<span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
										{recipe.cuisineType}
									</span>
								)}
								{recipe.mealType && (
									<span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
										{recipe.mealType}
									</span>
								)}
								{recipe.dishType && (
									<span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">
										{recipe.dishType}
									</span>
								)}
								{recipe.difficulty && (
									<span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full">
										{recipe.difficulty}
									</span>
								)}
							</div>

							{/* Action buttons */}
							<div className="flex flex-wrap gap-3">
								<button
									type="button"
									onClick={handleToggleFavorite}
									disabled={isFavoritingLoading}
									className={`flex items-center px-4 py-2 rounded-lg ${
										recipe.isFavorited
											? "bg-red-50 text-red-600 hover:bg-red-100"
											: "bg-gray-50 text-gray-600 hover:bg-gray-100"
									}`}
								>
									{recipe.isFavorited ? (
										<HeartIconSolid className="h-5 w-5 mr-2 text-red-500" />
									) : (
										<HeartIcon className="h-5 w-5 mr-2" />
									)}
									{recipe.isFavorited ? "Saved" : "Save"}
								</button>
								<button
									type="button"
									onClick={openScalingModal}
									className="flex items-center px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
								>
									<BeakerIcon className="h-5 w-5 mr-2" />
									Scale
								</button>
								<button
									type="button"
									onClick={() => window.print()}
									className="flex items-center px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
								>
									<PrinterIcon className="h-5 w-5 mr-2" />
									Print
								</button>
								<button
									type="button"
									onClick={() => {
										if (navigator.share) {
											navigator.share({
												title: recipe.title,
												text: recipe.description,
												url: window.location.href,
											});
										} else {
											navigator.clipboard.writeText(window.location.href);
											// Add a toast notification here
											alert("Link copied to clipboard");
										}
									}}
									className="flex items-center px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
								>
									<ShareIcon className="h-5 w-5 mr-2" />
									Share
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Recipe Content */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Ingredients */}
					<div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4">
							Ingredients
							{scalingFactor !== 1 && (
								<span className="ml-2 text-sm font-normal text-emerald-600">
									(Scaled to {scaledServings} servings)
								</span>
							)}
						</h2>
						<ul className="space-y-3">
							{recipe.ingredients.map(
								(ingredient: RecipeIngredient, index: number) => (
									<li
										key={recipe.id + ingredient.id}
										className="flex items-start"
									>
										<div className="flex-shrink-0 h-5 w-5 mr-2">
											<CheckCircleIcon className="h-5 w-5 text-emerald-500" />
										</div>
										<span className="text-gray-700">
											<span className="font-medium">
												{scalingFactor !== 1
													? getScaledQuantity(ingredient.quantity)
													: ingredient.quantity}{" "}
												{ingredient.unit}
											</span>{" "}
											{ingredient.name}
											{ingredient.preparation && `, ${ingredient.preparation}`}
											{ingredient.isOptional && " (optional)"}
										</span>
									</li>
								),
							)}
						</ul>

						{/* Nutrition Facts */}
						{recipe.nutritionFacts && (
							<div className="mt-8 border-t pt-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">
									Nutrition Facts
									{scalingFactor !== 1 && (
										<span className="ml-2 text-sm font-normal text-emerald-600">
											(per serving)
										</span>
									)}
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div className="bg-gray-50 p-3 rounded-lg">
										<p className="text-xs text-gray-500">Calories</p>
										<p className="font-medium">
											{recipe.nutritionFacts.calories} kcal
										</p>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg">
										<p className="text-xs text-gray-500">Protein</p>
										<p className="font-medium">
											{recipe.nutritionFacts.protein}g
										</p>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg">
										<p className="text-xs text-gray-500">Carbs</p>
										<p className="font-medium">
											{recipe.nutritionFacts.carbohydrates}g
										</p>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg">
										<p className="text-xs text-gray-500">Fat</p>
										<p className="font-medium">{recipe.nutritionFacts.fat}g</p>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg">
										<p className="text-xs text-gray-500">Sugar</p>
										<p className="font-medium">
											{recipe.nutritionFacts.sugar}g
										</p>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg">
										<p className="text-xs text-gray-500">Fiber</p>
										<p className="font-medium">
											{recipe.nutritionFacts.fiber}g
										</p>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Instructions */}
					<div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4">
							Instructions
						</h2>
						<ol className="space-y-6">
							{recipe.instructions.map((instruction: string, index: number) => (
								<li key={recipe.id + instruction} className="flex">
									<div className="flex-shrink-0 mr-4">
										<div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 font-semibold">
											{index + 1}
										</div>
									</div>
									<div className="text-gray-700">{instruction}</div>
								</li>
							))}
						</ol>
					</div>
				</div>

				{/* Reviews Section */}
				<div className="bg-white rounded-lg shadow-sm p-6 mt-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews</h2>

					{recipe.reviews.length === 0 ? (
						<div className="text-gray-500 text-center py-8">
							<p>No reviews yet. Be the first to review this recipe!</p>
							{session ? (
								<Link
									href={`/recipes/${recipeId}/review`}
									className="mt-4 inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
								>
									Write a Review
								</Link>
							) : (
								<Link
									href={`/login?returnUrl=${encodeURIComponent(`/recipes/${recipeId}/review`)}`}
									className="mt-4 inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
								>
									Log in to Write a Review
								</Link>
							)}
						</div>
					) : (
						<div className="space-y-6">
							{recipe.reviews.map((review: RecipeReview) => (
								<div
									key={review.id}
									className="border-b pb-6 last:border-b-0 last:pb-0"
								>
									<div className="flex items-start">
										<div className="flex-shrink-0 mr-4">
											<div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
												<UserIcon className="h-6 w-6 text-gray-500" />
											</div>
										</div>
										<div className="flex-1">
											<div className="flex items-center mb-1">
												<span className="font-medium text-gray-900 mr-2">
													{review.user?.name || "Anonymous User"}
												</span>
												<span className="text-sm text-gray-500">
													{formatDate(review.createdAt)}
												</span>
											</div>
											<div className="flex mb-2">
												{Array.from({ length: 5 }, (_, i) => (
													<StarIcon
														key={`${review.id}-star-${i}`}
														className={`h-5 w-5 ${
															i < review.rating
																? "text-yellow-400"
																: "text-gray-300"
														}`}
													/>
												))}
											</div>
											{review.comment && (
												<p className="text-gray-700">{review.comment}</p>
											)}
										</div>
									</div>
								</div>
							))}

							<div className="flex justify-between items-center pt-4">
								<div>
									<span className="text-gray-500">
										Showing {recipe.reviews.length} reviews
									</span>
								</div>
								{session && (
									<Link
										href={`/recipes/${recipeId}/review`}
										className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
									>
										Write a Review
									</Link>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Recipe Scaling Modal */}
			<Transition appear show={isScalingModalOpen} as={Fragment}>
				<Dialog
					as="div"
					className="relative z-10"
					onClose={() => setIsScalingModalOpen(false)}
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
						<div className="flex min-h-full items-center justify-center p-4 text-center">
							<Transition.Child
								as={Fragment}
								enter="ease-out duration-300"
								enterFrom="opacity-0 scale-95"
								enterTo="opacity-100 scale-100"
								leave="ease-in duration-200"
								leaveFrom="opacity-100 scale-100"
								leaveTo="opacity-0 scale-95"
							>
								<Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
									<Dialog.Title
										as="h3"
										className="text-lg font-medium leading-6 text-gray-900"
									>
										Scale Recipe
									</Dialog.Title>
									<div className="mt-4">
										<p className="text-sm text-gray-500 mb-4">
											Adjust the number of servings to scale the recipe
											ingredients accordingly.
										</p>
										<div className="flex items-center justify-center">
											<button
												type="button"
												onClick={() => handleServingsChange(scaledServings - 1)}
												disabled={scaledServings <= 1}
												className="h-10 w-10 rounded-full bg-gray-100 text-gray-600 disabled:opacity-50"
											>
												-
											</button>
											<input
												type="number"
												value={scaledServings}
												onChange={(e) =>
													handleServingsChange(
														Number.parseInt(e.target.value) || 1,
													)
												}
												disabled={scaledServings <= 1}
												min="1"
												className="mx-4 w-20 h-10 text-center border border-gray-300 rounded-md"
											/>
											<button
												type="button"
												disabled={scaledServings >= 100}
												onClick={() => handleServingsChange(scaledServings + 1)}
												className="h-10 w-10 rounded-full bg-gray-100 text-gray-600"
											>
												+
											</button>
										</div>
										<p className="text-sm text-gray-500 mt-4 text-center">
											Original: {recipe.servings} servings
										</p>
									</div>

									<div className="mt-6 flex justify-end space-x-3">
										<button
											type="button"
											className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
											onClick={() => {
												setIsScalingModalOpen(false);
												setScaledServings(recipe.servings);
												setScalingFactor(1);
											}}
										>
											Cancel
										</button>
										<button
											type="button"
											className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
											onClick={() => setIsScalingModalOpen(false)}
										>
											Apply
										</button>
									</div>
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition>
		</DashboardLayout>
	);
}
