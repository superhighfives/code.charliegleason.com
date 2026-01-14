# Network Performance Analysis

Deep dive into analyzing network waterfalls, identifying dependency chains, and optimizing resource loading patterns.

## Understanding Network Waterfalls

When you run `chrome-devtools_list_network_requests`, analyze:

- **Request timing** - DNS, connection, waiting (TTFB), download
- **Request order** - What loaded first, what was blocked
- **Resource types** - Document, script, stylesheet, image, font, XHR
- **Response sizes** - Compressed vs uncompressed
- **Cache status** - Cache hits vs fresh requests
- **Priority** - Browser-assigned resource priorities

### Network Timing Breakdown

Each request has phases:
1. **Queueing** - Waiting for available connection (limit: 6 per origin)
2. **Stalled** - Waiting for network thread
3. **DNS Lookup** - Resolving domain to IP
4. **Initial Connection** - TCP handshake
5. **SSL** - TLS negotiation (HTTPS only)
6. **Request Sent** - Sending HTTP request headers
7. **Waiting (TTFB)** - Time to First Byte from server
8. **Content Download** - Receiving response body

---

## Critical Rendering Path Analysis

### Identifying the Critical Path

**Goal:** Find minimum set of resources required for initial render.

**Method:**
1. Run performance trace with network recording
2. Identify when First Contentful Paint (FCP) occurs
3. Note all resources loaded before FCP
4. These resources are your critical path

**Common critical resources:**
- HTML document
- Critical CSS (above-the-fold styles)
- Web fonts used above-the-fold
- Hero images/above-the-fold images
- JavaScript needed for initial render (if any)

**Analysis checklist:**
- [ ] Is the HTML document optimized? (< 14KB initial response ideal)
- [ ] Are there render-blocking CSS files? (Should be inlined or preloaded)
- [ ] Are there render-blocking JavaScript files? (Should be deferred or async)
- [ ] Are critical fonts preloaded?
- [ ] Is the hero image prioritized?

---

## Render-Blocking Resources

### Identifying Blocking Resources

**Symptoms:**
- Large gap between navigation start and FCP
- Resources with high priority loading synchronously
- Parser-blocking scripts in `<head>`

**Detection in DevTools:**
```
Look for requests that:
1. Start early in the waterfall
2. Have "High" or "VeryHigh" priority
3. Are loaded before FCP line in waterfall
4. Block subsequent requests
```

### CSS Blocking

**Problem:** CSS blocks rendering by default.

```html
<!-- ❌ Blocks rendering -->
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/theme.css">
<link rel="stylesheet" href="/components.css">
```

**Solutions:**

**1. Inline Critical CSS**
```html
<style>
  /* Inline styles for above-the-fold content */
  .hero { min-height: 400px; background: #f0f0f0; }
  .header { display: flex; padding: 1rem; }
</style>
<!-- Load full CSS asynchronously -->
<link rel="preload" href="/styles.css" as="style" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/styles.css"></noscript>
```

**2. Media Query-Based Loading**
```html
<!-- Only blocks render for print, not screen -->
<link rel="stylesheet" href="/print.css" media="print">

<!-- Loads async, applies when condition matches -->
<link rel="stylesheet" href="/wide.css" media="(min-width: 1200px)">
```

**3. Split by Page/Route**
```javascript
// Webpack - CSS code splitting
import('./styles/dashboard.css')

// Vite - automatic CSS splitting with dynamic imports
const Dashboard = () => import('./Dashboard.vue')
```

### JavaScript Blocking

**Problem:** Synchronous scripts block HTML parsing.

```html
<!-- ❌ Blocks HTML parsing -->
<script src="/app.js"></script>
<script src="/vendor.js"></script>
```

**Solutions:**

**1. Defer Scripts**
```html
<!-- Downloads in parallel, executes after HTML parsed -->
<script src="/app.js" defer></script>
<script src="/vendor.js" defer></script>

<!-- Executes in order specified -->
<!-- Best for app code with dependencies -->
```

**2. Async Scripts**
```html
<!-- Downloads and executes immediately when ready -->
<script src="/analytics.js" async></script>
<script src="/ads.js" async></script>

<!-- Executes as soon as downloaded -->
<!-- Best for independent scripts -->
```

**3. Module Scripts (Modern)**
```html
<!-- Deferred by default -->
<script type="module" src="/app.js"></script>

<!-- Preload modules -->
<link rel="modulepreload" href="/app.js">
```

**Framework-specific:**
```javascript
// React - Next.js Script component
import Script from 'next/script'

<Script src="/widget.js" strategy="lazyOnload" />
// Strategies: beforeInteractive, afterInteractive, lazyOnload, worker

// Remix - defer script loading
export const handle = {
  scripts: () => [
    { src: '/widget.js', async: true }
  ]
}

// Astro - control script loading
<script src="/widget.js" is:inline defer />
```

---

## Network Dependency Chains

### Identifying Chains

**Problem:** Request B can't start until Request A completes.

**Common chains:**
1. HTML → CSS → Font
2. HTML → JS → API call
3. HTML → JS → Lazy-loaded component → Component CSS
4. DNS → Connection → SSL → Request → Response

**Detection:**
Look at the waterfall for "staircase" patterns where requests start only after previous ones complete.

### Breaking Dependency Chains

#### 1. Preconnect to Third-Party Origins

**Problem:** DNS + Connection + SSL overhead for each origin.

```html
<!-- Establish connection before resource is requested -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Later in document -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">
```

**Common third-party origins to preconnect:**
- Google Fonts: `fonts.googleapis.com` + `fonts.gstatic.com`
- CDNs: Your CDN origin
- APIs: Your API domain (if different from main site)
- Analytics: `www.google-analytics.com`
- Ad networks: Varies by provider

**Framework examples:**
```javascript
// Next.js - in _document.js or layout
<Head>
  <link rel="preconnect" href="https://cdn.example.com" />
</Head>

// Remix - in root.tsx
export const links = () => [
  { rel: 'preconnect', href: 'https://cdn.example.com' }
]

// Astro - in Layout component
<link rel="preconnect" href="https://cdn.example.com" />
```

---

#### 2. Preload Critical Resources

**Problem:** Browser discovers resources late (e.g., fonts in CSS).

```html
<!-- Preload font before CSS is parsed -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

<!-- Preload hero image -->
<link rel="preload" href="/hero.jpg" as="image">

<!-- Preload critical JavaScript -->
<link rel="preload" href="/critical.js" as="script">

<!-- Preload with priority (Chrome 121+) -->
<link rel="preload" href="/hero.jpg" as="image" fetchpriority="high">
```

**What to preload:**
- ✅ Fonts used above-the-fold
- ✅ Hero images (LCP candidate)
- ✅ Critical CSS (if not inlined)
- ❌ Too many resources (defeats the purpose)
- ❌ Resources that load quickly anyway

**Framework examples:**
```javascript
// React (Next.js)
<Head>
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
</Head>

// Vue (Nuxt)
export default {
  head() {
    return {
      link: [
        { rel: 'preload', href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossorigin: true }
      ]
    }
  }
}

// Vite - via transformIndexHtml hook
export default {
  plugins: [{
    name: 'preload-fonts',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        '<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin></head>'
      )
    }
  }]
}
```

---

#### 3. Early Hints (HTTP 103)

**Problem:** Server must generate full HTML before sending headers.

**Solution:** Send preload hints before HTML is ready.

```javascript
// Node.js / Express
app.get('/', (req, res) => {
  // Send early hints
  res.writeEarlyHints({
    link: [
      '</styles.css>; rel=preload; as=style',
      '</fonts/inter.woff2>; rel=preload; as=font; crossorigin'
    ]
  })
  
  // Generate and send HTML
  const html = await generateHTML()
  res.send(html)
})

// Cloudflare Workers
export default {
  async fetch(request) {
    // Early hints automatically sent by Cloudflare
    return new Response(html, {
      headers: {
        'Link': '</styles.css>; rel=preload; as=style'
      }
    })
  }
}
```

---

#### 4. Inline Critical Resources

**Problem:** Network request delays are unavoidable.

**Solution:** Embed critical resources directly in HTML.

```html
<!-- Inline critical CSS -->
<style>
  .hero { min-height: 400px; background: #f0f0f0; }
  /* Only above-the-fold styles */
</style>

<!-- Inline critical JavaScript (small only) -->
<script>
  // Theme detection, critical polyfills, etc.
  document.documentElement.classList.add(
    localStorage.theme || 'light'
  )
</script>

<!-- Data URLs for small images -->
<img src="data:image/svg+xml,<svg>...</svg>" alt="Icon">
```

**Trade-offs:**
- ✅ Eliminates network request
- ✅ Faster first render
- ❌ Increases HTML size
- ❌ Not cacheable separately
- ❌ Blocks HTML parsing if too large

**Recommendation:** Inline only if < 1-2KB and truly critical.

---

## Request Queuing and Parallelization

### HTTP/1.1 Connection Limits

**Problem:** Browser limits to 6 concurrent requests per origin.

**Symptoms:**
- Requests wait in queue despite network availability
- "Stalled" time in DevTools
- Long waterfall even with fast TTFB

**Solutions:**

**1. Use HTTP/2 or HTTP/3**
```nginx
# Nginx - Enable HTTP/2
listen 443 ssl http2;

# Automatic multiplexing, no connection limit
```

**2. Domain Sharding (HTTP/1.1 only)**
```html
<!-- Spread resources across subdomains -->
<script src="https://js1.example.com/app.js"></script>
<link rel="stylesheet" href="https://css1.example.com/styles.css">
<img src="https://img1.example.com/hero.jpg">

<!-- Note: Hurts HTTP/2 performance, use only for HTTP/1.1 -->
```

**3. Reduce Request Count**
- Combine small files
- Use CSS sprites or SVG sprites
- Bundle JavaScript modules
- Use icon fonts or inline SVGs

---

## Resource Prioritization

### Browser Priority Levels

Browsers assign priority to resources:

**High Priority:**
- HTML document
- CSS (render-blocking)
- Fonts (if used in above-the-fold content)
- Scripts with `defer` or `async` in `<head>`
- Images in viewport (if using `loading="eager"`)

**Low Priority:**
- Images below viewport (if using `loading="lazy"`)
- Prefetch resources
- Async scripts

### Manual Priority Hints

**`fetchpriority` attribute (Chrome, Edge):**
```html
<!-- Boost priority for LCP image -->
<img src="/hero.jpg" fetchpriority="high">

<!-- Lower priority for below-fold images -->
<img src="/footer-logo.jpg" fetchpriority="low">

<!-- Also works on scripts and stylesheets -->
<link rel="stylesheet" href="/critical.css" fetchpriority="high">
<script src="/analytics.js" async fetchpriority="low"></script>
```

**Framework integration:**
```javascript
// Next.js Image
<Image src="/hero.jpg" priority /> // Sets fetchpriority="high"

// React img element
<img src="/hero.jpg" fetchPriority="high" />

// Note: JSX uses camelCase
```

---

## Caching Strategies

### Cache-Control Headers

**Goal:** Minimize repeated requests on return visits.

```javascript
// Immutable static assets (content-hashed filenames)
Cache-Control: public, max-age=31536000, immutable

// Dynamic content with CDN cache
Cache-Control: public, s-maxage=3600, max-age=0, must-revalidate

// Private user data
Cache-Control: private, max-age=300

// Always fresh
Cache-Control: no-cache, no-store, must-revalidate
```

**Framework examples:**
```javascript
// Next.js - static files automatically cached
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}

// Remix - set headers in loader
export const loader = async () => {
  return json(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

// Express
app.use('/static', express.static('public', {
  maxAge: '1y',
  immutable: true
}))
```

### CDN Caching

**Strategy:** Cache at edge locations closer to users.

```javascript
// Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    const cache = caches.default
    
    // Check cache first
    let response = await cache.match(request)
    if (response) return response
    
    // Fetch from origin
    response = await fetch(request)
    
    // Cache response
    ctx.waitUntil(cache.put(request, response.clone()))
    
    return response
  }
}

// With custom cache key
const cacheKey = new Request(url, { method: 'GET' })
```

### Service Worker Caching

**Strategy:** Offline-first or cache-first approach.

```javascript
// service-worker.js
const CACHE_NAME = 'v1'
const urlsToCache = [
  '/',
  '/styles.css',
  '/app.js'
]

// Install - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

// Fetch - cache first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit
        if (response) return response
        
        // Fetch from network
        return fetch(event.request)
      })
  )
})
```

**Using Workbox (recommended):**
```javascript
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST)

// Cache images with CacheFirst
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
)

// Cache API calls with NetworkFirst
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      })
    ]
  })
)
```

---

## Compression

### Enable Brotli and Gzip

**Brotli:** Better compression than Gzip (5-20% smaller).

```nginx
# Nginx with brotli
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

# Fallback to gzip
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
```

**Vite (pre-compression):**
```javascript
// vite.config.ts
import viteCompression from 'vite-plugin-compression'

export default {
  plugins: [
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br'
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    })
  ]
}
```

**Cloudflare Workers (automatic):**
```javascript
// Compression handled automatically
// Just return Response with appropriate content-type
```

---

## Third-Party Script Optimization

### Lazy Load Third-Party Scripts

**Problem:** Analytics, ads, widgets slow down main content.

**Solution:** Load after main content is interactive.

```html
<!-- Native lazy loading -->
<script src="/analytics.js" async></script>

<!-- Or wait for load event -->
<script>
  window.addEventListener('load', () => {
    const script = document.createElement('script')
    script.src = '/analytics.js'
    script.async = true
    document.body.appendChild(script)
  })
</script>
```

**Framework approaches:**
```javascript
// Next.js - strategy="lazyOnload"
import Script from 'next/script'

<Script 
  src="https://www.googletagmanager.com/gtag/js"
  strategy="lazyOnload"
/>

// React - useEffect
useEffect(() => {
  const script = document.createElement('script')
  script.src = '/widget.js'
  script.async = true
  document.body.appendChild(script)
  
  return () => document.body.removeChild(script)
}, [])

// Astro - client:idle or client:visible
<AnalyticsWidget client:idle />
```

### Facade Pattern for Heavy Embeds

**Problem:** YouTube, Twitter embeds load heavy JavaScript.

**Solution:** Show placeholder, load on interaction.

```javascript
// React component
function YouTubeFacade({ videoId }) {
  const [loaded, setLoaded] = useState(false)
  
  if (!loaded) {
    return (
      <div 
        className="youtube-facade"
        onClick={() => setLoaded(true)}
        style={{ backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg)` }}
      >
        <button>Play Video</button>
      </div>
    )
  }
  
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}
```

**Libraries:**
- `react-lite-youtube-embed`
- `@justinribeiro/lite-youtube`
- `lite-vimeo-embed`

---

## Framework-Specific Network Optimizations

### Next.js

```javascript
// next.config.js
module.exports = {
  // Compress responses
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  
  // Asset prefix (CDN)
  assetPrefix: 'https://cdn.example.com',
  
  // Headers
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      }
    ]
  }
}
```

### Remix

```javascript
// Prefetch links on hover
<Link to="/dashboard" prefetch="intent">Dashboard</Link>

// Resource routes for data
// /api/data.ts
export const loader = async () => {
  return json(data, {
    headers: {
      'Cache-Control': 'public, max-age=300'
    }
  })
}
```

### Vite

```javascript
// vite.config.ts
export default {
  build: {
    // Asset inline threshold
    assetsInlineLimit: 4096, // < 4KB as base64
    
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material']
        }
      }
    }
  }
}
```

---

## Network Analysis Checklist

Use this checklist when analyzing network performance:

- [ ] **TTFB < 600ms** - Server response time
- [ ] **No render-blocking CSS** - Inline or preload critical CSS
- [ ] **No render-blocking JavaScript** - Use defer/async
- [ ] **Critical fonts preloaded** - Avoid font loading delay
- [ ] **LCP image prioritized** - fetchpriority="high" or preload
- [ ] **Third-party origins preconnected** - DNS/connection warming
- [ ] **Appropriate caching headers** - Cache static assets
- [ ] **Compression enabled** - Brotli or Gzip
- [ ] **< 50 requests on initial load** - Combine where possible
- [ ] **No unnecessary redirects** - Each redirect adds latency
- [ ] **HTTP/2 or HTTP/3 enabled** - Multiplexing
- [ ] **Total payload < 500KB (compressed)** - For initial load

---

## Next Steps

After network optimization:

1. **Measure improvement** - Run new performance trace
2. **Check other areas** - Rendering, bundle size, accessibility
3. **Monitor over time** - Set up Real User Monitoring (RUM)

For related topics, see:
- **Metrics impact** → [metrics.md](./metrics.md)
- **Bundle optimization** → [bundle.md](./bundle.md)
