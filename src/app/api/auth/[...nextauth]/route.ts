import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

// Create and export the handler functions
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
