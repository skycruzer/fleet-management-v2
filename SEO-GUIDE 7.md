# SEO Implementation Guide

**Fleet Management V2 - Comprehensive SEO Metadata**
**Last Updated**: October 22, 2025

---

## 🎯 Overview

This guide documents the comprehensive SEO metadata implementation across all pages in the Fleet Management application. All metadata is centralized in `/lib/utils/metadata.ts` for consistency and maintainability.

---

## 📋 Metadata Structure

### Standard Metadata Fields

Every page includes:

- **Title**: Page-specific title + site name
- **Description**: Detailed page description (150-160 characters)
- **Keywords**: Relevant search terms (optional, 5-10 keywords)
- **Canonical URL**: Absolute URL for this page
- **Open Graph**: Social media sharing metadata
- **Twitter Card**: Twitter-specific metadata
- **Robots**: Search engine crawling instructions
- **Authors/Creator/Publisher**: Content attribution

### Example Metadata Output

```typescript
{
  title: "Dashboard | Fleet Management V2",
  description: "Fleet overview and key metrics for B767 pilot management...",
  keywords: ["dashboard", "fleet management", "pilot management"],

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fleet-management.example.com/dashboard",
    title: "Dashboard | Fleet Management V2",
    description: "Fleet overview and key metrics...",
    siteName: "Fleet Management V2",
    images: [{
      url: "https://fleet-management.example.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "Dashboard"
    }]
  },

  twitter: {
    card: "summary_large_image",
    title: "Dashboard | Fleet Management V2",
    description: "Fleet overview and key metrics...",
    images: ["https://fleet-management.example.com/og-image.png"]
  },

  alternates: {
    canonical: "https://fleet-management.example.com/dashboard"
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
}
```

---

## 🛠️ Usage

### Server Component Pages (Recommended)

For server components, export metadata directly:

```typescript
// app/dashboard/page.tsx
import { dashboardMetadata } from '@/lib/utils/metadata'

export const metadata = dashboardMetadata.home

export default async function DashboardPage() {
  // Page component
}
```

### Client Component Pages

Client components cannot export metadata directly. Add metadata to the nearest layout file:

```typescript
// app/dashboard/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Fleet Management V2',
    default: 'Dashboard | Fleet Management V2',
  },
  description: 'Fleet management dashboard'
}
```

### Dynamic Pages

For dynamic routes, use `generateMetadata`:

```typescript
// app/dashboard/pilots/[id]/page.tsx
import { generateMetadata as generateMeta } from 'next'
import { dashboardMetadata } from '@/lib/utils/metadata'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const pilot = await getPilot(params.id)
  return dashboardMetadata.pilotDetail(pilot.name)
}
```

---

## 📚 Available Metadata Sets

### Dashboard Pages

**Location**: `dashboardMetadata` in `/lib/utils/metadata.ts`

| Route | Key | Indexed |
|-------|-----|---------|
| `/dashboard` | `home` | ✅ Yes |
| `/dashboard/pilots` | `pilots` | ✅ Yes |
| `/dashboard/pilots/[id]` | `pilotDetail(name)` | ❌ No (privacy) |
| `/dashboard/pilots/new` | `pilotNew` | ❌ No |
| `/dashboard/certifications` | `certifications` | ✅ Yes |
| `/dashboard/certifications/new` | `certificationNew` | ❌ No |
| `/dashboard/leave` | `leave` | ✅ Yes |
| `/dashboard/leave/new` | `leaveNew` | ❌ No |
| `/dashboard/analytics` | `analytics` | ✅ Yes |
| `/dashboard/admin` | `admin` | ❌ No |
| `/dashboard/admin/users` | `adminUsers` | ❌ No |
| `/dashboard/admin/check-types` | `adminCheckTypes` | ❌ No |
| `/dashboard/admin/settings` | `adminSettings` | ❌ No |

### Pilot Portal Pages

**Location**: `portalMetadata` in `/lib/utils/metadata.ts`

| Route | Key | Indexed |
|-------|-----|---------|
| `/portal` | `home` | ✅ Yes |
| `/portal/dashboard` | `dashboard` | ❌ No (personal) |
| `/portal/certifications` | `certifications` | ❌ No (personal) |
| `/portal/leave` | `leave` | ❌ No (personal) |
| `/portal/leave/new` | `leaveNew` | ❌ No |
| `/portal/flights` | `flights` | ❌ No (personal) |
| `/portal/flights/new` | `flightsNew` | ❌ No |
| `/portal/feedback/new` | `feedback` | ❌ No |

### Authentication Pages

**Location**: `authMetadata` in `/lib/utils/metadata.ts`

| Route | Key | Indexed |
|-------|-----|---------|
| `/auth/login` | `login` | ❌ No |

### Public Pages

**Location**: `publicMetadata` in `/lib/utils/metadata.ts`

| Route | Key | Indexed |
|-------|-----|---------|
| `/` | `home` | ✅ Yes |

---

## 🔍 SEO Best Practices Implemented

### 1. Title Optimization

**Format**: `[Page Title] | Fleet Management V2`

**Guidelines**:
- Keep under 60 characters
- Front-load important keywords
- Include brand name at the end
- Unique for every page

**Examples**:
```
✅ Dashboard | Fleet Management V2
✅ Pilot Management | Fleet Management V2
✅ Certifications Tracking | Fleet Management V2
```

### 2. Description Optimization

**Guidelines**:
- 150-160 characters (optimal)
- Include primary keywords naturally
- Clear value proposition
- Call-to-action when appropriate

**Examples**:
```
✅ "Fleet overview and key metrics for B767 pilot management - real-time compliance monitoring, expiring certifications, and fleet statistics."

✅ "Track and manage pilot certifications - monitor expiry dates, compliance status, and certification history across the entire fleet."
```

### 3. Keywords Strategy

**Primary Keywords**:
- fleet management
- pilot management
- aviation software
- certification tracking
- compliance monitoring

**Secondary Keywords**:
- pilot database
- leave management
- FAA compliance
- crew management
- aviation operations

**Long-tail Keywords**:
- B767 pilot management system
- pilot certification expiry tracking
- aviation compliance software
- fleet operations management

### 4. Robots Configuration

**Public Pages** (index: true):
- Homepage
- Dashboard landing
- Pilots list
- Certifications list
- Leave management
- Analytics

**Private Pages** (index: false):
- Individual pilot details
- Personal dashboards
- Forms (new/edit)
- Admin pages
- Portal personal pages

### 5. Open Graph & Social Sharing

**Image Requirements**:
- Size: 1200x630px (recommended)
- Format: PNG or JPEG
- Location: `/public/og-image.png`
- Fallback: Default site image

**Card Types**:
- Twitter: `summary_large_image`
- Facebook/LinkedIn: Automatic via Open Graph

---

## 📊 Metadata Coverage

### Pages with Full Metadata

**✅ Implemented (16 pages)**:
1. `/` - Home
2. `/dashboard` - Dashboard
3. `/dashboard/leave` - Leave Management
4. `/dashboard/admin` - Admin
5. `/dashboard/admin/check-types` - Check Types
6. `/dashboard/admin/settings` - Settings
7. `/portal` - Portal Home
8. `/portal/dashboard` - Pilot Dashboard
9. `/portal/certifications` - My Certifications
10. `/portal/leave` - My Leave
11. `/portal/leave/new` - Submit Leave
12. `/portal/flights` - Flight Requests
13. `/portal/flights/new` - Submit Flight Request
14. `/portal/feedback/new` - Feedback

**⚠️ Client Components (Metadata in Layout)**:
- `/dashboard/pilots` - Client component
- `/dashboard/certifications` - Client component
- `/dashboard/analytics` - Client component
- `/auth/login` - Client component

**📝 Dynamic Routes (Use generateMetadata)**:
- `/dashboard/pilots/[id]` - Individual pilot pages
- `/dashboard/pilots/[id]/edit` - Pilot edit pages
- `/dashboard/certifications/[id]/edit` - Certification edit pages
- `/dashboard/admin/users/new` - New user page
- `/dashboard/pilots/new` - New pilot page
- `/dashboard/certifications/new` - New certification page

---

## 🎨 Custom Metadata

### Creating Custom Metadata

```typescript
import { generateMetadata } from '@/lib/utils/metadata'

export const customMetadata = generateMetadata({
  title: 'Custom Page',
  description: 'Custom page description',
  keywords: ['custom', 'keywords'],
  path: '/custom-path',
  image: '/custom-og-image.png',
  noIndex: false // or true to prevent indexing
})
```

### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `title` | string | ✅ Yes | Page title (without site name) |
| `description` | string | ✅ Yes | Page description (150-160 chars) |
| `keywords` | string[] | ❌ No | SEO keywords (5-10 recommended) |
| `path` | string | ❌ No | URL path (default: empty) |
| `image` | string | ❌ No | OG image URL (default: site default) |
| `noIndex` | boolean | ❌ No | Prevent search indexing (default: false) |

---

## 🔧 Configuration

### Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://fleet-management.example.com
```

**Production**: Update to your actual domain
**Development**: Use `http://localhost:3000`

### Site Configuration

Edit `/lib/utils/metadata.ts`:

```typescript
const SITE_NAME = 'Fleet Management V2'
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fleet-management.example.com'
const DEFAULT_DESCRIPTION = 'Modern fleet management system...'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`
```

---

## 🖼️ Open Graph Images

### Create OG Images

**Recommended Tool**: [Canva](https://canva.com) or [OG Image Generator](https://og-image.vercel.app/)

**Template**:
- Dimensions: 1200x630px
- Format: PNG or JPEG
- Size: < 1MB
- Background: Brand colors
- Text: Page title + brand
- Logo: Top left or center

**Save Location**: `/public/og-image.png`

**Page-Specific Images** (optional):
- `/public/og/dashboard.png`
- `/public/og/pilots.png`
- `/public/og/certifications.png`

---

## 📈 SEO Checklist

### Page-Level Checklist

- [ ] Unique, descriptive title (< 60 chars)
- [ ] Compelling description (150-160 chars)
- [ ] Relevant keywords (5-10 keywords)
- [ ] Canonical URL set
- [ ] Open Graph metadata
- [ ] Twitter Card metadata
- [ ] Robots configuration (index/noindex)
- [ ] OG image exists and loads

### Site-Level Checklist

- [ ] All metadata centralized in one file
- [ ] Consistent title format
- [ ] Appropriate pages marked noindex
- [ ] Valid OG images (1200x630px)
- [ ] Environment variables configured
- [ ] Sitemap generated (future)
- [ ] Robots.txt configured (future)

---

## 🚀 Future Enhancements

### Planned Improvements

1. **Dynamic Sitemap**
   - Auto-generate sitemap.xml
   - Include all indexable pages
   - Update on content changes

2. **Structured Data**
   - JSON-LD for organization
   - BreadcrumbList schema
   - Person schema for pilots (public pages only)

3. **Multilingual Support**
   - Alternate language tags
   - hreflang attributes
   - Language-specific metadata

4. **Performance**
   - Lazy-load OG images
   - Optimize image sizes
   - CDN for static assets

---

## 📝 Examples

### Adding Metadata to New Page

1. **Add metadata definition**:

```typescript
// lib/utils/metadata.ts
export const dashboardMetadata = {
  // ... existing metadata

  newFeature: generateMetadata({
    title: 'New Feature',
    description: 'Detailed description of the new feature.',
    keywords: ['new', 'feature', 'keywords'],
    path: '/dashboard/new-feature',
  }),
}
```

2. **Use in page component**:

```typescript
// app/dashboard/new-feature/page.tsx
import { dashboardMetadata } from '@/lib/utils/metadata'

export const metadata = dashboardMetadata.newFeature

export default function NewFeaturePage() {
  return <div>New Feature Content</div>
}
```

3. **Verify**:
   - View page source (Cmd+U / Ctrl+U)
   - Check `<head>` for metadata tags
   - Test social sharing preview

---

## 🔍 Testing SEO

### Tools

1. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
4. **Google Rich Results Test**: https://search.google.com/test/rich-results
5. **Lighthouse SEO Audit**: Chrome DevTools > Lighthouse

### Manual Checks

```bash
# View page metadata
curl https://fleet-management.example.com/dashboard | grep "<meta"

# Check robots.txt
curl https://fleet-management.example.com/robots.txt

# Check sitemap
curl https://fleet-management.example.com/sitemap.xml
```

---

## 📚 Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org/)

---

**Version**: 1.0.0
**Author**: Claude (Sprint 6: Final Polish)
**Status**: Active - All server component pages have full SEO metadata
