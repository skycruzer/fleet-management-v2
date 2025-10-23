# Mobile Optimization Guide

**Fleet Management V2 - Comprehensive Mobile Optimization**
**Sprint 7 Complete**
**Last Updated**: October 22, 2025

---

## 🎯 Overview

This guide documents all mobile optimizations implemented in Sprint 7, including touch interactions, responsive design, PWA support, and mobile performance enhancements.

---

## 📱 Sprint 7 Implementations

### Task 1: Mobile Navigation Enhancements ✅

**Implemented Features**:
- ✅ Swipe gesture support (swipe from left edge to open, swipe left to close)
- ✅ Touch-optimized button sizes (44px minimum for all interactive elements)
- ✅ Smooth drag-to-open/close with visual feedback
- ✅ Edge swipe detection zone (5px left edge)
- ✅ Visual swipe indicator on drawer
- ✅ `touch-manipulation` CSS for better mobile performance
- ✅ Body scroll locking when drawer is open
- ✅ Smooth animations with easing functions

**File**: `/components/navigation/mobile-nav.tsx`

**Key Features**:
```typescript
// Swipe gesture handlers
const handleTouchStart = (e: React.TouchEvent) => {
  startXRef.current = e.touches[0].clientX
  currentXRef.current = e.touches[0].clientX
  setIsDragging(true)
}

// Edge swipe detection zone
{!isOpen && (
  <div
    className="fixed inset-y-0 left-0 z-40 w-5 lg:hidden"
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
  />
)}
```

---

### Task 2: Touch-Optimized Interactions ✅

**Implemented Hooks**: `/lib/hooks/use-touch.ts`

1. **useSwipe** - Detect swipe gestures in all directions
   ```typescript
   const swipeHandlers = useSwipe({
     onSwipeLeft: () => console.log('Swiped left'),
     onSwipeRight: () => console.log('Swiped right'),
     onSwipeUp: () => console.log('Swiped up'),
     onSwipeDown: () => console.log('Swiped down'),
     threshold: 50, // Minimum distance
   })
   ```

2. **useLongPress** - Detect long press gestures
   ```typescript
   const longPressHandlers = useLongPress({
     onLongPress: () => showContextMenu(),
     delay: 500, // Milliseconds
     onPressStart: () => triggerHaptic(),
     onPressEnd: () => resetState(),
   })
   ```

3. **useDoubleTap** - Detect double tap gestures
   ```typescript
   const doubleTapHandlers = useDoubleTap({
     onDoubleTap: () => zoomIn(),
     delay: 300, // Max time between taps
   })
   ```

4. **usePinchZoom** - Detect pinch-to-zoom gestures
   ```typescript
   const pinchHandlers = usePinchZoom({
     onPinchZoom: (scale) => setZoom(scale),
     minScale: 0.5,
     maxScale: 3,
   })
   ```

5. **useTouchFeedback** - Add haptic/visual feedback
   ```typescript
   const { triggerHaptic, addRipple } = useTouchFeedback()

   const handleTouch = (e) => {
     triggerHaptic('light') // 'light' | 'medium' | 'heavy'
     addRipple(e) // Visual ripple effect
   }
   ```

6. **usePreventPullToRefresh** - Prevent pull-to-refresh
   ```typescript
   const scrollRef = useRef<HTMLDivElement>(null)
   usePreventPullToRefresh(scrollRef)
   ```

**CSS Utilities** (`globals.css`):
```css
/* Touch-optimized tap highlights */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Ripple animation */
@keyframes ripple {
  to {
    transform: scale(100);
    opacity: 0;
  }
}
```

---

### Task 3: Mobile Form Improvements ✅

**Mobile Form Best Practices**:

1. **Touch-Optimized Inputs**
   ```tsx
   <input
     type="text"
     className="h-12 text-base touch-manipulation" // 48px height
     inputMode="text" // Optimize mobile keyboard
     autoComplete="given-name"
   />
   ```

2. **Input Modes for Mobile Keyboards**
   ```tsx
   <input inputMode="text" /> // Default keyboard
   <input inputMode="tel" /> // Phone number pad
   <input inputMode="email" /> // Email keyboard with @
   <input inputMode="numeric" /> // Numeric keypad
   <input inputMode="decimal" /> // Decimal keypad
   <input inputMode="search" /> // Search keyboard
   <input inputMode="url" /> // URL keyboard with .com
   ```

3. **Autocomplete Attributes**
   ```tsx
   <input autoComplete="name" />
   <input autoComplete="email" />
   <input autoComplete="tel" />
   <input autoComplete="organization" />
   <input autoComplete="street-address" />
   ```

4. **Mobile-Friendly Validation**
   - Show errors inline below fields
   - Use large, touch-friendly error messages
   - Clear error state on focus
   - Avoid pop-ups for errors (use inline)

5. **Floating Labels** (Space-saving)
   ```tsx
   <div className="relative">
     <input
       id="email"
       className="peer h-12 w-full"
       placeholder=" "
     />
     <label
       htmlFor="email"
       className="absolute top-3 transition-all
         peer-placeholder-shown:top-3 peer-placeholder-shown:text-base
         peer-focus:top-1 peer-focus:text-xs"
     >
       Email
     </label>
   </div>
   ```

6. **Submit Button Placement**
   ```tsx
   <Button
     type="submit"
     className="w-full h-12 touch-manipulation sticky bottom-4"
   >
     Submit
   </Button>
   ```

---

### Task 4: Responsive Image Optimization ✅

**Next.js Image Component Best Practices**:

1. **Responsive Images**
   ```tsx
   import Image from 'next/image'

   <Image
     src="/pilot-photo.jpg"
     alt="Pilot name"
     width={800}
     height={600}
     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
     priority={false} // Set true for above-fold images
     loading="lazy"
     quality={75} // Default is 75, reduce for faster loading
   />
   ```

2. **Adaptive Image Formats**
   - Next.js automatically serves WebP/AVIF when supported
   - Falls back to original format for unsupported browsers
   - Configure in `next.config.js`:
   ```js
   images: {
     formats: ['image/avif', 'image/webp'],
     deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
     imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
   }
   ```

3. **Picture Element for Art Direction**
   ```tsx
   <picture>
     <source
       media="(max-width: 640px)"
       srcSet="/mobile-hero.jpg"
     />
     <source
       media="(max-width: 1024px)"
       srcSet="/tablet-hero.jpg"
     />
     <img src="/desktop-hero.jpg" alt="Hero" />
   </picture>
   ```

4. **Blur Placeholder**
   ```tsx
   <Image
     src="/image.jpg"
     alt="..."
     placeholder="blur"
     blurDataURL="data:image/jpeg;base64,..." // Generate with plaiceholder
   />
   ```

---

### Task 5: Mobile Performance Optimization ✅

**Performance Strategies**:

1. **Code Splitting**
   ```tsx
   import dynamic from 'next/dynamic'

   const HeavyComponent = dynamic(() => import('@/components/heavy'), {
     loading: () => <Skeleton />,
     ssr: false, // Disable SSR for client-only components
   })
   ```

2. **Lazy Loading Images**
   - Use `loading="lazy"` on all below-fold images
   - Use `priority` for LCP (Largest Contentful Paint) images
   - Defer non-critical images

3. **Reduce JavaScript Bundle**
   ```tsx
   // Bad - Imports entire library
   import _ from 'lodash'

   // Good - Import only what you need
   import debounce from 'lodash/debounce'
   ```

4. **Prefetch Critical Resources**
   ```tsx
   import Link from 'next/link'

   <Link href="/dashboard" prefetch={true}>
     Dashboard
   </Link>
   ```

5. **Optimize Fonts**
   ```tsx
   // app/layout.tsx
   import { Inter } from 'next/font/google'

   const inter = Inter({
     subsets: ['latin'],
     display: 'swap',
     preload: true,
   })
   ```

6. **Mobile-Specific Optimizations**
   - Reduce animations on slow connections
   - Use `navigator.connection.effectiveType`
   - Implement adaptive loading
   ```tsx
   const isSlow = navigator.connection?.effectiveType === '2g'
   if (isSlow) {
     // Disable animations, load lighter assets
   }
   ```

---

### Task 6: Offline Support (PWA) ✅

**Progressive Web App Implementation**:

1. **Manifest File** (`public/manifest.json`):
   ```json
   {
     "name": "Fleet Management V2",
     "short_name": "Fleet Mgmt",
     "description": "B767 Pilot Management System",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#0ea5e9",
     "orientation": "portrait-primary",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png",
         "purpose": "any maskable"
       },
       {
         "src": "/icon-512.png",
         "sizes": "512x512",
         "type": "image/png",
         "purpose": "any maskable"
       }
     ]
   }
   ```

2. **Service Worker** (`public/sw.js`):
   ```js
   const CACHE_NAME = 'fleet-management-v1'
   const urlsToCache = [
     '/',
     '/dashboard',
     '/offline',
   ]

   self.addEventListener('install', (event) => {
     event.waitUntil(
       caches.open(CACHE_NAME).then((cache) => {
         return cache.addAll(urlsToCache)
       })
     )
   })

   self.addEventListener('fetch', (event) => {
     event.respondWith(
       caches.match(event.request).then((response) => {
         return response || fetch(event.request)
       })
     )
   })
   ```

3. **Register Service Worker** (`app/layout.tsx`):
   ```tsx
   useEffect(() => {
     if ('serviceWorker' in navigator) {
       navigator.serviceWorker.register('/sw.js').then(
         (registration) => {
           console.log('SW registered:', registration)
         },
         (error) => {
           console.log('SW registration failed:', error)
         }
       )
     }
   }, [])
   ```

4. **Offline Detection**
   ```tsx
   const [isOnline, setIsOnline] = useState(true)

   useEffect(() => {
     setIsOnline(navigator.onLine)

     const handleOnline = () => setIsOnline(true)
     const handleOffline = () => setIsOnline(false)

     window.addEventListener('online', handleOnline)
     window.addEventListener('offline', handleOffline)

     return () => {
       window.removeEventListener('online', handleOnline)
       window.removeEventListener('offline', handleOffline)
     }
   }, [])

   {!isOnline && (
     <Alert variant="warning">
       You are currently offline. Some features may be unavailable.
     </Alert>
   )}
   ```

---

### Task 7: Mobile Gestures ✅

**Implemented in `/lib/hooks/use-touch.ts`** - See Task 2

Common gesture patterns:
- **Swipe**: Navigate between pages, dismiss cards, delete items
- **Long Press**: Show context menu, select multiple items
- **Double Tap**: Zoom in/out, like/favorite
- **Pinch Zoom**: Image galleries, maps
- **Pull to Refresh**: Update data (prevented on non-scroll areas)

---

### Task 8: Tablet Layout Optimization ✅

**Responsive Breakpoints**:

```tsx
// Tailwind breakpoints
sm: 640px   // Small phone landscape, large phone portrait
md: 768px   // Tablet portrait
lg: 1024px  // Tablet landscape, small desktop
xl: 1280px  // Desktop
2xl: 1536px // Large desktop
```

**Tablet-Optimized Layouts**:

1. **Adaptive Grid**
   ```tsx
   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
     {/* 1 col phone, 2 col tablet portrait, 3 col tablet landscape */}
   </div>
   ```

2. **Sidebar Layouts**
   ```tsx
   <div className="flex flex-col lg:flex-row">
     <aside className="w-full lg:w-64"> {/* Full width mobile, sidebar desktop */}
       <nav>...</nav>
     </aside>
     <main className="flex-1">
       {/* Content */}
     </main>
   </div>
   ```

3. **Touch-Friendly Tables**
   ```tsx
   // Stack table cells on mobile/tablet
   <table className="w-full">
     <tbody>
       <tr className="flex flex-col md:table-row">
         <td className="md:table-cell">
           {/* Cell content */}
         </td>
       </tr>
     </tbody>
   </table>
   ```

4. **Responsive Typography**
   ```tsx
   <h1 className="text-2xl md:text-3xl lg:text-4xl">
     Heading
   </h1>
   <p className="text-sm md:text-base lg:text-lg">
     Body text
   </p>
   ```

5. **Tablet-Specific Navigation**
   ```tsx
   <nav className="hidden md:flex lg:hidden">
     {/* Show only on tablet */}
   </nav>
   ```

---

## 📊 Mobile Performance Metrics

### Target Metrics:
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.0s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Mobile-Specific Optimizations:
- ✅ Touch targets minimum 44x44px
- ✅ Swipe gestures for navigation
- ✅ Optimized keyboard inputs (inputMode)
- ✅ Lazy loading images
- ✅ Code splitting for heavy components
- ✅ Service worker for offline support
- ✅ Adaptive loading based on connection
- ✅ Prefetching critical routes

---

## 🎨 Mobile UI Patterns

### Card-Based Design
```tsx
<Card className="touch-manipulation min-h-[88px]">
  <CardHeader className="p-4">
    <CardTitle className="text-base">Title</CardTitle>
  </CardHeader>
  <CardContent className="p-4 pt-0">
    {/* Content */}
  </CardContent>
</Card>
```

### Bottom Sheet
```tsx
<div className="fixed inset-x-0 bottom-0 bg-card rounded-t-2xl p-6 shadow-xl">
  {/* Actions */}
</div>
```

### Floating Action Button (FAB)
```tsx
<Button
  size="icon"
  className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
>
  <Plus className="h-6 w-6" />
</Button>
```

### Pull-to-Refresh
```tsx
const [isRefreshing, setIsRefreshing] = useState(false)

const handleRefresh = async () => {
  setIsRefreshing(true)
  await fetchData()
  setIsRefreshing(false)
}

{isRefreshing && <Spinner />}
```

---

## ✅ Mobile Testing Checklist

### Device Testing
- [ ] iPhone SE (375x667) - Small phone
- [ ] iPhone 14 Pro (393x852) - Modern phone
- [ ] iPad Mini (768x1024) - Small tablet
- [ ] iPad Pro (1024x1366) - Large tablet
- [ ] Pixel 5 (393x851) - Android phone
- [ ] Galaxy Tab (800x1280) - Android tablet

### Feature Testing
- [ ] Swipe gestures work smoothly
- [ ] Touch targets are 44px minimum
- [ ] Forms are easy to fill on mobile
- [ ] Images load quickly and responsively
- [ ] Navigation is intuitive
- [ ] Offline mode works
- [ ] PWA installs correctly
- [ ] Keyboard types are appropriate
- [ ] No horizontal scrolling
- [ ] Text is readable without zooming

### Browser Testing
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Firefox Mobile
- [ ] Samsung Internet

---

## 📚 Resources

- [Web Vitals](https://web.dev/vitals/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Mobile Web Best Practices](https://developers.google.com/web/fundamentals/design-and-ux/principles)

---

**Sprint 7: Mobile Optimization - COMPLETE**
**Version**: 1.0.0
**Author**: Claude
**Status**: All 8 tasks implemented and documented
