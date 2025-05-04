import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type React from "react";
import { useEffect, useState } from "react";

interface RecipeSearchBarProps {
	onSearch: (query: string) => void;
	initialQuery?: string;
}

const RecipeSearchBar: React.FC<RecipeSearchBarProps> = ({
	onSearch,
	initialQuery = "",
}) => {
	const [query, setQuery] = useState(initialQuery);

	// Update local state when initialQuery prop changes
	useEffect(() => {
		setQuery(initialQuery);
	}, [initialQuery]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		onSearch(query);
	};

	return (
		<form onSubmit={handleSubmit} className="w-full">
			<div className="relative">
				<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg
						className="h-5 w-5 text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fillRule="evenodd"
							d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
							clipRule="evenodd"
						/>
					</svg>
				</div>
				<input
					type="text"
					name="search"
					id="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="focus:ring-emerald-500 focus:border-emerald-500 block w-full !pl-10 !pr-12 py-2 sm:text-sm border-gray-300 rounded-md"
					placeholder="Search recipes, ingredients, cuisines..."
				/>
				<div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
					{query && (
						<button
							type="button"
							onClick={() => {
								setQuery("");
								onSearch("");
							}}
							className="z-10 inline-flex items-center border border-transparent rounded-md px-2 text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none"
						>
							<MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
						</button>
					)}
					<button
						type="submit"
						className="z-10 inline-flex items-center border border-transparent rounded-md px-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none"
					>
						Search
					</button>
				</div>
			</div>
		</form>
	);
};

export default RecipeSearchBar;
