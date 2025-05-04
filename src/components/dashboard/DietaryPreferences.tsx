// components/dashboard/DietaryPreferences.js
"use client";

import { useApi } from "@/hooks/useApi";
import { useEffect, useState } from "react";

const dietaryOptions = [
	{ id: "vegetarian", label: "Vegetarian" },
	{ id: "vegan", label: "Vegan" },
	{ id: "glutenFree", label: "Gluten-Free" },
	{ id: "dairyFree", label: "Dairy-Free" },
	{ id: "keto", label: "Keto" },
	{ id: "paleo", label: "Paleo" },
];

interface DietaryPreferencesProps {
	preferences?: string[];
	onUpdatePreferences?: (updatedPreferences: string[]) => void;
}

export default function DietaryPreferences({
	preferences = [],
	onUpdatePreferences,
}: DietaryPreferencesProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [selectedPreferences, setSelectedPreferences] = useState(preferences);

	useEffect(() => {
		setSelectedPreferences(preferences);
	}, [preferences]);

	const { isLoading, makeRequest: updatePreferences } = useApi({
		url: "/api/user/preferences",
		method: "PUT",
		onSuccess: (data) => {
			setIsEditing(false);
			if (onUpdatePreferences) {
				onUpdatePreferences(selectedPreferences);
			}
		},
	});

	const handleCheckboxChange = (id: string) => {
		setSelectedPreferences((prev) => {
			if (prev.includes(id)) {
				return prev.filter((p) => p !== id);
			}

			return [...prev, id];
		});
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		updatePreferences({ body: { dietaryPreferences: selectedPreferences } });
	};

	return (
		<div>
			{isEditing ? (
				<form onSubmit={handleSubmit}>
					<div className="space-y-2">
						{dietaryOptions.map((option) => {
							const isChecked = selectedPreferences.includes(option.id);
							return (
								<div key={option.id} className="flex items-start">
									<div className="flex items-center h-5">
										<input
											id={option.id}
											name={option.id}
											type="checkbox"
											checked={isChecked}
											onChange={() => handleCheckboxChange(option.id)}
											className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
											disabled={isLoading}
										/>
									</div>
									<div className="ml-3 text-sm">
										<label
											htmlFor={option.id}
											className="font-medium text-gray-700"
										>
											{option.label}
										</label>
									</div>
								</div>
							);
						})}
					</div>
					<div className="mt-4 flex justify-end space-x-2">
						<button
							type="button"
							onClick={() => {
								setSelectedPreferences(preferences);
								setIsEditing(false);
							}}
							className="px-3 py-1 text-xs text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-3 py-1 text-xs text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700"
							disabled={isLoading}
						>
							{isLoading ? "Saving..." : "Save"}
						</button>
					</div>
				</form>
			) : (
				<div>
					<div className="flex flex-wrap gap-2">
						{preferences.length > 0 ? (
							preferences.map((pref) => {
								const option = dietaryOptions.find((o) => o.id === pref);
								return option ? (
									<span
										key={pref}
										className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
									>
										{option.label}
									</span>
								) : null;
							})
						) : (
							<p className="text-sm text-gray-500">
								No dietary preferences set
							</p>
						)}
					</div>
					<button
						type="button"
						onClick={() => setIsEditing(true)}
						className="mt-3 px-3 py-1 text-xs text-emerald-600 border border-emerald-600 rounded-md hover:bg-emerald-50"
					>
						Edit Preferences
					</button>
				</div>
			)}
		</div>
	);
}
