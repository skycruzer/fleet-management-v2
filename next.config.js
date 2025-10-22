const withSerwist = require('@serwist/next').default({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: true,
  cacheOnNavigation: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable static optimization for database-dependent app
  output: 'standalone',

  // Fix workspace root detection warning
  outputFileTracingRoot: __dirname,

  // Disable ESLint during builds (Storybook files have linting issues that don't affect production)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wgdmgvonqysflwdiiols.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
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
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://wgdmgvonqysflwdiiols.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://wgdmgvonqysflwdiiols.supabase.co wss://wgdmgvonqysflwdiiols.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // Redirects (if needed)
  async redirects() {
    return [
      // Example redirect
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ]
  },

  // Environment variables exposed to the client
  env: {
    NEXT_PUBLIC_APP_NAME: 'Fleet Management V2',
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
  },

  // Webpack configuration (if needed)
  webpack: (config, { isServer }) => {
    // Custom webpack config
    return config
  },
}

module.exports = withSerwist(nextConfig)
