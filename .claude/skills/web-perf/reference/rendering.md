# Rendering Performance Analysis

Deep dive into layout shifts, paint operations, and rendering performance optimization.

## Understanding Browser Rendering

### Rendering Pipeline

1. **Parse HTML** → DOM tree
2. **Parse CSS** → CSSOM tree
3. **Combine** → Render tree
4. **Layout** → Calculate positions and sizes
5. **Paint** → Draw pixels
6. **Composite** → Layer composition

**Performance impact:**
- **Layout (Reflow)** - Most expensive (geometry changes)
- **Paint** - Expensive (visual changes)
- **Composite** - Cheap (GPU-accelerated)

---

## Cumulative Layout Shift (CLS) Analysis

### What Causes Layout Shifts

**Layout shift = Unexpected movement of visible page content**

Common causes:
1. Images without dimensions
2. Ads/embeds/iframes without reserved space
3. Web fonts causing FOIT/FOUT
4. Dynamically injected content
5. CSS animations using layout properties

### Detecting Layout Shifts in DevTools

After running a performance trace:

```
chrome-devtools_performance_analyze_insight({
  insightSetId: "...",
  insightName: "CumulativeLayoutShift"
})
```

This shows:
- Which elements caused shifts
- Shift score for each occurrence
- Timestamp of each shift
- Visual indication of movement

---

## Layout Shift Fixes

### 1. Images and Videos Without Dimensions

**Problem:** Content shifts when media loads and browser learns its size.

**Detection:**
```html
<!-- ❌ No dimensions specified -->
<img src="/photo.jpg" alt="Photo">
<video src="/video.mp4"></video>
```

**Solutions:**

**Explicit dimensions:**
```html
<!-- ✅ Width and height prevent shift -->
<img src="/photo.jpg" width="800" height="600" alt="Photo">

<!-- Works even if CSS makes it responsive -->
<style>
  img { width: 100%; height: auto; }
</style>
```

**CSS aspect-ratio (modern):**
```html
<img src="/photo.jpg" alt="Photo" style="aspect-ratio: 16/9; width: 100%;">

<!-- Or in CSS -->
<style>
  .responsive-img {
    aspect-ratio: 16 / 9;
    width: 100%;
    object-fit: cover;
  }
</style>
<img src="/photo.jpg" alt="Photo" class="responsive-img">
```

**Padding hack (legacy):**
```css
/* For older browsers without aspect-ratio support */
.img-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio (9/16 = 0.5625) */
}

.img-container img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

**Framework implementations:**
```javascript
// Next.js Image (handles automatically)
import Image from 'next/image'

<Image 
  src="/photo.jpg"
  width={800}
  height={600}
  alt="Photo"
  placeholder="blur" // Further reduces CLS
/>

// Astro (automatic aspect ratio)
import { Image } from 'astro:assets'
import photo from '../assets/photo.jpg'

<Image src={photo} alt="Photo" />
// Dimensions extracted at build time

// Remix with Cloudflare Images
<img 
  src="https://example.com/cdn-cgi/image/width=800/photo.jpg"
  width={800}
  height={600}
  alt="Photo"
  style={{ aspectRatio: '16/9' }}
/>
```

---

### 2. Ads and Embeds

**Problem:** Ads/embeds load asynchronously and push content down.

**Detection:**
- CLS occurs when ad container loads
- Content below ad jumps

**Solutions:**

**Reserve space with min-height:**
```html
<div class="ad-container">
  <!-- Ad loads here -->
</div>

<style>
  .ad-container {
    min-height: 250px; /* Standard banner height */
    background: #f0f0f0; /* Placeholder color */
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .ad-container::before {
    content: 'Advertisement';
    color: #999;
    font-size: 12px;
  }
</style>
```

**Aspect ratio for responsive ads:**
```css
.ad-container {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
  background: #f0f0f0;
}

.ad-container > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

**YouTube/Twitter embeds:**
```html
<!-- Reserve space before loading -->
<div class="embed-container" style="aspect-ratio: 16/9;">
  <iframe src="https://www.youtube.com/embed/..." 
          style="width: 100%; height: 100%;"></iframe>
</div>

<!-- Or use facade pattern (see network.md) -->
```

---

### 3. Web Fonts (FOIT/FOUT)

**Problem:**
- **FOIT (Flash of Invisible Text)** - Text invisible while font loads, then appears (shift)
- **FOUT (Flash of Unstyled Text)** - Fallback font shown, then swapped (shift)

**Detection:**
- CLS occurs when font swaps
- Text size changes when custom font loads

**Solutions:**

**font-display strategies:**
```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  
  /* Choose strategy */
  font-display: swap;     /* Show fallback immediately */
  font-display: optional;  /* Use fallback if font not cached */
  font-display: block;     /* Hide text briefly, then show font */
}
```

**Recommendations:**
- **swap** - Good for most cases (prioritizes content visibility)
- **optional** - Best for CLS (only uses custom font if cached)
- **block** - Avoid (causes FOIT)

**Preload fonts:**
```html
<link rel="preload" 
      href="/fonts/inter-var.woff2" 
      as="font" 
      type="font/woff2" 
      crossorigin>
```

**Font metric overrides (reduce shift):**
```css
/* Adjust fallback font to match custom font metrics */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap;
}

/* Fallback with size adjustments */
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
  size-adjust: 107%;
}

body {
  font-family: 'Inter', 'Inter Fallback', sans-serif;
}
```

**Generate overrides automatically:**
```bash
# Using @capsizecss/metrics
npm install @capsizecss/metrics

# Or use https://screenspan.net/fallback
# Generates CSS overrides for your font
```

**Framework examples:**
```javascript
// Next.js - built-in font optimization
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial']
})

// CSS-in-JS
<div className={inter.className}>...</div>

// Nuxt (nuxt/fonts module)
export default {
  modules: ['@nuxtjs/google-fonts'],
  googleFonts: {
    families: {
      Inter: [400, 700]
    },
    display: 'swap',
    preload: true,
    useStylesheet: false // Inline CSS
  }
}

// Astro
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
<style is:global>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter.woff2') format('woff2');
    font-display: swap;
  }
</style>
```

---

### 4. Dynamically Inserted Content

**Problem:** Content inserted above existing content pushes everything down.

**Detection:**
- CLS when banners, notifications, or announcements appear
- Content jumps after API response

**Solutions:**

**Reserve space upfront:**
```html
<!-- Reserve space for banner -->
<div class="banner-container" style="min-height: 60px;">
  <!-- Banner loads here -->
</div>

<!-- Or use placeholder -->
<div class="content">
  <div class="notification-placeholder" aria-live="polite">
    <!-- Will be replaced with notification -->
  </div>
  <main>...</main>
</div>
```

**Append instead of prepend:**
```javascript
// ❌ Bad - inserts above content
container.prepend(notification)
container.insertBefore(banner, container.firstChild)

// ✅ Good - appends or replaces
container.append(notification)
container.replaceChild(banner, placeholder)
```

**Animate in place (CSS transforms):**
```css
/* Use transforms, not top/margin */
.notification {
  transform: translateY(-100%);
  transition: transform 0.3s;
}

.notification.visible {
  transform: translateY(0);
}
```

**Skeleton screens:**
```html
<!-- Show skeleton while loading -->
<div class="skeleton" v-if="loading">
  <div class="skeleton-line"></div>
  <div class="skeleton-line"></div>
  <div class="skeleton-line short"></div>
</div>
<div class="content" v-else>
  <!-- Actual content -->
</div>

<style>
  .skeleton-line {
    height: 1em;
    margin: 0.5em 0;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  .skeleton-line.short {
    width: 60%;
  }
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
```

---

### 5. Animations Triggering Layout

**Problem:** Animating layout properties (width, height, top, left) causes reflows.

**Detection:**
- CLS during animations
- Layout shifts in DevTools timeline

**Solution: Use transforms and opacity only**

```css
/* ❌ Bad - triggers layout */
.slide-in {
  animation: slideIn 0.3s;
}

@keyframes slideIn {
  from { left: -100%; }
  to { left: 0; }
}

/* ✅ Good - GPU-accelerated */
.slide-in {
  animation: slideIn 0.3s;
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
```

**Properties that trigger layout (avoid):**
- width, height
- top, left, right, bottom
- margin, padding
- border
- position

**Properties that don't trigger layout (prefer):**
- transform (translate, scale, rotate)
- opacity
- filter
- clip-path

**Example refactor:**
```css
/* Before: Animating height (bad) */
.accordion-content {
  height: 0;
  transition: height 0.3s;
}

.accordion-content.open {
  height: auto;
}

/* After: Animating scale (good) */
.accordion-content {
  transform-origin: top;
  transform: scaleY(0);
  transition: transform 0.3s;
}

.accordion-content.open {
  transform: scaleY(1);
}
```

---

## Paint Performance

### Understanding Paint Operations

**Paint** = Converting render tree to pixels

**Types:**
1. **First Paint** - First pixels rendered
2. **First Contentful Paint** - First content visible
3. **Paint** - Any subsequent paint

### Reducing Paint Time

#### 1. Simplify Paint Complexity

**Expensive paint operations:**
- Box shadows
- Border radius
- Gradients
- Filters (blur, etc.)
- Text rendering

```css
/* ❌ Expensive */
.card {
  box-shadow: 0 10px 50px rgba(0,0,0,0.3);
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  backdrop-filter: blur(10px);
}

/* ✅ Simpler */
.card {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 4px;
  background: #667eea;
}
```

**When complexity is needed:**
- Use images instead of CSS effects
- Apply effects to fewer elements
- Use CSS `will-change` sparingly

---

#### 2. Reduce Paint Areas

**Problem:** Painting large areas is slow.

**Solutions:**

**Contain paint:**
```css
/* Limit paint area to container */
.container {
  contain: paint; /* Isolate paint operations */
}

/* Or use containment for specific elements */
.card {
  contain: layout paint;
}
```

**Layer promotion:**
```css
/* Promote element to own layer (GPU-accelerated) */
.animated-element {
  will-change: transform; /* Creates layer */
}

/* Or use transform3d hack (legacy) */
.animated-element {
  transform: translateZ(0);
}
```

**Warning:** Too many layers hurts performance. Use sparingly.

---

#### 3. Avoid Paint Storms

**Problem:** Many paint operations in quick succession.

**Detection:**
- Paint flashing in DevTools (Show paint rectangles)
- High paint time in performance timeline

**Solutions:**

**Batch DOM changes:**
```javascript
// ❌ Bad - causes multiple reflows/repaints
elements.forEach(el => {
  el.style.width = '100px' // Reflow
  el.style.height = '100px' // Reflow
})

// ✅ Good - batch with CSS class
elements.forEach(el => {
  el.classList.add('sized') // Single reflow
})
```

**Use DocumentFragment:**
```javascript
// ❌ Bad - multiple paints
for (let i = 0; i < 100; i++) {
  container.appendChild(createItem())
}

// ✅ Good - single paint
const fragment = document.createDocumentFragment()
for (let i = 0; i < 100; i++) {
  fragment.appendChild(createItem())
}
container.appendChild(fragment)
```

**Use requestAnimationFrame:**
```javascript
// ❌ Bad - immediate (may happen mid-frame)
function updateUI() {
  element.style.transform = `translateX(${x}px)`
}

// ✅ Good - synced with browser paint
function updateUI() {
  requestAnimationFrame(() => {
    element.style.transform = `translateX(${x}px)`
  })
}
```

---

## Compositing Performance

### Understanding Layers

**Compositing** = Combining layers on GPU

**Layer creation triggers:**
- `will-change: transform`
- `transform: translateZ(0)` or `translate3d(0,0,0)`
- `<video>`, `<canvas>`, `<iframe>`
- CSS filters
- Opacity animations
- Fixed/sticky positioning (sometimes)

### Optimizing Compositing

#### 1. Use Transforms for Animation

```css
/* ✅ Composited on GPU */
.element {
  will-change: transform;
  animation: slide 1s;
}

@keyframes slide {
  from { transform: translateX(0); }
  to { transform: translateX(100px); }
}
```

#### 2. Avoid Excessive Layers

**Problem:** Too many layers = high memory usage.

```css
/* ❌ Bad - creates layer for every item */
.list-item {
  will-change: transform;
}

/* ✅ Good - create layer only when animating */
.list-item.animating {
  will-change: transform;
}
```

**Remove will-change after animation:**
```javascript
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto'
})
```

---

## Scrolling Performance

### Smooth Scrolling

**Problem:** Heavy paint/layout operations during scroll cause jank.

**Solutions:**

**1. Use passive event listeners:**
```javascript
// Prevents scroll blocking
document.addEventListener('scroll', handleScroll, { passive: true })
document.addEventListener('touchstart', handleTouch, { passive: true })
```

**2. Throttle/debounce scroll handlers:**
```javascript
// Throttle - execute at most once per interval
let throttleTimer
function throttle(callback, delay) {
  return (...args) => {
    if (throttleTimer) return
    throttleTimer = setTimeout(() => {
      callback(...args)
      throttleTimer = null
    }, delay)
  }
}

document.addEventListener('scroll', throttle(handleScroll, 100))

// Or use requestAnimationFrame
let rafId
document.addEventListener('scroll', () => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    handleScroll()
    rafId = null
  })
})
```

**3. Use CSS for scroll effects:**
```css
/* Parallax scrolling with CSS */
.parallax {
  background-attachment: fixed;
  background-position: center;
  background-size: cover;
}

/* Or use transform with CSS variables (Houdini) */
@supports (animation-timeline: scroll()) {
  .element {
    animation: fadeIn linear;
    animation-timeline: scroll();
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}
```

**4. Intersection Observer for scroll-triggered animations:**
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible')
      observer.unobserve(entry.target) // Trigger once
    }
  })
}, { threshold: 0.1 })

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el)
})
```

---

## Infinite Scroll / Virtualization

**Problem:** Rendering thousands of DOM elements hurts performance.

**Solution:** Render only visible items.

**Libraries:**
- `react-window` (React)
- `react-virtualized` (React)
- `vue-virtual-scroller` (Vue)
- `@tanstack/virtual` (Framework-agnostic)

**Example with react-window:**
```javascript
import { FixedSizeList } from 'react-window'

function VirtualList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  )
}
```

---

## Framework-Specific Rendering Optimizations

### React

```javascript
// Prevent unnecessary re-renders
const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id // True = skip render
})

// Use keys for list rendering
{items.map(item => (
  <Item key={item.id} {...item} />
))}

// Lazy load components
const HeavyComponent = lazy(() => import('./Heavy'))

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>

// useTransition for non-urgent updates (React 18)
const [isPending, startTransition] = useTransition()

function handleChange(value) {
  startTransition(() => {
    setSearchQuery(value) // Low priority update
  })
}
```

### Vue

```javascript
// Functional components (stateless, faster)
export default {
  functional: true,
  render(h, context) {
    return h('div', context.props.text)
  }
}

// v-once for static content
<div v-once>{{ expensiveComputation() }}</div>

// v-memo for conditional rendering
<div v-memo="[item.id]">{{ item.name }}</div>

// Lazy load components
const HeavyComponent = () => import('./Heavy.vue')
```

### Svelte

```svelte
<!-- Automatic reactivity optimization -->
<script>
  let count = 0
  $: doubled = count * 2 // Only recomputes when count changes
</script>

<!-- Lazy load -->
<script>
  import { onMount } from 'svelte'
  let Component
  
  onMount(async () => {
    Component = (await import('./Heavy.svelte')).default
  })
</script>

{#if Component}
  <svelte:component this={Component} />
{/if}
```

---

## DevTools Rendering Analysis

### Enable Paint Flashing

1. Open DevTools
2. Press `Cmd/Ctrl + Shift + P`
3. Type "Show Rendering"
4. Check "Paint flashing"

**What to look for:**
- Green flashes = Paint operations
- Excessive flashing during scroll = Performance issue
- Entire screen flashing = Full repaint (bad)

### Layout Shift Regions

In Performance recording:
1. Look for "Layout Shift" events
2. Click event to see affected elements
3. Review shift score and impact area

---

## Rendering Performance Checklist

- [ ] **Images have dimensions** - No CLS from media loading
- [ ] **Fonts use font-display: swap** - No FOIT/FOUT shifts
- [ ] **Ads have reserved space** - No content jumping
- [ ] **Animations use transforms** - GPU-accelerated
- [ ] **No layout thrashing** - Batch DOM reads/writes
- [ ] **Scroll handlers are passive** - Non-blocking scrolling
- [ ] **Large lists use virtualization** - Limit DOM size
- [ ] **will-change used sparingly** - Avoid excessive layers
- [ ] **Intersection Observer for lazy loading** - Efficient viewport detection
- [ ] **No paint storms** - Batch visual updates

---

## Next Steps

After rendering optimization:

1. **Verify CLS improvement** - Run new performance trace
2. **Check paint performance** - Enable paint flashing
3. **Monitor production** - Use Real User Monitoring for CLS

For related topics:
- **CLS impact on metrics** → [metrics.md](./metrics.md)
- **Network optimization** → [network.md](./network.md)
