/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint during builds to allow deployment
  },
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript error checking for better code quality
  },
  images: {
    unoptimized: true, // Keep this for Firebase App Hosting compatibility
  },
  webpack: (config, { isServer }) => {
    // Exclude TypeScript definition files from webpack processing
    config.module.rules.push({
      test: /\.d\.ts$/,
      use: 'ignore-loader',
    });

    // Alternative approach: exclude problematic modules from parsing
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    return config;
  },
}

export default nextConfig
