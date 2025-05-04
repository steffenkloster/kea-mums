import Image from "next/image";
import Link from "next/link";
import type React from "react";

// Import types from centralized types file
import { Recipe, type RecipeCard as RecipeCardType } from "@/types";
import {
	ClockIcon,
	HeartIcon,
	QuestionMarkCircleIcon,
} from "@heroicons/react/24/solid";

interface RecipeCardProps {
	recipe: RecipeCardType;
	onToggleFavorite: (recipeId: string, isFavorite: boolean) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
	recipe,
	onToggleFavorite,
}) => {
	const {
		id,
		title,
		description,
		imageUrl,
		prepTime,
		cookTime,
		difficulty,
		dietaryCategories,
		isFavorite,
	} = recipe;

	// Extract just the numbers from time strings if they're not already numbers
	const prepMinutes =
		typeof prepTime === "number"
			? prepTime
			: Number.parseInt(prepTime as unknown as string);
	const cookMinutes =
		typeof cookTime === "number"
			? cookTime
			: Number.parseInt(cookTime as unknown as string);
	const totalTime = prepMinutes + cookMinutes;

	return (
		<div className="bg-white rounded-lg shadow-sm overflow-hidden transition-transform duration-200 hover:shadow-md hover:scale-[1.01]">
			<div className="relative h-48 w-full">
				<Image
					src={imageUrl || "/images/recipe-placeholder.jpg"}
					alt={title}
					layout="fill"
					objectFit="cover"
					className="transition-opacity duration-200"
				/>
				<button
					type="button"
					onClick={() => onToggleFavorite(id, isFavorite)}
					className="cursor-pointer absolute top-2 right-2 p-2 bg-white bg-opacity-70 rounded-full hover:bg-opacity-100 transition-colors duration-200"
					aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
				>
					<HeartIcon
						className={`h-5 w-5 ${
							isFavorite ? "text-red-500 fill-current" : "text-gray-400"
						}`}
					/>
				</button>
			</div>
			<div className="p-4">
				<Link href={`/recipes/${id}`}>
					<h3 className="text-lg font-medium text-gray-900 hover:text-emerald-600 transition-colors duration-200">
						{title}
					</h3>
				</Link>
				<p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>

				<div className="mt-4 flex justify-between items-center">
					<div className="flex items-center text-sm text-gray-500">
						<ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
						{totalTime} mins
					</div>
					<div className="flex items-center text-sm text-gray-500">
						<QuestionMarkCircleIcon className="h-4 w-4 mr-1 text-gray-400" />
						{difficulty || "Easy"}
					</div>
				</div>

				<div className="mt-4 flex flex-wrap gap-2">
					{dietaryCategories?.slice(0, 3).map((category) => (
						<span
							key={category}
							className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800"
						>
							{category}
						</span>
					))}
					{dietaryCategories && dietaryCategories.length > 3 && (
						<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
							+{dietaryCategories.length - 3}
						</span>
					)}
				</div>
			</div>
		</div>
	);
};

export default RecipeCard;
