/** @type {import('next').NextConfig} */
const nextConfig = {
  // Development optimizations - prevent caching issues
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      // Period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // Number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
    // Disable static optimization in development for Hot Module Replacement
    experimental: {
      instrumentationHook: true,
      optimizePackageImports: ['lucide-react', '@prisma/client'],
      optimizeCss: true,
      scrollRestoration: true,
    }
  }),

  // Build optimization
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Performance optimizations
  compress: true, // Enable gzip/brotli compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  swcMinify: true, // Use SWC minifier for faster builds
  output: 'standalone', // Enable standalone output for Docker
  outputFileTracing: true, // Required for standalone builds

  // Disable verbose logging in production
  ...(process.env.LOG_LEVEL === 'ERROR' && {
    logging: {
      fetches: {
        fullUrl: false,
      }
    },
    experimental: {
      logging: 'verbose'
    }
  }),

  // Security and performance headers for production
  ...(process.env.NODE_ENV === 'production' && {
    async headers() {
      return [
        {
          // Cache static assets aggressively in production
          source: '/_next/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        // Add security headers
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
            },
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' ws: wss: https:; frame-src 'none';",
            },
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains',
            },
          ],
        },
      ];
    }
  }),

  // Image optimization
  images: {
    unoptimized: false, // Enable Next.js image optimization
    formats: ['image/webp', 'image/avif'], // Modern image formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox; img-src 'self' data: https:;",
    minimumCacheTTL: process.env.NODE_ENV === 'production' ? 31536000 : 0, // No cache in dev
  },

  // Compiler options for production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },

  // Simplified webpack optimizations
  webpack: (config, { dev }) => {
    if (dev) {
      // Development-specific webpack configs
      // Removed manual cache disabling to improve performance
    }

    return config;
  },
};

export default nextConfig;
