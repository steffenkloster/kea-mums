/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		// Allows builds to succeed even if ESLint reports errors
		ignoreDuringBuilds: true,
	},
	images: {
		dangerouslyAllowSVG: true,
		contentDispositionType: "attachment",
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},
};

module.exports = nextConfig;
