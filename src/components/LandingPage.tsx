"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
	BookOpenIcon,
	CalendarIcon,
	CubeIcon,
	ShoppingCartIcon,
} from "@heroicons/react/24/outline";

export default function LandingPage() {
	const [email, setEmail] = useState("");

	return (
		<div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
			{/* Navigation */}
			<nav className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex">
							<div className="flex-shrink-0 flex items-center">
								<span className="text-2xl font-bold text-emerald-600">
									<Image
										src="/logo.svg"
										alt="MUMS Logo"
										width={80}
										height={40}
										className="mr-2 h-10"
									/>
								</span>
							</div>
						</div>
						<div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
							<Link
								href="#features"
								className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-emerald-600"
							>
								Features
							</Link>
							<Link
								href="#how-it-works"
								className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-emerald-600"
							>
								How It Works
							</Link>
							<Link
								href="#testimonials"
								className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-emerald-600"
							>
								Testimonials
							</Link>
						</div>
						<div className="flex items-center">
							<Link
								href="/login"
								className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-800"
							>
								Log in
							</Link>
							<Link
								href="/register"
								className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
							>
								Sign up
							</Link>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<div className="relative overflow-hidden">
				<div className="max-w-7xl mx-auto">
					<div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
						<main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 lg:mt-16 lg:px-8">
							<div className="sm:text-center lg:text-left">
								<h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
									<span className="block">Manage Your Meals</span>
									<span className="block text-emerald-600">
										&amp; Save Time and Money
									</span>
								</h1>
								<p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
									Plan your meals, generate shopping lists, and reduce food
									waste. MUMS helps you take control of your kitchen, simplify
									meal planning, and save money.
								</p>
								<div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
									<div className="rounded-md shadow">
										<Link
											href="/register"
											className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 md:py-4 md:text-lg md:px-10"
										>
											Get started
										</Link>
									</div>
									<div className="mt-3 sm:mt-0 sm:ml-3">
										<Link
											href="#features"
											className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 md:py-4 md:text-lg md:px-10"
										>
											Learn more
										</Link>
									</div>
								</div>
							</div>
						</main>
					</div>
				</div>
				<div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
					<div className="h-56 w-full sm:h-72 md:h-96 lg:w-full lg:h-full bg-emerald-50 flex items-center justify-center">
						<div className="relative w-full h-full">
							<Image
								src="/images/hero-image.jpeg"
								alt="Delicious meal preparation"
								fill
								objectFit="cover"
								priority
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<div id="features" className="py-12 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="lg:text-center">
						<h2 className="text-base text-emerald-600 font-semibold tracking-wide uppercase">
							Features
						</h2>
						<p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
							Everything you need to plan your meals
						</p>
						<p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
							MUMS brings all your cooking needs into one place, making meal
							planning effortless.
						</p>
					</div>

					<div className="mt-10">
						<div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
							<FeatureCard
								icon={<BookOpenIcon className="w-8 h-8" />}
								title="Recipe Library"
								description="Browse thousands of recipes or add your own. Search by ingredients, cuisine, diet, and more."
							/>
							<FeatureCard
								icon={<CalendarIcon className="w-8 h-8" />}
								title="Meal Planning"
								description="Drag and drop recipes onto a weekly calendar. Plan your meals in advance and save time."
							/>
							<FeatureCard
								icon={<ShoppingCartIcon className="w-8 h-8" />}
								title="Smart Shopping Lists"
								description="Automatically generate shopping lists from your meal plans. Consolidate ingredients and reduce waste."
							/>
							<FeatureCard
								icon={<CubeIcon className="w-8 h-8" />}
								title="Pantry Management"
								description="Track what's in your pantry and get recipe recommendations based on what you already have."
							/>
						</div>
					</div>
				</div>
			</div>

			{/* How it Works */}
			<div id="how-it-works" className="bg-green-50 py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-base text-emerald-600 font-semibold tracking-wide uppercase">
							How It Works
						</h2>
						<p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
							Simple steps to meal mastery
						</p>
					</div>

					<div className="mt-12">
						<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
							<StepCard
								number="1"
								title="Browse Recipes"
								description="Search our extensive collection of recipes or add your family favorites."
							/>
							<StepCard
								number="2"
								title="Plan Your Meals"
								description="Drag recipes onto your weekly calendar to create a complete meal plan."
							/>
							<StepCard
								number="3"
								title="Shop & Cook"
								description="Use your auto-generated shopping list and follow your plan."
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Testimonials */}
			<div id="testimonials" className="bg-white py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-base text-emerald-600 font-semibold tracking-wide uppercase">
							Testimonials
						</h2>
						<p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
							What our users are saying
						</p>
					</div>

					<div className="mt-12 grid gap-8 md:grid-cols-3">
						<TestimonialCard
							quote="MUMS has completely changed how I approach cooking. I've saved so much money by reducing food waste!"
							name="Sarah Johnson"
							userTitle="Busy Parent"
						/>
						<TestimonialCard
							quote="I never knew meal planning could be this easy. The shopping list feature alone has saved me hours every week."
							name="Michael Chen"
							userTitle="Home Cook"
						/>
						<TestimonialCard
							quote="As a student, I've been able to eat healthier while spending less on groceries. The pantry tracker is brilliant!"
							name="Emma Rodriguez"
							userTitle="Student"
						/>
					</div>
				</div>
			</div>

			{/* Call to Action */}
			<div className="bg-emerald-700">
				<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
					<h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
						<span className="block">Ready to get started?</span>
						<span className="block text-emerald-200">
							Join MUMS today and transform your meal planning.
						</span>
					</h2>
					<div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
						<div className="inline-flex rounded-md shadow">
							<Link
								href="/register"
								className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-emerald-600 bg-white hover:bg-gray-50"
							>
								Sign up for free
							</Link>
						</div>
					</div>
				</div>
			</div>

			{/* Newsletter */}
			<div className="bg-gray-50">
				<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
					<div className="max-w-3xl mx-auto text-center">
						<h2 className="text-3xl font-extrabold text-gray-900">
							Join our newsletter
						</h2>
						<p className="mt-4 text-lg text-gray-500">
							Get weekly recipe inspiration and meal planning tips straight to
							your inbox.
						</p>
						<div className="mt-8 flex justify-center">
							<div className="w-full max-w-md">
								<form className="sm:flex">
									<input
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="Enter your email"
										className="w-full px-5 py-3 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
										required
									/>
									<button
										type="submit"
										className="mt-3 w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto"
									>
										Subscribe
									</button>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<footer className="bg-white">
				<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
					<div className="border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
						<div className="flex space-x-6 md:order-2">
							<SocialLink
								href="#"
								label="Facebook"
								svgPath="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
							/>
							<SocialLink
								href="#"
								label="Instagram"
								svgPath="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
							/>
							<SocialLink
								href="#"
								label="Twitter"
								svgPath="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
							/>
						</div>
						<p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
							&copy; {new Date().getFullYear()} MUMS. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="flex">
			<div className="flex-shrink-0">
				<div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-500 text-white">
					{icon}
				</div>
			</div>
			<div className="ml-4">
				<h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
				<p className="mt-2 text-base text-gray-500">{description}</p>
			</div>
		</div>
	);
}

function StepCard({
	number,
	title,
	description,
}: {
	number: string;
	title: string;
	description: string;
}) {
	return (
		<div className="bg-white rounded-lg shadow-md overflow-hidden">
			<div className="p-6 text-center">
				<span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 text-xl font-bold">
					{number}
				</span>
				<h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
				<p className="mt-2 text-base text-gray-500">{description}</p>
			</div>
		</div>
	);
}

function TestimonialCard({
	quote,
	name,
	userTitle,
}: {
	quote: string;
	name: string;
	userTitle: string;
}) {
	return (
		<div className="bg-gray-50 rounded-lg p-6 shadow-sm">
			<p className="text-gray-600 italic">"{quote}"</p>
			<div className="mt-4 flex items-center">
				<div className="h-10 w-10 rounded-full bg-gray-300" />
				<div className="ml-3">
					<p className="text-sm font-medium text-gray-900">{name}</p>
					<p className="text-sm text-gray-500">{userTitle}</p>
				</div>
			</div>
		</div>
	);
}

function SocialLink({
	href,
	label,
	svgPath,
}: {
	href: string;
	label: string;
	svgPath: string;
}) {
	return (
		<Link
			href={href}
			className="text-gray-400 hover:text-gray-500"
			aria-label={label}
		>
			<svg
				className="h-6 w-6"
				fill="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path d={svgPath} />
			</svg>
		</Link>
	);
}
