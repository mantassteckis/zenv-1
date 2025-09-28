/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
