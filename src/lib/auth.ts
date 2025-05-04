import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import type { NextAuthOptions, SessionStrategy } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error("Email and password required");
				}

				try {
					if (!process.env.MONGODB_URI) {
						throw new Error(
							"MONGODB_URI is not defined in environment variables",
						);
					}

					const { db } = await connectToDatabase();
					const users = db.collection("User");

					const user = await users.findOne({
						email: credentials.email.toLocaleLowerCase().trim(),
					});

					if (!user || !user.password) {
						throw new Error("No user found with this email");
					}

					const isPasswordValid = await bcrypt.compare(
						credentials.password,
						user.password,
					);
					if (!isPasswordValid) {
						throw new Error("Invalid password");
					}

					return {
						id: user._id.toString(),
						name: user.name,
						email: user.email,
					};
				} catch (error) {
					console.error("Authorization error:", error);
					if (error instanceof Error) {
						throw new Error(error.message || "Authentication error");
					}
					throw new Error("Authentication error");
				}
			},
		}),
	],
	session: {
		strategy: "jwt" as SessionStrategy,
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	callbacks: {
		async session({ session, token }: { session: any; token: any }) {
			if (token && session.user) {
				session.user.id = token.sub;
			}
			return session;
		},
		async jwt({ token, user }: { token: any; user?: { id: string } }) {
			if (user) {
				token.sub = user.id;
			}
			return token;
		},
	},
	pages: {
		signIn: "/login",
		newUser: "/dashboard", // TODO: Create a welcome page
		error: "/login",
	},
	secret: process.env.NEXTAUTH_SECRET,
	debug: process.env.NODE_ENV === "development",
};
