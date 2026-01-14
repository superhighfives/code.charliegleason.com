# Core Web Vitals Metrics Analysis

Deep dive into analyzing and optimizing Core Web Vitals metrics from Chrome DevTools performance traces.

## Understanding Performance Insights

When you run `chrome-devtools_performance_start_trace`, the results include:
- **Core Web Vitals scores** - Actual measurements for the page load
- **Available insight sets** - Categorized performance issues
- **Specific insights** - Detailed analysis of bottlenecks

Use `chrome-devtools_performance_analyze_insight` to get detailed information about specific insights.

---

## Largest Contentful Paint (LCP)

**What it measures:** Time until the largest content element (image, text block, video) is rendered.

**Target:** < 2.5s (Good), 2.5-4s (Needs Improvement), > 4s (Poor)

### Common LCP Issues

#### 1. Slow Server Response Time (TTFB)
**Symptoms:**
- LCP > 2.5s but most time is spent waiting for server
- Long "waiting" time in network waterfall

**Root causes:**
- Slow server-side rendering
- Database queries
- No CDN or edge caching
- Cold starts (serverless functions)

**Fixes:**
```javascript
// Use edge caching with appropriate headers
res.setHeader('Cache-Control', 'public, s-maxage=31536000, stale-while-revalidate')

// Implement static site generation (SSG) for content pages
// Next.js example:
export async function getStaticProps() {
  const data = await fetchData()
  return {
    props: { data },
    revalidate: 60 // ISR: regenerate every 60s
  }
}

// Use edge functions for dynamic content
// Cloudflare Workers, Vercel Edge Functions, etc.
```

**Check in DevTools:**
- Look at the first document request in Network panel
- Time to First Byte (TTFB) should be < 600ms

---

#### 2. Render-Blocking Resources
**Symptoms:**
- Large gap between FCP and LCP
- CSS/JavaScript blocking initial render
- "LCP element not found" or delayed LCP

**Root causes:**
- Synchronous CSS/JS in `<head>`
- Large CSS bundles
- No resource prioritization

**Fixes:**
```html
<!-- Preload critical resources -->
<link rel="preload" href="/critical.css" as="style">
<link rel="preload" href="/hero-image.jpg" as="image">

<!-- Async non-critical CSS -->
<link rel="preload" href="/non-critical.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/non-critical.css"></noscript>

<!-- Defer non-critical JavaScript -->
<script src="/analytics.js" defer></script>
<script src="/non-critical.js" async></script>
```

**Framework-specific:**
```javascript
// React (Next.js) - Use next/script with strategy
import Script from 'next/script'

<Script src="/analytics.js" strategy="lazyOnload" />

// Vue (Nuxt) - Configure in nuxt.config
export default {
  app: {
    head: {
      link: [
        { rel: 'preload', href: '/hero.jpg', as: 'image' }
      ]
    }
  }
}
```

---

#### 3. Large LCP Element (Image/Video)
**Symptoms:**
- LCP element is an image that loads slowly
- Large download time for LCP resource

**Root causes:**
- Unoptimized images (large file size)
- Wrong image format
- No responsive images
- Lazy loading applied to above-the-fold content

**Fixes:**
```html
<!-- Use modern formats with fallbacks -->
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" alt="Hero" 
       width="1200" height="800"
       fetchpriority="high">
</picture>

<!-- Responsive images -->
<img srcset="hero-400.jpg 400w,
             hero-800.jpg 800w,
             hero-1200.jpg 1200w"
     sizes="(max-width: 600px) 400px,
            (max-width: 1000px) 800px,
            1200px"
     src="hero-800.jpg"
     alt="Hero">

<!-- NEVER lazy load LCP images -->
<!-- ❌ Bad -->
<img src="hero.jpg" loading="lazy">

<!-- ✅ Good -->
<img src="hero.jpg" loading="eager" fetchpriority="high">
```

**Framework-specific:**
```javascript
// React (Next.js Image)
import Image from 'next/image'

<Image
  src="/hero.jpg"
  width={1200}
  height={800}
  priority // Don't lazy load LCP images
  alt="Hero"
/>

// Remix - use cloudflare-image-loader or similar
import { getImageProps } from 'remix-image'

// Astro - use Image component with priority
import { Image } from 'astro:assets'
<Image src={hero} alt="Hero" loading="eager" />
```

---

#### 4. Client-Side Rendering Delay
**Symptoms:**
- LCP occurs after significant JavaScript execution
- Large TBT (Total Blocking Time)
- Content appears late despite fast network

**Root causes:**
- Content rendered only by JavaScript (no SSR)
- Heavy initial JavaScript bundle
- React hydration delays

**Fixes:**
```javascript
// Switch to Server-Side Rendering (SSR)
// Next.js - use getServerSideProps
export async function getServerSideProps() {
  const data = await fetchData()
  return { props: { data } }
}

// Remix - use loader (server-side by default)
export const loader = async () => {
  const data = await fetchData()
  return json(data)
}

// Use streaming SSR for faster TTFB
// React 18 streaming with Suspense
import { Suspense } from 'react'

<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>
```

**Hydration optimization:**
```javascript
// React - avoid hydration delays
// Use selective hydration with Suspense
// Avoid client-side data fetching before hydration

// Astro - use partial hydration
<HeavyComponent client:load />      // Hydrate on load
<HeavyComponent client:idle />      // Hydrate when idle
<HeavyComponent client:visible />   // Hydrate when visible
```

---

## First Contentful Paint (FCP)

**What it measures:** Time until the first text or image is painted.

**Target:** < 1.8s (Good), 1.8-3s (Needs Improvement), > 3s (Poor)

### Key FCP Optimizations

#### 1. Inline Critical CSS
**Why:** Eliminates render-blocking network request for initial paint.

```html
<style>
  /* Inline critical CSS for above-the-fold content */
  body { margin: 0; font-family: system-ui, sans-serif; }
  .hero { min-height: 400px; background: #f0f0f0; }
</style>
<link rel="preload" href="/full-styles.css" as="style" onload="this.rel='stylesheet'">
```

**Build tool integration:**
```javascript
// Vite plugin for critical CSS
import { criticalCSS } from 'vite-plugin-critical'

export default {
  plugins: [
    criticalCSS({
      inlineMinSize: 10 * 1024, // Inline if < 10KB
      viewportHeight: 900,
      viewportWidth: 1300
    })
  ]
}

// Webpack - use html-critical-webpack-plugin
// Next.js - use next-optimized-images with critical CSS extraction
```

---

#### 2. Reduce Initial HTML Size
**Symptoms:** Long download time for initial HTML document

**Fixes:**
- Remove unused inline scripts
- Minimize framework overhead in HTML
- Use compression (Brotli/Gzip)
- Avoid server-side rendered content that's immediately hidden

---

## Total Blocking Time (TBT)

**What it measures:** Total time the main thread is blocked, preventing user input.

**Target:** < 200ms (Good), 200-600ms (Needs Improvement), > 600ms (Poor)

### Common TBT Issues

#### 1. Large JavaScript Bundles
**Symptoms:**
- Long "scripting" time in performance trace
- High TBT during initial load
- Delayed Time to Interactive (TTI)

**Fixes:**
```javascript
// Code splitting by route
// React Router with lazy loading
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./Dashboard'))
const Profile = lazy(() => import('./Profile'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  )
}

// Dynamic imports for heavy libraries
// Only load when needed
async function loadChart() {
  const { Chart } = await import('chart.js')
  return new Chart(ctx, config)
}
```

**Webpack optimization:**
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    }
  }
}
```

**Vite optimization:**
```javascript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@mui/material', '@emotion/react']
        }
      }
    }
  }
}
```

---

#### 2. Heavy JavaScript Execution
**Symptoms:**
- Long tasks (> 50ms) blocking main thread
- Jank during interaction
- Delayed response to user input

**Fixes:**
```javascript
// Break up long tasks with scheduling
// Use requestIdleCallback for non-critical work
function heavyProcessing(items) {
  const chunks = chunkArray(items, 100)
  
  function processChunk(index) {
    if (index >= chunks.length) return
    
    // Process one chunk
    chunks[index].forEach(item => process(item))
    
    // Schedule next chunk
    requestIdleCallback(() => processChunk(index + 1))
  }
  
  processChunk(0)
}

// Use Web Workers for CPU-intensive tasks
// worker.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data)
  self.postMessage(result)
}

// main.js
const worker = new Worker('worker.js')
worker.postMessage(data)
worker.onmessage = (e) => {
  updateUI(e.result)
}
```

---

## Cumulative Layout Shift (CLS)

**What it measures:** Visual stability - unexpected layout shifts during page load.

**Target:** < 0.1 (Good), 0.1-0.25 (Needs Improvement), > 0.25 (Poor)

### Common CLS Issues

#### 1. Images Without Dimensions
**Symptoms:**
- Content jumps when images load
- Text reflows after images appear

**Fixes:**
```html
<!-- Always specify width/height or aspect-ratio -->
<img src="photo.jpg" width="800" height="600" alt="Photo">

<!-- CSS aspect-ratio for responsive images -->
<style>
  .responsive-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }
</style>
<img src="photo.jpg" class="responsive-image" alt="Photo">

<!-- Modern responsive with aspect-ratio -->
<img src="photo.jpg" 
     style="width: 100%; aspect-ratio: 16/9;"
     alt="Photo">
```

---

#### 2. Fonts Loading (FOIT/FOUT)
**Symptoms:**
- Text disappears then reappears (FOIT - Flash of Invisible Text)
- Text style changes when font loads (FOUT - Flash of Unstyled Text)

**Fixes:**
```css
/* Use font-display to control loading behavior */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately */
}

/* Or use optional for no layout shift */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: optional; /* Use fallback if font not cached */
}

/* Preload critical fonts */
```

```html
<link rel="preload" href="/fonts/custom.woff2" as="font" type="font/woff2" crossorigin>
```

**Size-adjust for better fallback matching:**
```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap;
}

/* Adjust fallback to match custom font metrics */
@font-face {
  font-family: 'FallbackFont';
  src: local('Arial');
  size-adjust: 95%; /* Adjust to match custom font size */
  ascent-override: 105%;
  descent-override: 35%;
  line-gap-override: 10%;
}
```

---

#### 3. Dynamic Content Injection
**Symptoms:**
- Ads or embeds cause content to shift down
- Banners push content after loading

**Fixes:**
```css
/* Reserve space for ads/embeds */
.ad-container {
  min-height: 250px; /* Known ad size */
  background: #f0f0f0; /* Placeholder background */
}

/* Use aspect-ratio for responsive embeds */
.embed-container {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
}

.embed-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

**Avoid inserting above existing content:**
```javascript
// ❌ Bad - inserts above content
function addBanner() {
  document.body.insertBefore(banner, document.body.firstChild)
}

// ✅ Good - appends to bottom or replaces existing element
function addBanner() {
  const container = document.getElementById('banner-container')
  container.appendChild(banner)
}
```

---

## Speed Index

**What it measures:** How quickly content is visually displayed during page load.

**Target:** < 3.4s (Good), 3.4-5.8s (Needs Improvement), > 5.8s (Poor)

### Key Speed Index Optimizations

#### 1. Progressive Rendering
**Strategy:** Show content incrementally as it loads

```javascript
// Use streaming SSR
// React 18 with Suspense boundaries
<Suspense fallback={<Skeleton />}>
  <SlowComponent />
</Suspense>

// Show critical content first
// Use priority order: header → hero → main content → footer
```

---

#### 2. Resource Loading Order
**Strategy:** Load visible content first

```html
<!-- Prioritize above-the-fold resources -->
<link rel="preload" href="/hero.jpg" as="image" fetchpriority="high">
<link rel="preload" href="/critical.css" as="style">

<!-- Deprioritize below-the-fold resources -->
<img src="/footer-logo.jpg" loading="lazy" fetchpriority="low">
```

---

## Performance Insights Deep Dive

### Using Performance Insights

After running a performance trace, you'll see insight sets. Common insight types:

1. **LCP Discovery** - Analyzes why LCP happened when it did
2. **Render Blocking Requests** - Identifies blocking resources
3. **Cumulative Layout Shift** - Details of layout shifts
4. **Interaction to Next Paint** - Analyzes interactivity delays

**To analyze a specific insight:**
```
chrome-devtools_performance_analyze_insight({
  insightSetId: "abc123",
  insightName: "LCPBreakdown"
})
```

This provides:
- Detailed breakdown of the metric
- Specific resources causing issues
- Time spent in each phase
- Recommendations for improvement

---

## Framework-Specific Metric Optimization

### React / Next.js

```javascript
// Use next/script for third-party scripts
import Script from 'next/script'

<Script 
  src="https://analytics.example.com/script.js"
  strategy="lazyOnload" // Load after page interactive
/>

// Use next/image for automatic optimization
import Image from 'next/image'

<Image
  src="/hero.jpg"
  width={1200}
  height={800}
  priority // For LCP images
  placeholder="blur" // Reduce CLS
/>

// Dynamic imports with loading states
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Skeleton />,
  ssr: false // Client-side only if needed
})
```

### Vue / Nuxt

```javascript
// nuxt.config.ts
export default {
  // Automatic code splitting
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  
  // Image optimization
  image: {
    provider: 'cloudinary',
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280
    }
  },
  
  // Font optimization
  googleFonts: {
    families: {
      Inter: [400, 700]
    },
    display: 'swap',
    preload: true
  }
}
```

### Remix

```javascript
// Prefetch links for faster navigation
import { Link } from '@remix-run/react'

<Link to="/dashboard" prefetch="intent">
  Dashboard
</Link>

// Use loader for SSR data
export const loader = async ({ request }) => {
  const data = await fetchData()
  return json(data, {
    headers: {
      'Cache-Control': 'public, max-age=300'
    }
  })
}

// Defer non-critical data
export const loader = async () => {
  return defer({
    critical: await getCriticalData(),
    deferred: getDeferredData() // Don't await
  })
}
```

### Astro

```astro
---
// Static by default, minimal JS
import Layout from '../layouts/Layout.astro'
import Image from 'astro:assets'
import heroImage from '../assets/hero.jpg'
---

<Layout>
  <!-- Optimized image with automatic format conversion -->
  <Image 
    src={heroImage} 
    alt="Hero"
    loading="eager"
    widths={[400, 800, 1200]}
  />
  
  <!-- Partial hydration for interactive components -->
  <InteractiveWidget client:visible />
</Layout>
```

---

## Measurement Best Practices

### Local vs Production Measurements

**Local development:**
- Use Chrome DevTools throttling to simulate slower devices
- CPU throttling: 4x slowdown for mid-tier mobile
- Network throttling: Slow 4G or Fast 3G
- Disable cache for accurate measurements

**Production monitoring:**
- Use Real User Monitoring (RUM) via web-vitals library
- Track 75th percentile (p75) for Core Web Vitals
- Monitor across different user segments (device, network, geography)

**web-vitals integration:**
```javascript
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric)
  // Send to your analytics endpoint
  navigator.sendBeacon('/analytics', body)
}

onCLS(sendToAnalytics)
onFCP(sendToAnalytics)
onLCP(sendToAnalytics)
onTTFB(sendToAnalytics)
onINP(sendToAnalytics)
```

---

## Next Steps

Once you've analyzed metrics:

1. **Prioritize fixes** based on impact and effort
2. **Implement changes** with framework-specific code
3. **Measure improvement** with new performance traces
4. **Iterate** until targets are met

For specific issues, refer to other reference guides:
- **Network issues** → [network.md](./network.md)
- **Layout shifts** → [rendering.md](./rendering.md)
- **Bundle size** → [bundle.md](./bundle.md)
