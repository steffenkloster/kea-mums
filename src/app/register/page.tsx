"use client";

import { mapApiErrorsToFormFields, useApi } from "@/hooks/useApi";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

// Define validation schema with Zod
const registerSchema = z
	.object({
		name: z
			.string()
			.min(2, { message: "Name must be at least 2 characters" })
			.max(50, { message: "Name must be less than 50 characters" }),
		email: z.string().email({ message: "Please enter a valid email address" }),
		password: z
			.string()
			.min(8, { message: "Password must be at least 8 characters" })
			.regex(/[A-Z]/, {
				message: "Password must contain at least one uppercase letter",
			})
			.regex(/[a-z]/, {
				message: "Password must contain at least one lowercase letter",
			})
			.regex(/[0-9]/, { message: "Password must contain at least one number" }),
		confirmPassword: z.string(),
		dietaryPreferences: z.array(z.string()).optional(),
		termsAccepted: z.boolean().refine((val) => val === true, {
			message: "You must accept the terms and conditions",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

// Typescript type derived from the Zod schema
type RegisterFormData = z.infer<typeof registerSchema>;

// Dietary preferences options
const dietaryOptions = [
	{ id: "vegetarian", label: "Vegetarian" },
	{ id: "vegan", label: "Vegan" },
	{ id: "glutenFree", label: "Gluten-Free" },
	{ id: "dairyFree", label: "Dairy-Free" },
	{ id: "keto", label: "Keto" },
	{ id: "paleo", label: "Paleo" },
];

export default function RegisterPage() {
	const router = useRouter();
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Form data state
	const [formData, setFormData] = useState<
		Omit<RegisterFormData, "dietaryPreferences"> & {
			dietaryPreferences: string[];
		}
	>({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		dietaryPreferences: [],
		termsAccepted: false,
	});

	// Use our custom API hook
	const { isLoading: isSubmitting, makeRequest: registerUser } = useApi({
		url: "/api/auth/register",
		method: "POST",
		onSuccess: async (data) => {
			// If registration was successful, sign in the user
			try {
				const result = await signIn("credentials", {
					redirect: false,
					email: formData.email,
					password: formData.password,
				});

				if (result?.error) {
					setErrors({
						form: "Registration successful but automatic login failed. Please try logging in.",
					});
					// Still redirect to welcome page
					setTimeout(() => {
						router.push("/register/welcome");
					}, 2000);
				} else {
					// Redirect to welcome page
					router.push("/register/welcome");
				}
			} catch (error) {
				setErrors({
					form: "Registration successful but automatic login failed. Please try logging in.",
				});
				setTimeout(() => {
					router.push("/register/welcome");
				}, 2000);
			}
		},
		onError: (error) => {
			setErrors(mapApiErrorsToFormFields(error));
		},
	});

	// Handle input changes
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;

		if (type === "checkbox") {
			if (name === "termsAccepted") {
				setFormData({
					...formData,
					[name]: checked,
				});
			} else {
				// Handle dietary preferences checkboxes
				const updatedPreferences = [...formData.dietaryPreferences];

				if (checked) {
					updatedPreferences.push(name);
				} else {
					const index = updatedPreferences.indexOf(name);
					if (index !== -1) {
						updatedPreferences.splice(index, 1);
					}
				}

				setFormData({
					...formData,
					dietaryPreferences: updatedPreferences,
				});
			}
		} else {
			setFormData({
				...formData,
				[name]: value,
			});
		}

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

		try {
			// Validate the form data against the schema
			const validatedData = registerSchema.parse(formData);

			// Send registration data to our API endpoint using our custom hook
			await registerUser({ body: validatedData });
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
				// Handle other errors (like network errors)
				setErrors({
					form:
						error instanceof Error
							? error.message
							: "Registration failed. Please try again later.",
				});
			}
		}
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
							Create your account
						</h2>
						<p className="mt-2 text-sm text-gray-600">
							Already have an account?{" "}
							<Link
								href="/login"
								className="font-medium text-emerald-600 hover:text-emerald-500"
							>
								Sign in
							</Link>
						</p>
					</div>

					<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
								<label htmlFor="name" className="form-label">
									Full Name
								</label>
								<input
									id="name"
									name="name"
									type="text"
									autoComplete="name"
									required
									value={formData.name}
									onChange={handleChange}
									className={`form-input ${errors.name ? "form-input-error" : ""}`}
									placeholder="John Doe"
								/>
								{errors.name && <p className="error-message">{errors.name}</p>}
							</div>

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
									autoComplete="new-password"
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

							<div className="mb-4">
								<label htmlFor="confirmPassword" className="form-label">
									Confirm Password
								</label>
								<input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									autoComplete="new-password"
									required
									value={formData.confirmPassword}
									onChange={handleChange}
									className={`form-input ${errors.confirmPassword ? "form-input-error" : ""}`}
									placeholder="••••••••"
								/>
								{errors.confirmPassword && (
									<p className="error-message">{errors.confirmPassword}</p>
								)}
							</div>
						</div>

						<div className="mb-4">
							<p className="form-label mb-2">Dietary Preferences (Optional)</p>
							<div className="grid grid-cols-2 gap-2">
								{dietaryOptions.map((option) => (
									<div key={option.id} className="flex items-start">
										<div className="flex items-center h-5">
											<input
												id={option.id}
												name={option.id}
												type="checkbox"
												checked={formData.dietaryPreferences.includes(
													option.id,
												)}
												onChange={handleChange}
												className="form-checkbox"
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
								))}
							</div>
						</div>

						<div className="flex items-center">
							<input
								id="termsAccepted"
								name="termsAccepted"
								type="checkbox"
								checked={formData.termsAccepted}
								onChange={handleChange}
								className={`form-checkbox ${errors.termsAccepted ? "form-checkbox-error" : ""}`}
							/>
							<label
								htmlFor="termsAccepted"
								className="ml-2 block text-sm text-gray-900"
							>
								I agree to the{" "}
								<Link
									href="/terms"
									className="font-medium text-emerald-600 hover:text-emerald-500"
								>
									Terms of Service
								</Link>{" "}
								and{" "}
								<Link
									href="/privacy"
									className="font-medium text-emerald-600 hover:text-emerald-500"
								>
									Privacy Policy
								</Link>
							</label>
						</div>
						{errors.termsAccepted && (
							<p className="error-message">{errors.termsAccepted}</p>
						)}

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
									"Create Account"
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
