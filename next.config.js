/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-side environment variables don't need to be explicitly set here
  // They will be automatically available in API routes
  
  experimental: {
    // Enable server actions if needed
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001']
    },
  },
  
  // Proper handling of images and static assets
  images: {
    domains: ['figma.com', 'www.figma.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Webpack config to handle hydration issues
  webpack: (config, { isServer }) => {
    // Handle browser extension attributes to prevent hydration errors
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Ensure common chunks are properly handled
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 10,
          },
        },
      };
    }
    
    return config;
  },
  
  // Any client-side environment variables would go here
  // env: {
  //   NEXT_PUBLIC_VARIABLE: process.env.NEXT_PUBLIC_VARIABLE,
  // },
  
  // Ensure static assets are properly handled
  reactStrictMode: true,
}

module.exports = nextConfig 