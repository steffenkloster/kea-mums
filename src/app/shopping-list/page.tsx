"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useApi } from "@/hooks/useApi";
import { Dialog, Transition } from "@headlessui/react";
import {
	CalendarIcon,
	ClockIcon,
	PlusIcon,
	ShoppingCartIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Fragment } from "react";

import type { ShoppingList } from "@/types";

export default function ShoppingListsPage() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const [isCreatingList, setIsCreatingList] = useState(false);
	const [newListName, setNewListName] = useState("");

	// Fetch shopping lists
	const {
		data: shoppingLists,
		error,
		isLoading,
		makeRequest: fetchShoppingLists,
	} = useApi<ShoppingList[]>({
		url: "/api/shopping-lists",
		method: "GET",
	});

	// Create new shopping list
	const {
		error: createListError,
		isLoading: isCreatingListLoading,
		makeRequest: createShoppingList,
	} = useApi({
		url: "/api/shopping-lists",
		method: "POST",
	});

	// Fetch shopping lists on component mount
	useEffect(() => {
		if (status === "authenticated") {
			fetchShoppingLists();
		}
	}, [status, fetchShoppingLists]);

	// Redirect if not authenticated
	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	// Handle creating a new shopping list
	const handleCreateList = useCallback(async () => {
		if (!newListName.trim()) return;

		await createShoppingList({
			body: { name: newListName },
			onSuccess: (data) => {
				setIsCreatingList(false);
				setNewListName("");
				fetchShoppingLists();

				// Redirect to the new shopping list
				router.push(`/shopping-list/${data.id}`);
			},
		});
	}, [newListName, createShoppingList, fetchShoppingLists, router]);

	// Show loading state
	if (isLoading || status === "loading") {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-screen">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Header with actions */}
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold text-gray-900">Shopping Lists</h1>
					<button
						type="button"
						onClick={() => setIsCreatingList(true)}
						className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
					>
						<PlusIcon className="h-5 w-5 mr-2" />
						New Shopping List
					</button>
				</div>

				{/* Error state */}
				{error && (
					<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
						<div className="flex">
							<div className="flex-shrink-0">
								<XCircleIcon
									className="h-5 w-5 text-red-400"
									aria-hidden="true"
								/>
							</div>
							<div className="ml-3">
								<p className="text-sm text-red-700">
									{error.message ||
										"An error occurred while fetching your shopping lists."}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Shopping list grid */}
				{shoppingLists?.length === 0 ? (
					<div className="bg-white rounded-lg shadow-sm p-8 text-center">
						<ShoppingCartIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
						<h2 className="text-xl font-medium text-gray-900 mb-2">
							No Shopping Lists Yet
						</h2>
						<p className="text-gray-600 mb-6">
							Create your first shopping list or generate one from a meal plan.
						</p>
						<button
							type="button"
							onClick={() => setIsCreatingList(true)}
							className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
						>
							Create Shopping List
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{/* Create new list card */}
						<button
							type="button"
							onClick={() => setIsCreatingList(true)}
							className="bg-emerald-50 rounded-lg shadow-sm p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-100 transition-colors border-2 border-dashed border-emerald-200"
						>
							<PlusIcon className="h-12 w-12 text-emerald-500 mb-4" />
							<h3 className="text-lg font-medium text-emerald-700">
								Create New List
							</h3>
						</button>

						{/* Shopping list cards */}
						{shoppingLists?.map((list: ShoppingList) => (
							<Link
								key={list.id}
								href={`/shopping-list/${list.id}`}
								className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
							>
								<div className="flex items-start justify-between mb-4">
									<h3 className="text-lg font-medium text-gray-900">
										{list.name}
									</h3>
									<ShoppingCartIcon className="h-5 w-5 text-emerald-500" />
								</div>

								{/* Item count and progress */}
								{list.items && (
									<div className="mb-4">
										<div className="flex justify-between items-center mb-1 text-sm text-gray-600">
											<span>
												{
													list.items.filter(
														(item: { isChecked: boolean }) => item.isChecked,
													).length
												}{" "}
												of {list.items.length} items
											</span>
											<span>
												{Math.round(
													(list.items.filter(
														(item: { isChecked: boolean }) => item.isChecked,
													).length /
														list.items.length) *
														100,
												)}
												%
											</span>
										</div>
										<div className="w-full bg-gray-200 rounded-full h-2">
											<div
												className="bg-emerald-500 h-2 rounded-full"
												style={{
													width: `${(list.items.filter((item: { isChecked: boolean }) => item.isChecked).length / list.items.length) * 100}%`,
												}}
											/>
										</div>
									</div>
								)}

								{/* Meal plan info if exists */}
								{list.mealPlan && (
									<div className="flex items-center text-sm text-gray-500">
										<CalendarIcon className="h-4 w-4 mr-1" />
										<span>From: {list.mealPlan.name}</span>
									</div>
								)}

								{/* Date info */}
								<div className="flex items-center text-sm text-gray-500 mt-2">
									<ClockIcon className="h-4 w-4 mr-1" />
									<span>
										Created: {new Date(list.createdAt).toLocaleDateString()}
									</span>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>

			{/* Create List Modal */}
			<Transition appear show={isCreatingList} as={Fragment}>
				<Dialog
					as="div"
					className="relative z-10"
					onClose={() => setIsCreatingList(false)}
				>
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<div className="fixed inset-0 bg-black bg-opacity-25" />
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
										Create New Shopping List
									</Dialog.Title>

									{createListError && (
										<div className="mt-2 bg-red-50 border-l-4 border-red-400 p-3">
											<p className="text-sm text-red-700">
												{createListError.message}
											</p>
										</div>
									)}

									<div className="mt-4">
										<label
											htmlFor="list-name"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											List Name
										</label>
										<input
											type="text"
											id="list-name"
											value={newListName}
											onChange={(e) => setNewListName(e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
											placeholder="Weekly Groceries"
										/>
									</div>

									<div className="mt-6 flex justify-end gap-3">
										<button
											type="button"
											className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
											onClick={() => setIsCreatingList(false)}
										>
											Cancel
										</button>
										<button
											type="button"
											className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
											onClick={handleCreateList}
											disabled={!newListName.trim() || isCreatingListLoading}
										>
											{isCreatingListLoading ? "Creating..." : "Create List"}
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
