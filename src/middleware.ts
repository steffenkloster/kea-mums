import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if the pathname starts with /dashboard or is a protected route
	const isProtectedRoute =
		pathname.startsWith("/dashboard") ||
		pathname.startsWith("/profile") ||
		pathname.startsWith("/settings");

	if (isProtectedRoute) {
		const token = await getToken({
			req: request,
			secret: process.env.NEXTAUTH_SECRET,
		});

		// If the user is not authenticated, redirect to the login page
		if (!token) {
			const url = new URL("/login", request.url);
			url.searchParams.set("callbackUrl", encodeURI(request.url));
			return NextResponse.redirect(url);
		}
	}

	return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
	matcher: ["/dashboard/:path*", "/profile/:path*", "/settings/:path*"],
};
