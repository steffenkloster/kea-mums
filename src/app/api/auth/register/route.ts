import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const registerSchema = z.object({
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
	dietaryPreferences: z.array(z.string()).optional(),
	termsAccepted: z.boolean().refine((val) => val === true, {
		message: "You must accept the terms and conditions",
	}),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		const validatedData = registerSchema.parse(body);

		const existingUser = await prisma.user.findUnique({
			where: {
				email: validatedData.email,
			},
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "A user with this email already exists" },
				{ status: 409 },
			);
		}

		const hashedPassword = await hash(validatedData.password, 10);

		const user = await prisma.user.create({
			data: {
				name: validatedData.name,
				email: validatedData.email,
				password: hashedPassword,
				dietaryPreferences: validatedData.dietaryPreferences || [],
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			select: {
				id: true,
				name: true,
				email: true,
				dietaryPreferences: true,
				createdAt: true,
			},
		});

		return NextResponse.json(
			{ user, message: "User registered successfully" },
			{ status: 201 },
		);
	} catch (error) {
		console.error("Registration error:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Validation failed", details: error.errors },
				{ status: 400 },
			);
		}

		return NextResponse.json({ error: "Registration failed" }, { status: 500 });
	}
}
