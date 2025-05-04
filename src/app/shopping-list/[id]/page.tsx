"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useApi } from "@/hooks/useApi";
import { Dialog, Listbox, Transition } from "@headlessui/react";
import {
	ArrowLeftIcon,
	CheckCircleIcon,
	CheckIcon,
	PencilIcon,
	PlusIcon,
	PrinterIcon,
	ShareIcon,
	ShoppingCartIcon,
	TrashIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Fragment } from "react";

import type {
	Ingredient,
	IngredientModel,
	ShoppingList,
	ShoppingListItem,
} from "@/types";

// Used for grouping shopping list items
type GroupedItems = {
	[category: string]: ShoppingListItem[];
};

export default function ShoppingListPage() {
	const params = useParams();
	const shoppingListId = params.id as string;
	const router = useRouter();
	const { data: session, status } = useSession();
	const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
	const [editedQuantity, setEditedQuantity] = useState<number>(0);
	const [editedUnit, setEditedUnit] = useState<string>("");
	const [editedNotes, setEditedNotes] = useState<string>("");
	const [isAddingItem, setIsAddingItem] = useState(false);
	const [newItemName, setNewItemName] = useState("");
	const [newItemQuantity, setNewItemQuantity] = useState(1);
	const [newItemUnit, setNewItemUnit] = useState("unit");
	const [newItemNotes, setNewItemNotes] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// Fetch shopping list data
	const {
		data: shoppingList,
		error,
		isLoading,
		makeRequest: fetchShoppingList,
	} = useApi<ShoppingList>({
		url: `/api/shopping-lists/${shoppingListId}`,
		method: "GET",
	});

	// For ingredient search when adding new items
	const {
		data: searchResults,
		isLoading: isSearching,
		makeRequest: searchIngredients,
	} = useApi<Ingredient[]>({
		url: "/api/ingredients/search",
		method: "GET",
	});

	// Update item in shopping list
	const { isLoading: isUpdating, makeRequest: updateShoppingListItem } = useApi(
		{
			url: "",
			method: "PATCH",
		},
	);

	// Delete item from shopping list
	const { isLoading: isDeleting, makeRequest: deleteShoppingListItem } = useApi(
		{
			url: "",
			method: "DELETE",
		},
	);

	// Add item to shopping list
	const { isLoading: isAddingNewItem, makeRequest: addShoppingListItem } =
		useApi({
			url: `/api/shopping-lists/${shoppingListId}/items`,
			method: "POST",
		});

	// Delete entire shopping list
	const { isLoading: isDeletingList, makeRequest: deleteShoppingList } = useApi(
		{
			url: `/api/shopping-lists/${shoppingListId}`,
			method: "DELETE",
		},
	);

	// Fetch shopping list on component mount
	useEffect(() => {
		if (status === "authenticated" && shoppingListId) {
			fetchShoppingList();
		}
	}, [status, shoppingListId, fetchShoppingList]);

	// Redirect if not authenticated
	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	// Handle checking/unchecking item
	const handleToggleItem = useCallback(
		async (item: ShoppingListItem) => {
			await updateShoppingListItem({
				url: `/api/shopping-lists/${shoppingListId}/items/${item.id}`,
				body: {
					isChecked: !item.isChecked,
				},
				onSuccess: () => {
					fetchShoppingList();
				},
			});
		},
		[shoppingListId, updateShoppingListItem, fetchShoppingList],
	);

	// Handle updating item
	const handleUpdateItem = useCallback(async () => {
		if (!editingItem) return;

		await updateShoppingListItem({
			url: `/api/shopping-lists/${shoppingListId}/items/${editingItem.id}`,
			body: {
				quantity: editedQuantity,
				unit: editedUnit,
				notes: editedNotes || null,
			},
			onSuccess: () => {
				setEditingItem(null);
				fetchShoppingList();
			},
		});
	}, [
		shoppingListId,
		editingItem,
		editedQuantity,
		editedUnit,
		editedNotes,
		updateShoppingListItem,
		fetchShoppingList,
	]);

	// Handle deleting item
	const handleDeleteItem = useCallback(
		async (itemId: string) => {
			await deleteShoppingListItem({
				url: `/api/shopping-lists/${shoppingListId}/items/${itemId}`,
				onSuccess: () => {
					fetchShoppingList();
				},
			});
		},
		[shoppingListId, deleteShoppingListItem, fetchShoppingList],
	);

	// Handle searching ingredients
	const handleSearchIngredients = useCallback(() => {
		if (searchQuery.trim()) {
			searchIngredients({
				query: {
					query: searchQuery,
					limit: 5,
				},
			});
		}
	}, [searchQuery, searchIngredients]);

	// Handle adding new item
	const handleAddItem = useCallback(async () => {
		if (!newItemName.trim() || newItemQuantity <= 0) return;

		await addShoppingListItem({
			body: {
				name: newItemName,
				quantity: newItemQuantity,
				unit: newItemUnit,
				notes: newItemNotes || null,
			},
			onSuccess: () => {
				setIsAddingItem(false);
				setNewItemName("");
				setNewItemQuantity(1);
				setNewItemUnit("unit");
				setNewItemNotes("");
				setSearchQuery("");
				fetchShoppingList();
			},
		});
	}, [
		newItemName,
		newItemQuantity,
		newItemUnit,
		newItemNotes,
		addShoppingListItem,
		fetchShoppingList,
	]);

	// Handle deleting the entire shopping list
	const handleDeleteList = useCallback(async () => {
		await deleteShoppingList({
			onSuccess: () => {
				router.push("/shopping-list");
			},
		});
	}, [deleteShoppingList, router]);

	// Group items by category
	const groupedItems = shoppingList?.items.reduce(
		(acc: GroupedItems, item: ShoppingListItem) => {
			const category = item.ingredient.category || "Other";
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(item);
			return acc;
		},
		{},
	);

	// Calculate progress
	const totalItems = shoppingList?.items.length || 0;
	const checkedItems =
		shoppingList?.items.filter((item: ShoppingListItem) => item.isChecked)
			.length || 0;
	const progress =
		totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

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

	// Show error state
	if (error || !shoppingList) {
		return (
			<DashboardLayout>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="bg-red-50 border-l-4 border-red-400 p-4">
						<div className="flex">
							<div className="flex-shrink-0">
								<XCircleIcon
									className="h-5 w-5 text-red-400"
									aria-hidden="true"
								/>
							</div>
							<div className="ml-3">
								<p className="text-sm text-red-700">
									{error?.message || "Shopping list not found"}
								</p>
								<div className="mt-2">
									<Link
										href="/shopping-list"
										className="text-sm font-medium text-red-700 hover:text-red-600"
									>
										Go back to shopping lists
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
				{/* Header with navigation and actions */}
				<div className="mb-6">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
						<div>
							<div className="flex items-center mb-2">
								<button
									type="button"
									onClick={() => router.back()}
									className="mr-2 text-gray-600 hover:text-emerald-600"
								>
									<ArrowLeftIcon className="h-5 w-5" />
								</button>
								<h1 className="text-2xl font-bold text-gray-900">
									{shoppingList.name}
								</h1>
							</div>
							{shoppingList.mealPlan && (
								<Link
									href={`/meal-planner/${shoppingList.mealPlan.id}`}
									className="text-sm text-emerald-600 hover:text-emerald-700"
								>
									From meal plan: {shoppingList.mealPlan.name}
								</Link>
							)}
						</div>
						<div className="flex mt-4 sm:mt-0 space-x-2">
							<button
								type="button"
								onClick={() => window.print()}
								className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
							>
								<PrinterIcon className="h-5 w-5 mr-1" />
								<span className="hidden sm:inline">Print</span>
							</button>
							<button
								type="button"
								onClick={() => {
									if (navigator.share) {
										navigator.share({
											title: shoppingList.name,
											text: `Check out my shopping list: ${shoppingList.name}`,
											url: window.location.href,
										});
									} else {
										navigator.clipboard.writeText(window.location.href);
										alert("Link copied to clipboard");
									}
								}}
								className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
							>
								<ShareIcon className="h-5 w-5 mr-1" />
								<span className="hidden sm:inline">Share</span>
							</button>
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(true)}
								className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
							>
								<TrashIcon className="h-5 w-5 mr-1" />
								<span className="hidden sm:inline">Delete</span>
							</button>
						</div>
					</div>

					{/* Progress bar */}
					<div className="bg-white rounded-lg shadow-sm p-4 mb-6">
						<div className="flex justify-between items-center mb-2">
							<h2 className="text-lg font-medium text-gray-900">
								Shopping Progress
							</h2>
							<span className="text-sm text-gray-500">
								{checkedItems} of {totalItems} items
							</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2.5">
							<div
								className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>

					{/* Add Item Button */}
					<button
						type="button"
						onClick={() => setIsAddingItem(true)}
						className="mb-6 w-full flex items-center justify-center py-3 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
					>
						<PlusIcon className="h-5 w-5 mr-2" />
						Add Item
					</button>
				</div>

				{/* Shopping list */}
				{totalItems === 0 ? (
					<div className="bg-white rounded-lg shadow-sm p-6 text-center">
						<ShoppingCartIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							Your shopping list is empty
						</h3>
						<p className="text-gray-500 mb-4">
							Add items to your shopping list or generate one from a meal plan.
						</p>
						<button
							type="button"
							onClick={() => setIsAddingItem(true)}
							className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
						>
							Add First Item
						</button>
					</div>
				) : (
					<div className="space-y-6">
						{/* Group items by category */}
						{Object.entries(groupedItems || {}).map(([category, items]) => (
							<div
								key={category}
								className="bg-white rounded-lg shadow-sm overflow-hidden"
							>
								<div className="bg-gray-50 px-4 py-3 border-b">
									<h3 className="text-lg font-medium text-gray-900">
										{category}
									</h3>
								</div>
								<ul className="divide-y divide-gray-200">
									{(items as ShoppingListItem[]).map((item) => (
										<li key={item.id} className="px-4 py-3">
											<div className="flex items-start">
												<button
													type="button"
													onClick={() => handleToggleItem(item)}
													className={`flex-shrink-0 h-6 w-6 mr-3 rounded-full flex items-center justify-center border ${
														item.isChecked
															? "bg-emerald-500 border-emerald-500 text-white"
															: "border-gray-300 text-transparent"
													}`}
												>
													{item.isChecked && <CheckIcon className="h-4 w-4" />}
												</button>
												<div
													className={`flex-1 ${item.isChecked ? "line-through text-gray-500" : "text-gray-900"}`}
												>
													<div className="flex justify-between">
														<span className="font-medium">
															{item.ingredient.name}
														</span>
														<div className="flex space-x-2">
															<button
																type="button"
																onClick={() => {
																	setEditingItem(item);
																	setEditedQuantity(item.quantity);
																	setEditedUnit(item.unit);
																	setEditedNotes(item.notes || "");
																}}
																className="text-gray-400 hover:text-emerald-600"
															>
																<PencilIcon className="h-5 w-5" />
															</button>
															<button
																type="button"
																onClick={() => handleDeleteItem(item.id)}
																className="text-gray-400 hover:text-red-600"
															>
																<TrashIcon className="h-5 w-5" />
															</button>
														</div>
													</div>
													<div className="text-sm text-gray-500">
														{item.quantity} {item.unit}
														{item.notes && (
															<span className="ml-2 italic">
																({item.notes})
															</span>
														)}
													</div>
												</div>
											</div>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Edit Item Modal */}
			<Transition appear show={!!editingItem} as={Fragment}>
				<Dialog
					as="div"
					className="relative z-10"
					onClose={() => setEditingItem(null)}
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
										Edit Item
									</Dialog.Title>

									<div className="mt-4">
										<div className="mb-4">
											<p className="block text-sm font-medium text-gray-700 mb-1">
												Item
											</p>
											<p className="p-2 bg-gray-50 rounded-md">
												{editingItem?.ingredient.name}
											</p>
										</div>

										<div className="grid grid-cols-2 gap-4 mb-4">
											<div>
												<label
													htmlFor="quantity"
													className="block text-sm font-medium text-gray-700 mb-1"
												>
													Quantity
												</label>
												<input
													type="number"
													id="quantity"
													min="0.1"
													step="0.1"
													value={editedQuantity}
													onChange={(e) =>
														setEditedQuantity(
															Number.parseFloat(e.target.value) || 0,
														)
													}
													className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
												/>
											</div>
											<div>
												<label
													htmlFor="unit"
													className="block text-sm font-medium text-gray-700 mb-1"
												>
													Unit
												</label>
												<input
													type="text"
													id="unit"
													value={editedUnit}
													onChange={(e) => setEditedUnit(e.target.value)}
													className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
												/>
											</div>
										</div>

										<div className="mb-4">
											<label
												htmlFor="notes"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Notes (Optional)
											</label>
											<input
												type="text"
												id="notes"
												value={editedNotes}
												onChange={(e) => setEditedNotes(e.target.value)}
												placeholder="E.g., Brand preference, size, etc."
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
											/>
										</div>
									</div>

									<div className="mt-6 flex justify-end space-x-3">
										<button
											type="button"
											className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
											onClick={() => setEditingItem(null)}
										>
											Cancel
										</button>
										<button
											type="button"
											className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
											onClick={handleUpdateItem}
											disabled={isUpdating}
										>
											{isUpdating ? "Saving..." : "Save Changes"}
										</button>
									</div>
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition>

			{/* Add Item Modal */}
			<Transition appear show={isAddingItem} as={Fragment}>
				<Dialog
					as="div"
					className="relative z-10"
					onClose={() => setIsAddingItem(false)}
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
										Add Item to Shopping List
									</Dialog.Title>

									<div className="mt-4">
										{/* Search or enter item */}
										<div className="mb-4">
											<label
												htmlFor="item-name"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Item Name
											</label>
											<div className="flex mb-2">
												<input
													type="text"
													id="item-search"
													value={searchQuery}
													onChange={(e) => setSearchQuery(e.target.value)}
													placeholder="Search ingredients..."
													className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
												/>
												<button
													type="button"
													onClick={handleSearchIngredients}
													disabled={!searchQuery.trim() || isSearching}
													className="px-4 py-2 bg-emerald-600 text-white rounded-r-md hover:bg-emerald-700 disabled:opacity-50"
												>
													{isSearching ? "..." : "Search"}
												</button>
											</div>

											{/* Search results */}
											{searchResults && searchResults.length > 0 && (
												<div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
													<ul className="divide-y divide-gray-200">
														{searchResults.map(
															(ingredient: IngredientModel) => (
																<li key={ingredient.id}>
																	<button
																		type="button"
																		className="w-full px-3 py-2 text-left hover:bg-gray-50"
																		onClick={() => {
																			setNewItemName(ingredient.name);
																			setNewItemUnit(
																				ingredient.units?.[0] || "unit",
																			);
																			setSearchQuery("");
																		}}
																	>
																		{ingredient.name}
																	</button>
																</li>
															),
														)}
													</ul>
												</div>
											)}

											<input
												type="text"
												id="item-name"
												value={newItemName}
												onChange={(e) => setNewItemName(e.target.value)}
												placeholder="Enter item name..."
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
											/>
										</div>

										{/* Quantity and unit */}
										<div className="grid grid-cols-2 gap-4 mb-4">
											<div>
												<label
													htmlFor="new-quantity"
													className="block text-sm font-medium text-gray-700 mb-1"
												>
													Quantity
												</label>
												<input
													type="number"
													id="new-quantity"
													min="0.1"
													step="0.1"
													value={newItemQuantity}
													onChange={(e) =>
														setNewItemQuantity(
															Number.parseFloat(e.target.value) || 0,
														)
													}
													className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
												/>
											</div>
											<div>
												<label
													htmlFor="new-unit"
													className="block text-sm font-medium text-gray-700 mb-1"
												>
													Unit
												</label>
												<input
													type="text"
													id="new-unit"
													value={newItemUnit}
													onChange={(e) => setNewItemUnit(e.target.value)}
													className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
												/>
											</div>
										</div>

										{/* Notes */}
										<div className="mb-4">
											<label
												htmlFor="new-notes"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Notes (Optional)
											</label>
											<input
												type="text"
												id="new-notes"
												value={newItemNotes}
												onChange={(e) => setNewItemNotes(e.target.value)}
												placeholder="E.g., Brand preference, size, etc."
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
											/>
										</div>
									</div>

									<div className="mt-6 flex justify-end space-x-3">
										<button
											type="button"
											className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
											onClick={() => setIsAddingItem(false)}
										>
											Cancel
										</button>
										<button
											type="button"
											className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
											onClick={handleAddItem}
											disabled={
												!newItemName.trim() ||
												newItemQuantity <= 0 ||
												isAddingNewItem
											}
										>
											{isAddingNewItem ? "Adding..." : "Add Item"}
										</button>
									</div>
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition>

			{/* Delete Confirmation Modal */}
			<Transition appear show={showDeleteConfirm} as={Fragment}>
				<Dialog
					as="div"
					className="relative z-10"
					onClose={() => setShowDeleteConfirm(false)}
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
										Delete Shopping List
									</Dialog.Title>

									<div className="mt-4">
										<p className="text-gray-700">
											Are you sure you want to delete this shopping list? This
											action cannot be undone.
										</p>
									</div>

									<div className="mt-6 flex justify-end space-x-3">
										<button
											type="button"
											className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
											onClick={() => setShowDeleteConfirm(false)}
										>
											Cancel
										</button>
										<button
											type="button"
											className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
											onClick={handleDeleteList}
											disabled={isDeletingList}
										>
											{isDeletingList ? "Deleting..." : "Delete List"}
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
