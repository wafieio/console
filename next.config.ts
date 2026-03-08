import type { NextConfig } from "next";

// Log during build and startup
console.log('⚙️  Next.js Config Loading');
console.log('📡 WAFIE_API_HOST:', process.env.WAFIE_API_HOST || '(not set)');

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
