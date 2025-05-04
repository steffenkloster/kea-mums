"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useApi } from "@/hooks/useApi";
import type { Recipe } from "@/types";
import {
	ArrowLeftIcon,
	StarIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ReviewPage() {
	const params = useParams();
	const recipeId = params.id as string;
	const router = useRouter();
	const { data: session, status } = useSession();

	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");
	const [hoveredStar, setHoveredStar] = useState(0);

	// Fetch basic recipe info
	const {
		data: recipe,
		error: recipeError,
		isLoading: isRecipeLoading,
		makeRequest: fetchRecipe,
	} = useApi<Recipe>({
		url: `/api/recipes/${recipeId}`,
		method: "GET",
		cache: true,
	});

	// Submit review
	const {
		error: submitError,
		isLoading: isSubmitting,
		makeRequest: submitReview,
	} = useApi({
		url: `/api/recipes/${recipeId}/review`,
		method: "POST",
	});

	// Fetch recipe on component mount
	useEffect(() => {
		if (recipeId) {
			fetchRecipe();
		}
	}, [recipeId, fetchRecipe]);

	// Redirect to login if not authenticated
	useEffect(() => {
		if (status === "unauthenticated") {
			router.push(
				`/login?returnUrl=${encodeURIComponent(`/recipes/${recipeId}/review`)}`,
			);
		}
	}, [status, router, recipeId]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (rating === 0) {
				return; // Don't submit if no rating
			}

			await submitReview({
				body: {
					rating,
					comment: comment.trim() || undefined, // Don't send empty comment
				},
				onSuccess: () => {
					// Redirect to recipe page on success
					router.push(`/recipes/${recipeId}`);
				},
			});
		},
		[rating, comment, submitReview, router, recipeId],
	);

	// Show loading state
	if (isRecipeLoading || status === "loading") {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-screen">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
				</div>
			</DashboardLayout>
		);
	}

	// Show error state
	if (recipeError || !recipe) {
		return (
			<DashboardLayout>
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
									{recipeError?.message ||
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
			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Back Navigation */}
				<div className="mb-4">
					<button
						type="button"
						aria-label="Back to Recipe"
						onClick={() => router.back()}
						className="flex items-center text-gray-600 hover:text-emerald-600"
					>
						<ArrowLeftIcon className="h-4 w-4 mr-1" />
						<span>Back to Recipe</span>
					</button>
				</div>

				{/* Review Form Card */}
				<div className="bg-white rounded-lg shadow-sm p-6">
					<h1 className="text-2xl font-bold text-gray-900 mb-6">
						Write a Review
					</h1>

					{/* Recipe Info */}
					<div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
						{recipe.imageUrl ? (
							<div className="relative w-20 h-20 rounded overflow-hidden mr-4">
								<Image
									src={recipe.imageUrl}
									alt={recipe.title}
									fill
									className="object-cover"
								/>
							</div>
						) : (
							<div className="w-20 h-20 bg-gray-200 flex items-center justify-center mr-4 rounded">
								<span className="text-gray-400 text-xs">No image</span>
							</div>
						)}
						<div>
							<h2 className="text-lg font-medium text-gray-900">
								{recipe.title}
							</h2>
							<p className="text-gray-600 text-sm">
								You're reviewing this recipe
							</p>
						</div>
					</div>

					{/* Error Message */}
					{submitError && (
						<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
							<div className="flex">
								<div className="flex-shrink-0">
									<XCircleIcon
										className="h-5 w-5 text-red-400"
										aria-hidden="true"
									/>
								</div>
								<div className="ml-3">
									<p className="text-sm text-red-700">{submitError.message}</p>
								</div>
							</div>
						</div>
					)}

					<form onSubmit={handleSubmit}>
						{/* Rating Stars */}
						<div className="mb-6">
							<p className="block text-gray-700 font-medium mb-2">
								Your Rating <span className="text-red-500">*</span>
							</p>
							<div className="flex">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										onClick={() => setRating(star)}
										onMouseEnter={() => setHoveredStar(star)}
										onMouseLeave={() => setHoveredStar(0)}
										className="text-2xl mr-1 focus:outline-none"
									>
										{star <= (hoveredStar || rating) ? (
											<StarIconSolid className="h-8 w-8 text-yellow-400" />
										) : (
											<StarIcon className="h-8 w-8 text-gray-300" />
										)}
									</button>
								))}
							</div>
							{rating === 0 && (
								<p className="text-sm text-red-500 mt-1">
									Please select a rating
								</p>
							)}
						</div>

						{/* Comment */}
						<div className="mb-6">
							<label
								htmlFor="comment"
								className="block text-gray-700 font-medium mb-2"
							>
								Your Review (Optional)
							</label>
							<textarea
								id="comment"
								rows={5}
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
								placeholder="Share your experience with this recipe..."
							/>
						</div>

						{/* Submit Button */}
						<div className="flex justify-end">
							<button
								type="submit"
								disabled={rating === 0 || isSubmitting}
								className={`px-6 py-2 text-white rounded-lg ${
									rating === 0
										? "bg-gray-400 cursor-not-allowed"
										: "bg-emerald-600 hover:bg-emerald-700"
								} ${isSubmitting ? "opacity-75 cursor-wait" : ""}`}
							>
								{isSubmitting ? "Submitting..." : "Submit Review"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</DashboardLayout>
	);
}
