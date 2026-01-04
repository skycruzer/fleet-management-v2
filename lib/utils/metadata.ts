/**
 * SEO Metadata Utilities
 * Centralized metadata generation for consistent SEO across all pages
 */

import type { Metadata } from 'next'

export interface PageMetadata {
  title: string
  description: string
  keywords?: string[]
  path?: string
  image?: string
  noIndex?: boolean
}

const SITE_NAME = 'Fleet Management V2'
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fleet-management.example.com'
const DEFAULT_DESCRIPTION =
  'Modern fleet management system for aviation operations - comprehensive pilot certification tracking, leave management, and compliance monitoring.'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

/**
 * Generate comprehensive metadata for a page
 */
export function generateMetadata({
  title,
  description,
  keywords = [],
  path = '',
  image = DEFAULT_IMAGE,
  noIndex = false,
}: PageMetadata): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`
  const url = `${SITE_URL}${path}`

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,

    // Open Graph
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      title: fullTitle,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@fleetmanagement',
    },

    // Canonical URL
    alternates: {
      canonical: url,
    },

    // Robots
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },

    // Additional metadata
    authors: [{ name: 'Fleet Management Team' }],
    creator: 'Fleet Management Team',
    publisher: 'Fleet Management V2',

    // Format detection
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
  }

  return metadata
}

/**
 * Dashboard Pages Metadata
 */
export const dashboardMetadata = {
  home: generateMetadata({
    title: 'Dashboard',
    description:
      'Fleet overview and key metrics for B767 pilot management - real-time compliance monitoring, expiring certifications, and fleet statistics.',
    keywords: ['dashboard', 'fleet management', 'pilot management', 'aviation', 'compliance'],
    path: '/dashboard',
  }),

  pilots: generateMetadata({
    title: 'Pilots',
    description:
      'Manage pilot profiles, certifications, and qualifications - comprehensive pilot database with seniority tracking and compliance monitoring.',
    keywords: ['pilots', 'crew management', 'pilot database', 'aviation personnel'],
    path: '/dashboard/pilots',
  }),

  pilotDetail: (name: string) =>
    generateMetadata({
      title: `${name} - Pilot Details`,
      description: `View complete profile, certifications, and qualifications for ${name} - track compliance, expiry dates, and pilot history.`,
      keywords: ['pilot profile', 'certifications', 'qualifications', 'compliance'],
      path: '/dashboard/pilots',
      noIndex: true, // Prevent indexing of individual pilot pages (privacy)
    }),

  pilotNew: generateMetadata({
    title: 'Add New Pilot',
    description:
      'Add a new pilot to the fleet management system - create pilot profile with certifications and qualifications.',
    keywords: ['add pilot', 'new pilot', 'pilot onboarding'],
    path: '/dashboard/pilots/new',
    noIndex: true,
  }),

  certifications: generateMetadata({
    title: 'Certifications',
    description:
      'Track and manage pilot certifications - monitor expiry dates, compliance status, and certification history across the entire fleet.',
    keywords: ['certifications', 'pilot checks', 'compliance', 'expiry tracking', 'FAA standards'],
    path: '/dashboard/certifications',
  }),

  certificationNew: generateMetadata({
    title: 'Add New Certification',
    description:
      'Add a new pilot certification record - track check types, expiry dates, and compliance status.',
    keywords: ['add certification', 'new check', 'pilot certification'],
    path: '/dashboard/certifications/new',
    noIndex: true,
  }),

  leave: generateMetadata({
    title: 'Leave Management',
    description:
      'Manage pilot leave requests - track annual leave, sick leave, and other leave types with roster period integration.',
    keywords: ['leave management', 'leave requests', 'roster periods', 'pilot scheduling'],
    path: '/dashboard/leave',
  }),

  leaveNew: generateMetadata({
    title: 'Submit Leave Request',
    description:
      'Submit a new leave request - check availability, roster periods, and leave eligibility.',
    keywords: ['leave request', 'submit leave', 'roster periods'],
    path: '/dashboard/leave/new',
    noIndex: true,
  }),

  analytics: generateMetadata({
    title: 'Analytics',
    description:
      'Fleet analytics and insights - compliance statistics, expiry trends, pilot demographics, and operational metrics.',
    keywords: ['analytics', 'fleet statistics', 'compliance metrics', 'data visualization'],
    path: '/dashboard/analytics',
  }),

  admin: generateMetadata({
    title: 'Admin',
    description: 'System administration - manage users, check types, and system settings.',
    keywords: ['admin', 'system settings', 'user management', 'configuration'],
    path: '/dashboard/admin',
    noIndex: true,
  }),

  adminUsers: generateMetadata({
    title: 'User Management',
    description:
      'Manage system users and permissions - create users, assign roles, and control access.',
    keywords: ['user management', 'permissions', 'roles', 'access control'],
    path: '/dashboard/admin/users',
    noIndex: true,
  }),

  adminCheckTypes: generateMetadata({
    title: 'Check Types',
    description:
      'Manage certification check types - configure check codes, categories, and descriptions.',
    keywords: ['check types', 'certification types', 'check configuration'],
    path: '/dashboard/admin/check-types',
    noIndex: true,
  }),

  adminSettings: generateMetadata({
    title: 'System Settings',
    description: 'Configure system settings and preferences.',
    keywords: ['system settings', 'configuration', 'preferences'],
    path: '/dashboard/admin/settings',
    noIndex: true,
  }),
}

/**
 * Pilot Portal Pages Metadata
 */
export const portalMetadata = {
  home: generateMetadata({
    title: 'Pilot Portal',
    description:
      'Pilot self-service portal - view your certifications, submit leave requests, and manage flight requests.',
    keywords: ['pilot portal', 'self service', 'pilot dashboard', 'crew portal'],
    path: '/portal',
  }),

  dashboard: generateMetadata({
    title: 'My Dashboard',
    description: 'Pilot dashboard - view your certifications, leave balance, and upcoming checks.',
    keywords: ['pilot dashboard', 'my certifications', 'personal dashboard'],
    path: '/portal/dashboard',
    noIndex: true,
  }),

  certifications: generateMetadata({
    title: 'My Certifications',
    description:
      'View your certifications and expiry dates - track your compliance status and upcoming checks.',
    keywords: ['my certifications', 'pilot checks', 'expiry dates'],
    path: '/portal/certifications',
    noIndex: true,
  }),

  leave: generateMetadata({
    title: 'My Leave',
    description:
      'Manage your leave requests - submit new requests, view leave history, and check leave balance.',
    keywords: ['my leave', 'leave requests', 'leave history'],
    path: '/portal/leave',
    noIndex: true,
  }),

  leaveNew: generateMetadata({
    title: 'Submit Leave Request',
    description: 'Submit a new leave request - check roster periods and leave eligibility.',
    keywords: ['submit leave', 'leave request', 'roster periods'],
    path: '/portal/leave/new',
    noIndex: true,
  }),

  flights: generateMetadata({
    title: 'Flight Requests',
    description:
      'Manage flight requests - submit requests for additional flights, route changes, or schedule preferences.',
    keywords: ['flight requests', 'pilot requests', 'schedule changes'],
    path: '/portal/flights',
    noIndex: true,
  }),

  flightsNew: generateMetadata({
    title: 'Submit Flight Request',
    description: 'Submit a new flight request - request additional flights or schedule changes.',
    keywords: ['flight request', 'schedule request', 'pilot request'],
    path: '/portal/flights/new',
    noIndex: true,
  }),

  feedback: generateMetadata({
    title: 'Feedback',
    description:
      'Provide feedback on the fleet management system - report issues or suggest improvements.',
    keywords: ['feedback', 'suggestions', 'support'],
    path: '/portal/feedback/new',
    noIndex: true,
  }),
}

/**
 * Auth Pages Metadata
 */
export const authMetadata = {
  login: generateMetadata({
    title: 'Login',
    description: 'Sign in to Fleet Management V2 - access your pilot portal or admin dashboard.',
    keywords: ['login', 'sign in', 'authentication'],
    path: '/auth/login',
    noIndex: true,
  }),
}

/**
 * Public Pages Metadata
 */
export const publicMetadata = {
  home: generateMetadata({
    title: 'Home',
    description: DEFAULT_DESCRIPTION,
    keywords: [
      'fleet management',
      'pilot management',
      'aviation software',
      'certification tracking',
      'compliance monitoring',
      'B767',
      'pilot database',
      'leave management',
      'FAA compliance',
      'crew management',
    ],
    path: '/',
  }),
}
