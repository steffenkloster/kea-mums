import type { Recipe } from "@/types";
// components/dashboard/MealRecommendations.js
import {
	ClockIcon,
	PhotoIcon,
	UserGroupIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

export default function MealRecommendations({
	recommendations = [],
}: { recommendations: Recipe[] }) {
	const recipesToDisplay = recommendations;

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{recipesToDisplay.map((recipe) => (
				<Link key={recipe.id} href={`/recipes/${recipe.id}`}>
					<div
						key={recipe.id}
						className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
					>
						<div className="relative h-40 bg-gray-200">
							{recipe.imageUrl ? (
								<Image
									src={recipe.imageUrl}
									alt={recipe.title}
									fill
									style={{ objectFit: "cover" }}
								/>
							) : (
								<div className="flex items-center justify-center h-full text-gray-400">
									<PhotoIcon className="h-12 w-12" />
								</div>
							)}
						</div>
						<div className="p-4">
							<h3 className="font-medium text-gray-900 truncate">
								{recipe.title}
							</h3>
							<div className="mt-2 flex justify-between text-sm text-gray-500">
								<span className="flex items-center">
									<ClockIcon className="h-4 w-4 mr-1" />
									{recipe.prepTime}
								</span>
								<span className="flex items-center">
									<UserGroupIcon className="h-4 w-4 mr-1" />
									{recipe.nutritionFacts.calories} cal
								</span>
							</div>
							<div className="mt-3 flex flex-wrap gap-1">
								{recipe.dietaryCategories?.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					</div>
				</Link>
			))}
		</div>
	);
}
