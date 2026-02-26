/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript strict
  },

  // Don't use standalone on Vercel - it handles this automatically
  // output: 'standalone',

  // Turbopack configuration - explicit root to prevent incorrect workspace detection
  turbopack: {
    root: __dirname,
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

  reactCompiler: true,
  serverExternalPackages: ['pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/published-rosters': ['./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
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
      'date-fns',
      'recharts',
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

  // Redirects — old URLs → consolidated pages
  async redirects() {
    return [
      // Certifications: Expiring Certs merged into Certifications (Attention Required tab)
      {
        source: '/dashboard/certifications/expiring',
        destination: '/dashboard/certifications?tab=attention',
        permanent: true,
      },
      // Requests: Leave pages merged into Requests
      {
        source: '/dashboard/leave/approve',
        destination: '/dashboard/requests?tab=leave',
        permanent: true,
      },
      {
        source: '/dashboard/leave/calendar',
        destination: '/dashboard/requests?tab=leave&view=calendar',
        permanent: true,
      },
      {
        source: '/dashboard/leave',
        destination: '/dashboard/requests?tab=leave',
        permanent: true,
      },
      // Leave bids: dedicated page at /dashboard/admin/leave-bids (no redirect)
      // System Admin: Sub-pages have dedicated pages (no redirect needed)
      // Legacy FAQs redirect to Help Center
      {
        source: '/dashboard/faqs',
        destination: '/dashboard/help',
        permanent: true,
      },
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
