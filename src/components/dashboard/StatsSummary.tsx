import {
	CheckCircleIcon,
	ClipboardIcon,
	HeartIcon,
} from "@heroicons/react/24/outline";

export default function StatsSummary({ stats = {} }) {
	// Default stats if none provided
	const defaultStats = {
		mealPlans: 3,
		savedRecipes: 12,
		completedMeals: 28,
	};

	const statsToDisplay = {
		...defaultStats,
		...stats,
	};

	return (
		<div className="bg-white rounded-lg shadow-sm p-6">
			<h2 className="text-lg font-medium text-gray-900 mb-5">
				Your Statistics
			</h2>
			<div className="grid grid-cols-3 gap-4">
				<div className="bg-emerald-50 rounded-lg p-4 text-center">
					<div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-500 text-white mx-auto mb-3">
						<ClipboardIcon className="h-6 w-6" />
					</div>
					<span className="block text-2xl font-bold text-gray-900">
						{statsToDisplay.mealPlans}
					</span>
					<span className="block text-sm text-gray-600">Meal Plans</span>
				</div>
				<div className="bg-blue-50 rounded-lg p-4 text-center">
					<div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto mb-3">
						<HeartIcon className="h-6 w-6" />
					</div>
					<span className="block text-2xl font-bold text-gray-900">
						{statsToDisplay.savedRecipes}
					</span>
					<span className="block text-sm text-gray-600">Saved Recipes</span>
				</div>
				<div className="bg-yellow-50 rounded-lg p-4 text-center">
					<div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-white mx-auto mb-3">
						<CheckCircleIcon className="h-6 w-6" />
					</div>
					<span className="block text-2xl font-bold text-gray-900">
						{statsToDisplay.completedMeals}
					</span>
					<span className="block text-sm text-gray-600">Completed Meals</span>
				</div>
			</div>
		</div>
	);
}
