"use client";

import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import {
	BookOpenIcon,
	ChartBarIcon,
	ClipboardIcon,
	Cog8ToothIcon,
	HomeIcon,
	ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
	{
		name: "Dashboard",
		href: "/dashboard",
		icon: <HomeIcon className="h-6 w-6" />,
	},
	{
		name: "Meal Plans",
		href: "/meal-planner",
		icon: <ClipboardIcon className="h-6 w-6" />,
	},
	{
		name: "Recipes",
		href: "/recipes",
		icon: <BookOpenIcon className="h-6 w-6" />,
	},
	{
		name: "Shopping List",
		href: "/shopping-list",
		icon: <ShoppingCartIcon className="h-6 w-6" />,
	},
	{
		name: "Activity",
		href: "/activity",
		icon: <ChartBarIcon className="h-6 w-6" />,
	},
	{
		name: "Settings",
		href: "/settings",
		icon: <Cog8ToothIcon className="h-6 w-6" />,
	},
];

import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	const { data: session } = useSession();
	const pathname = usePathname();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Mobile sidebar */}
			<dialog
				className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? "" : "hidden"}`}
				aria-modal="true"
			>
				{/* Backdrop */}
				<div
					tabIndex={0}
					role="button"
					className="fixed inset-0 bg-gray-600 bg-opacity-75"
					onClick={() => setSidebarOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") setSidebarOpen(false);
					}}
				/>

				{/* Sidebar panel */}
				<div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
					<div className="absolute top-0 right-0 -mr-12 pt-2">
						<button
							type="button"
							className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
							onClick={() => setSidebarOpen(false)}
						>
							<span className="sr-only">Close sidebar</span>
							<svg
								className="h-6 w-6 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
						<div className="flex-shrink-0 flex items-center px-4">
							<Link href="/" className="text-2xl font-bold text-emerald-600">
								<Image
									src="/logo.svg"
									alt="Logo"
									width={100}
									height={40}
									className="inline-block mr-2"
								/>
							</Link>
						</div>
						<nav className="mt-5 px-2 space-y-1">
							{navigation.map((item) => (
								<Link
									key={item.name}
									href={item.href}
									className={`${
										pathname === item.href
											? "bg-emerald-50 text-emerald-600"
											: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
									} group flex items-center px-2 py-2 text-base font-medium rounded-md`}
								>
									<div
										className={`${
											pathname === item.href
												? "text-emerald-600"
												: "text-gray-400 group-hover:text-gray-500"
										} mr-4`}
									>
										{item.icon}
									</div>
									{item.name}
								</Link>
							))}
						</nav>
					</div>
					<div className="flex-shrink-0 flex border-t border-gray-200 p-4">
						<button
							type="button"
							onClick={() => signOut({ callbackUrl: "/" })}
							className="flex-shrink-0 group block text-sm font-medium text-red-600 hover:text-red-800"
						>
							<div className="flex items-center">
								<ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
								<span>Sign Out</span>
							</div>
						</button>
					</div>
				</div>
			</dialog>

			{/* Static sidebar for desktop */}
			<div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
				<div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
					<div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
						<div className="flex items-center justify-center flex-shrink-0 px-4">
							<Link href="/" className="text-2xl font-bold text-emerald-600">
								<Image
									src="/logo.svg"
									alt="Logo"
									width={100}
									height={40}
									className="inline-block mr-2"
								/>
							</Link>
						</div>
						<nav className="mt-5 flex-1 px-2 space-y-1">
							{navigation.map((item) => (
								<Link
									key={item.name}
									href={item.href}
									className={`${
										pathname === item.href
											? "bg-emerald-50 text-emerald-600"
											: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
									} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
								>
									<div
										className={`${
											pathname === item.href
												? "text-emerald-600"
												: "text-gray-400 group-hover:text-gray-500"
										} mr-3`}
									>
										{item.icon}
									</div>
									{item.name}
								</Link>
							))}
						</nav>
					</div>
					<div className="flex-shrink-0 flex border-t border-gray-200 p-4">
						<div className="flex-shrink-0 w-full group block">
							<div className="flex items-center">
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-700 truncate">
										{session?.user?.name || "User"}
									</p>
									<p className="text-xs font-medium text-gray-500 truncate">
										{session?.user?.email || ""}
									</p>
								</div>
								<button
									type="button"
									onClick={() => signOut({ callbackUrl: "/" })}
									className="ml-2 flex-shrink-0 text-red-600 hover:text-red-800"
								>
									<ArrowRightOnRectangleIcon className="h-6 w-6" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Mobile top header */}
			<div className="lg:hidden">
				<div className="flex items-center justify-between bg-white px-4 py-2 border-b border-gray-200">
					<button
						type="button"
						className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
						onClick={() => setSidebarOpen(true)}
					>
						<span className="sr-only">Open sidebar</span>
						<svg
							className="block h-6 w-6"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</button>
					<div className="flex-1 flex justify-center">
						<Link href="/" className="text-2xl font-bold text-emerald-600">
							<Image
								src="/logo.svg"
								alt="Logo"
								width={100}
								height={30}
								className="inline-block mr-2"
							/>
						</Link>
					</div>
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<span className="text-sm font-medium text-gray-700">
								{session?.user?.name?.split(" ")[0] || "User"}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="lg:pl-64 flex flex-col flex-1">
				<main className="flex-1">{children}</main>
			</div>
		</div>
	);
}
