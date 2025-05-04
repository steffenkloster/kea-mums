const withSvgr = require("next-plugin-svgr");

/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		// Allows builds to succeed even if ESLint reports errors
		ignoreDuringBuilds: true,
	},
};

module.exports = withSvgr(nextConfig);
