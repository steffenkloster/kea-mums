// types/auth.ts
// Authentication-related type definitions

import { ObjectId } from "mongodb";
import type { BaseModel } from "./common";
import type { User } from "./user";

// NextAuth Session with custom properties
export interface Session {
	user: {
		id: string;
		name?: string;
		email?: string;
		image?: string;
		dietaryPreferences?: string[];
	};
	expires: string;
}

// MongoDB Auth models
export interface AccountModel extends BaseModel {
	userId: string;
	type: string;
	provider: string;
	providerAccountId: string;
	refresh_token?: string;
	access_token?: string;
	expires_at?: number;
	token_type?: string;
	scope?: string;
	id_token?: string;
	session_state?: string;
	oauth_token_secret?: string;
	oauth_token?: string;
}

export interface SessionModel extends BaseModel {
	sessionToken: string;
	userId: string;
	expires: Date;
}

export interface VerificationTokenModel extends BaseModel {
	identifier: string;
	token: string;
	expires: Date;
}

// Auth responses
export interface AuthResponse {
	user: User;
	token?: string;
	success: boolean;
	message?: string;
}

// Password reset
export interface PasswordResetRequest {
	email: string;
}

export interface PasswordResetConfirmRequest {
	token: string;
	password: string;
}

// Email verification
export interface EmailVerificationRequest {
	token: string;
}

// Two-factor authentication
export interface TwoFactorAuthenticationSetup {
	secret: string;
	qrCodeUrl: string;
}

export interface TwoFactorAuthenticationVerify {
	token: string;
	secret: string;
}
