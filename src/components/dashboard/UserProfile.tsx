"use client";

import { useApi } from "@/hooks/useApi";
import Image from "next/image";
import { useState } from "react";

interface User {
	name?: string;
	email?: string;
	createdAt?: string;
}

export default function UserProfile({ user }: { user: User }) {
	const [isEditing, setIsEditing] = useState(false);
	const [name, setName] = useState(user?.name || "");

	const { isLoading, makeRequest: updateProfile } = useApi({
		url: "/api/user/profile",
		method: "PUT",
		onSuccess: (data) => {
			setIsEditing(false);
			user.name = data?.name || "";
			setName(data?.name || "");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateProfile({ body: { name } });
	};

	return (
		<div className="flex flex-col items-center">
			<div className="relative w-24 h-24 mb-4">
				<div className="absolute inset-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-semibold">
					{user?.name
						?.split(" ")
						.map((n) => n[0])
						.join("") || "U"}
				</div>
			</div>

			{isEditing ? (
				<form onSubmit={handleSubmit} className="w-full">
					<div className="mb-3">
						<label
							htmlFor="name"
							className="block text-sm font-medium text-gray-700"
						>
							Name
						</label>
						<input
							type="text"
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
							disabled={isLoading}
						/>
					</div>
					<div className="flex justify-end space-x-2">
						<button
							type="button"
							onClick={() => setIsEditing(false)}
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
				<>
					<h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
					<p className="text-sm text-gray-500">{user?.email}</p>
					<button
						type="button"
						onClick={() => setIsEditing(true)}
						className="mt-3 px-3 py-1 text-xs text-emerald-600 border border-emerald-600 rounded-md hover:bg-emerald-50"
					>
						Edit Profile
					</button>
				</>
			)}

			<div className="mt-4 pt-4 border-t border-gray-200 w-full">
				<div className="flex justify-between text-sm">
					<span className="text-gray-500">Member since:</span>
					<span className="text-gray-900 font-medium">
						{user?.createdAt
							? new Date(user.createdAt).toLocaleDateString()
							: "N/A"}
					</span>
				</div>
			</div>
		</div>
	);
}
