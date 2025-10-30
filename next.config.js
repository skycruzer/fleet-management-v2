/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript strict
  },

  // Don't use standalone on Vercel - it handles this automatically
  // output: 'standalone',

  // Turbopack configuration (required in Next.js 16 when using webpack)
  turbopack: {},

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

  // Force Webpack (Turbopack has path alias resolution issues in Vercel)
  webpack: (config) => {
    // Ensure path aliases work correctly
    return config
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
    ],
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

  // Turbopack disabled for production due to path alias resolution issues
  // Use Webpack for stable, production-ready builds
  // Dev mode can still use --turbopack flag if desired
}

module.exports = nextConfig
