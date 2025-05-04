import type React from "react";
import { useEffect, useState } from "react";

interface RecipeFiltersProps {
	categories: {
		cuisineTypes?: string[];
		mealTypes?: string[];
		dietaryCategories?: string[];
		difficulties?: string[];
	};
	activeFilters: {
		cuisineType?: string;
		mealType?: string;
		dietaryCategories?: string[];
		difficulty?: string;
	};
	onFilterChange: (filters: {
		cuisineType?: string;
		mealType?: string;
		dietaryCategories?: string[];
		difficulty?: string;
	}) => void;
}

const RecipeFilters: React.FC<RecipeFiltersProps> = ({
	categories,
	activeFilters,
	onFilterChange,
}) => {
	// Initialize filters state from passed in active filters
	const [filters, setFilters] = useState(activeFilters);

	// Destructure categories for easier access
	const {
		cuisineTypes = [],
		mealTypes = [],
		dietaryCategories = [],
		difficulties = ["Easy", "Medium", "Hard"],
	} = categories || {};

	// Update component state when activeFilters prop changes
	useEffect(() => {
		setFilters(activeFilters);
	}, [activeFilters]);

	// Handler for single select filters (radio buttons or select dropdowns)
	const handleSingleFilterChange = (filterName: string, value: string) => {
		const newFilters = {
			...filters,
			[filterName]: value,
		};

		setFilters(newFilters);
		onFilterChange(newFilters);
	};

	// Handler for multiple select filters (checkboxes)
	const handleMultiFilterChange = (
		filterName: keyof typeof filters,
		value: string,
	) => {
		// Check if the value is already in the array
		const currentValues = Array.isArray(filters[filterName])
			? (filters[filterName] as string[])
			: [];
		let newValues;

		if (currentValues.includes(value)) {
			// Remove value if already selected
			newValues = currentValues.filter((item) => item !== value);
		} else {
			// Add value if not already selected
			newValues = [...currentValues, value];
		}

		const newFilters = {
			...filters,
			[filterName]: newValues,
		};

		setFilters(newFilters);
		onFilterChange(newFilters);
	};

	// Reset all filters
	const handleResetFilters = () => {
		const resetFilters = {
			cuisineType: "",
			mealType: "",
			dietaryCategories: [],
			difficulty: "",
		};

		setFilters(resetFilters);
		onFilterChange(resetFilters);
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-medium text-gray-900">Filters</h3>
				<button
					type="button"
					onClick={handleResetFilters}
					className="text-sm text-emerald-600 hover:text-emerald-500"
				>
					Reset all
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Cuisine Type Filter */}
				<div>
					<label
						htmlFor="cuisine-type"
						className="block text-sm font-medium text-gray-700"
					>
						Cuisine
					</label>
					<select
						id="cuisine-type"
						name="cuisineType"
						value={filters.cuisineType || ""}
						onChange={(e) =>
							handleSingleFilterChange("cuisineType", e.target.value)
						}
					>
						<option value="">All Cuisines</option>
						{cuisineTypes.map((cuisine) => (
							<option key={cuisine} value={cuisine}>
								{cuisine}
							</option>
						))}
					</select>
				</div>

				{/* Meal Type Filter */}
				<div>
					<label
						htmlFor="meal-type"
						className="block text-sm font-medium text-gray-700"
					>
						Meal Type
					</label>
					<select
						id="meal-type"
						name="mealType"
						value={filters.mealType || ""}
						onChange={(e) =>
							handleSingleFilterChange("mealType", e.target.value)
						}
					>
						<option value="">All Meal Types</option>
						{mealTypes.map((mealType) => (
							<option key={mealType} value={mealType}>
								{mealType}
							</option>
						))}
					</select>
				</div>

				{/* Difficulty Filter */}
				<div>
					<label
						htmlFor="difficulty"
						className="block text-sm font-medium text-gray-700"
					>
						Difficulty
					</label>
					<select
						id="difficulty"
						name="difficulty"
						value={filters.difficulty || ""}
						onChange={(e) =>
							handleSingleFilterChange("difficulty", e.target.value)
						}
					>
						<option value="">Any Difficulty</option>
						{difficulties.map((difficulty) => (
							<option key={difficulty} value={difficulty}>
								{difficulty}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Dietary Categories - Checkboxes */}
			<div>
				<h4 className="text-sm font-medium text-gray-700 mb-3">
					Dietary Preferences
				</h4>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{dietaryCategories.map((category) => (
						<div key={category} className="flex items-start">
							<div className="flex items-center h-5">
								<input
									id={`category-${category}`}
									name="dietaryCategories"
									type="checkbox"
									value={category}
									checked={(filters.dietaryCategories || []).includes(category)}
									onChange={() =>
										handleMultiFilterChange("dietaryCategories", category)
									}
									className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-gray-300 rounded"
								/>
							</div>
							<div className="ml-2 text-sm">
								<label
									htmlFor={`category-${category}`}
									className="font-medium text-gray-700"
								>
									{category}
								</label>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default RecipeFilters;
