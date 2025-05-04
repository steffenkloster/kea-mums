"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

// Define validation schema with Zod
const loginSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z.string().min(1, { message: "Password is required" }),
	rememberMe: z.boolean().optional(),
});

// Typescript type derived from the Zod schema
type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
	const error = searchParams?.get("error");

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Form data state
	const [formData, setFormData] = useState<LoginFormData>({
		email: "",
		password: "",
		rememberMe: false,
	});

	// Handle input changes
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;

		setFormData({
			...formData,
			[name]: type === "checkbox" ? checked : value,
		});

		// Clear error for this field when user starts typing again
		if (errors[name]) {
			setErrors({
				...errors,
				[name]: "",
			});
		}
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Validate the form data against the schema
			const validatedData = loginSchema.parse(formData);

			// Use NextAuth to sign in
			const result = await signIn("credentials", {
				redirect: false,
				email: validatedData.email,
				password: validatedData.password,
				callbackUrl,
			});

			if (result?.error) {
				setErrors({
					form: "Invalid email or password",
				});
			} else if (result?.url) {
				router.push(result.url);
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				// Convert Zod errors into a more usable format
				const fieldErrors: Record<string, string> = {};
				for (const err of error.errors) {
					if (err.path) {
						fieldErrors[err.path[0]] = err.message;
					}
				}
				setErrors(fieldErrors);
			} else {
				// Handle other errors
				setErrors({
					form: "Login failed. Please check your credentials and try again.",
				});
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle social sign-in
	const handleSocialSignIn = (provider: string) => {
		signIn(provider, { callbackUrl });
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
				<div className="px-6 py-8">
					<div className="text-center">
						<Link href="/" className="text-2xl font-bold text-emerald-600">
							<Image
								src="/logo.svg"
								alt="Logo"
								width={100}
								height={100}
								className="inline-block mr-2"
							/>
						</Link>
						<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
							Sign in to your account
						</h2>
						<p className="mt-2 text-sm text-gray-600">
							Don't have an account yet?{" "}
							<Link
								href="/register"
								className="font-medium text-emerald-600 hover:text-emerald-500"
							>
								Create an account
							</Link>
						</p>
					</div>

					<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
						{/* Show error message from NextAuth */}
						{error && (
							<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
								<div className="flex">
									<div className="flex-shrink-0">
										<svg
											className="h-5 w-5 text-red-400"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											aria-hidden="true"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<div className="ml-3">
										<p className="text-sm text-red-700">
											{error === "CredentialsSignin"
												? "Invalid email or password"
												: "An error occurred. Please try again."}
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Form validation error */}
						{errors.form && (
							<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
								<div className="flex">
									<div className="flex-shrink-0">
										<svg
											className="h-5 w-5 text-red-400"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											aria-hidden="true"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<div className="ml-3">
										<p className="text-sm text-red-700">{errors.form}</p>
									</div>
								</div>
							</div>
						)}

						<div className="rounded-md -space-y-px">
							<div className="mb-4">
								<label htmlFor="email" className="form-label">
									Email address
								</label>
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									value={formData.email}
									onChange={handleChange}
									className={`form-input ${errors.email ? "form-input-error" : ""}`}
									placeholder="john@example.com"
								/>
								{errors.email && (
									<p className="error-message">{errors.email}</p>
								)}
							</div>

							<div className="mb-4">
								<label htmlFor="password" className="form-label">
									Password
								</label>
								<input
									id="password"
									name="password"
									type="password"
									autoComplete="current-password"
									required
									value={formData.password}
									onChange={handleChange}
									className={`form-input ${errors.password ? "form-input-error" : ""}`}
									placeholder="••••••••"
								/>
								{errors.password && (
									<p className="error-message">{errors.password}</p>
								)}
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<input
									id="rememberMe"
									name="rememberMe"
									type="checkbox"
									checked={formData.rememberMe}
									onChange={handleChange}
									className="form-checkbox"
								/>
								<label
									htmlFor="rememberMe"
									className="ml-2 block text-sm text-gray-900"
								>
									Remember me
								</label>
							</div>

							<div className="text-sm">
								<Link
									href="/forgot-password"
									className="font-medium text-emerald-600 hover:text-emerald-500"
								>
									Forgot your password?
								</Link>
							</div>
						</div>

						<div>
							<button
								type="submit"
								disabled={isSubmitting}
								className="submit-button"
							>
								{isSubmitting ? (
									<svg
										className="spinner"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<title>Loading...</title>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
								) : (
									"Sign in"
								)}
							</button>
						</div>

						{/* <div className="mt-6">
							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300"></div>
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-2 bg-white text-gray-500">
										Or continue with
									</span>
								</div>
							</div>

							<div className="mt-6 grid grid-cols-2 gap-3">
								<div>
									<button
										type="button"
										onClick={() => handleSocialSignIn("twitter")}
										className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
									>
										<svg
											className="w-5 h-5"
											fill="currentColor"
											viewBox="0 0 20 20"
											aria-hidden="true"
										>
											<path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
										</svg>
									</button>
								</div>

								<div>
									<button
										type="button"
										onClick={() => handleSocialSignIn("github")}
										className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
									>
										<svg
											className="w-5 h-5"
											fill="currentColor"
											viewBox="0 0 20 20"
											aria-hidden="true"
										>
											<path
												fillRule="evenodd"
												d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
												clipRule="evenodd"
											/>
										</svg>
									</button>
								</div>
							</div>
						</div> */}
					</form>
				</div>
			</div>
		</div>
	);
}
