# Bundle Size & Code Optimization

Deep dive into analyzing JavaScript/CSS bundles, identifying unused code, and implementing effective code-splitting strategies.

## Understanding Bundle Impact

### Why Bundle Size Matters

**Large bundles hurt performance through:**
1. **Slow download** - More bytes = longer load time
2. **Parse/compile time** - JavaScript must be parsed before execution
3. **Total Blocking Time (TBT)** - Heavy JavaScript blocks main thread
4. **Time to Interactive (TTI)** - App becomes interactive later

**Target bundle sizes:**
- **Critical JavaScript:** < 150KB (compressed)
- **Total JavaScript:** < 500KB (compressed) / 1.5MB uncompressed
- **Critical CSS:** < 50KB (compressed)
- **Total CSS:** < 100KB (compressed)

---

## Analyzing Bundle Composition

### 1. Generate Bundle Analysis

**Webpack Bundle Analyzer:**
```bash
npm install --save-dev webpack-bundle-analyzer
```

```javascript
// webpack.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static', // Generates HTML file
      openAnalyzer: false,
      reportFilename: 'bundle-report.html'
    })
  ]
}
```

**Rollup Plugin Visualizer (Vite):**
```bash
npm install --save-dev rollup-plugin-visualizer
```

```javascript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default {
  plugins: [
    visualizer({
      open: true,
      filename: 'bundle-stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ]
}
```

**Next.js Bundle Analyzer:**
```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer({
  // your config
})
```

```bash
# Generate analysis
ANALYZE=true npm run build
```

---

### 2. Identify Problem Areas

**Look for:**
- **Large individual dependencies** (> 100KB)
- **Duplicate dependencies** (same lib, different versions)
- **Unused dependencies** (imported but not used)
- **Dev dependencies in prod bundle**
- **Polyfills for modern browsers**

---

## Tree-Shaking

### What is Tree-Shaking?

**Tree-shaking** = Removing unused exports from bundles.

**Requirements:**
1. ES modules (import/export syntax)
2. Side-effect-free code
3. Production build mode

---

### Enabling Tree-Shaking

**Webpack:**
```javascript
// webpack.config.js
module.exports = {
  mode: 'production', // Enables tree-shaking
  optimization: {
    usedExports: true, // Mark unused exports
    minimize: true,    // Remove unused code
    sideEffects: false // Assume no side effects (be careful!)
  }
}

// package.json - Mark side-effect-free files
{
  "sideEffects": [
    "*.css",
    "*.scss"
  ]
}
```

**Vite/Rollup:**
```javascript
// vite.config.ts
export default {
  build: {
    minify: 'terser', // or 'esbuild'
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false
      }
    }
  }
}
```

---

### Import Correctly for Tree-Shaking

**❌ Bad - Imports entire library:**
```javascript
import _ from 'lodash'
import * as utils from './utils'
import { Button } from '@mui/material'

const result = _.map(array, fn)
```

**✅ Good - Named imports (tree-shakeable):**
```javascript
import map from 'lodash/map'
import { specificUtil } from './utils'
import Button from '@mui/material/Button'

const result = map(array, fn)
```

**Alternative - Use tree-shakeable versions:**
```javascript
// lodash-es instead of lodash
import { map } from 'lodash-es'

// date-fns instead of moment
import { format } from 'date-fns'
```

---

### Common Libraries with Tree-Shaking Issues

**Replace or import carefully:**

| Library | Issue | Alternative |
|---------|-------|-------------|
| `lodash` | Not tree-shakeable | `lodash-es` with named imports |
| `moment` | Huge, no tree-shaking | `date-fns` or `day.js` |
| `axios` | Large | `fetch` API or `ky` |
| `jquery` | Monolithic | Native DOM APIs |
| `bootstrap` | CSS + JS overhead | Tailwind, use only needed components |

---

## Code Splitting

### Types of Code Splitting

1. **Route-based** - Split by page/route
2. **Component-based** - Split heavy components
3. **Vendor splitting** - Separate third-party code
4. **Dynamic imports** - Load on demand

---

### 1. Route-Based Code Splitting

**React Router (lazy loading):**
```javascript
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Lazy load route components
const Home = lazy(() => import('./pages/Home'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

**Next.js (automatic route splitting):**
```javascript
// pages/dashboard.js - Automatically code-split
export default function Dashboard() {
  return <div>Dashboard</div>
}

// Or use dynamic imports for client-side routing
import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('../components/Dashboard'))
```

**Vue Router (lazy loading):**
```javascript
const routes = [
  {
    path: '/',
    component: () => import('./pages/Home.vue')
  },
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.vue')
  }
]
```

**Remix (automatic route splitting):**
```javascript
// app/routes/dashboard.tsx
// Each route file is automatically split
export default function Dashboard() {
  return <div>Dashboard</div>
}
```

---

### 2. Component-Based Code Splitting

**React (lazy + Suspense):**
```javascript
import { lazy, Suspense } from 'react'

// Split heavy components
const HeavyChart = lazy(() => import('./HeavyChart'))
const RichTextEditor = lazy(() => import('./RichTextEditor'))

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart data={data} />
      </Suspense>
      
      <Suspense fallback={<EditorSkeleton />}>
        <RichTextEditor />
      </Suspense>
    </div>
  )
}
```

**Next.js dynamic imports:**
```javascript
import dynamic from 'next/dynamic'

// No SSR for client-only components
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <MapSkeleton />
})

// With named exports
const Chart = dynamic(() => 
  import('./Charts').then(mod => mod.BarChart)
)
```

**Vue (async components):**
```javascript
import { defineAsyncComponent } from 'vue'

export default {
  components: {
    HeavyComponent: defineAsyncComponent(() =>
      import('./HeavyComponent.vue')
    )
  }
}
```

---

### 3. Vendor Splitting

**Webpack:**
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Separate vendor bundle
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        // React libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react-vendor',
          priority: 20
        },
        // UI library
        ui: {
          test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
          name: 'ui-vendor',
          priority: 20
        },
        // Common code used across multiple chunks
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

**Vite:**
```javascript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'utils': ['lodash-es', 'date-fns']
        }
      }
    }
  }
}
```

**Benefits:**
- ✅ Better caching (vendor rarely changes)
- ✅ Parallel downloads
- ✅ Smaller bundle updates

---

### 4. Dynamic Imports (On-Demand Loading)

**Load features on interaction:**
```javascript
// Load only when needed
async function openEditor() {
  const { Editor } = await import('./editor')
  const editor = new Editor()
  editor.open()
}

button.addEventListener('click', openEditor)
```

**Load libraries on demand:**
```javascript
// Load heavy library only when feature is used
async function exportToPDF() {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  doc.text('Hello world', 10, 10)
  doc.save('export.pdf')
}

// Load analytics only after user interaction
async function initAnalytics() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(async () => {
      const { analytics } = await import('./analytics')
      analytics.init()
    })
  }
}
```

**Framework examples:**
```javascript
// React - dynamic modal
function App() {
  const [showModal, setShowModal] = useState(false)
  const Modal = lazy(() => import('./Modal'))
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>Open</button>
      {showModal && (
        <Suspense fallback={null}>
          <Modal onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </>
  )
}

// Vue - dynamic feature
export default {
  methods: {
    async loadFeature() {
      const { HeavyFeature } = await import('./HeavyFeature.vue')
      this.$options.components.HeavyFeature = HeavyFeature
      this.showFeature = true
    }
  }
}
```

---

## Removing Unused Code

### 1. Remove Unused Dependencies

**Analyze dependencies:**
```bash
# Find unused dependencies
npx depcheck

# Or use npm-check
npx npm-check
```

**Common unused dependencies:**
- Dev tools (should be in devDependencies)
- Legacy polyfills
- Replaced libraries
- Testing utilities

**Remove safely:**
```bash
npm uninstall <package>
# Or
npm prune
```

---

### 2. Remove Unused CSS

**PurgeCSS (Tailwind, Bootstrap):**
```javascript
// Tailwind automatically purges in production
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ]
}
```

**Manual PurgeCSS:**
```bash
npm install --save-dev @fullhuman/postcss-purgecss
```

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: ['./src/**/*.html', './src/**/*.js'],
      safelist: ['active', 'hover'] // Keep these classes
    })
  ]
}
```

**CSS Modules (automatic):**
```javascript
// Unused CSS automatically removed with CSS Modules
import styles from './Component.module.css'

function Component() {
  return <div className={styles.container}>...</div>
}
```

---

### 3. Remove Dead Code

**ESLint rules:**
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-unused-vars': 'error',
    'no-unreachable': 'error'
  }
}
```

**TypeScript (automatic):**
```json
// tsconfig.json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## Modern JavaScript (Reduce Polyfills)

### Differential Loading

**Serve modern JS to modern browsers, legacy JS to old browsers.**

**Vite (automatic):**
```javascript
// vite.config.ts
export default {
  build: {
    target: 'es2015', // Modern browsers
    // Legacy plugin for old browsers
    plugins: [legacy({
      targets: ['defaults', 'not IE 11']
    })]
  }
}
```

**Next.js:**
```javascript
// next.config.js
module.exports = {
  // Modern browsers get ES2017
  // Legacy browsers get ES5 + polyfills
  experimental: {
    modern: true
  }
}
```

**Manual (using type="module"):**
```html
<!-- Modern browsers -->
<script type="module" src="/app.modern.js"></script>

<!-- Legacy browsers (nomodule) -->
<script nomodule src="/app.legacy.js"></script>
```

---

### Reduce Polyfill Size

**Use targeted polyfills:**
```javascript
// ❌ Bad - includes all polyfills
import 'core-js'

// ✅ Good - only needed polyfills
import 'core-js/features/promise'
import 'core-js/features/array/flat'
```

**Conditional polyfills:**
```javascript
// Only load polyfill if needed
if (!('IntersectionObserver' in window)) {
  await import('intersection-observer')
}

// Or use polyfill.io
<script src="https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver"></script>
```

**Babel preset-env (automatic):**
```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      useBuiltIns: 'usage', // Only polyfills actually used
      corejs: 3,
      targets: {
        browsers: ['> 1%', 'not dead', 'not ie 11']
      }
    }]
  ]
}
```

---

## Minification & Compression

### JavaScript Minification

**Terser (Webpack/Vite default):**
```javascript
// webpack.config.js
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log
            drop_debugger: true
          }
        }
      })
    ]
  }
}
```

**esbuild (faster):**
```javascript
// vite.config.ts
export default {
  build: {
    minify: 'esbuild',
    target: 'es2015'
  }
}
```

---

### CSS Minification

**cssnano (PostCSS):**
```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('cssnano')({
      preset: 'default'
    })
  ]
}
```

---

### Compression (Brotli/Gzip)

**Pre-compress at build time:**
```javascript
// vite.config.ts
import viteCompression from 'vite-plugin-compression'

export default {
  plugins: [
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024 // Only compress files > 1KB
    })
  ]
}
```

**Server-side compression:**
```javascript
// Express
const compression = require('compression')
app.use(compression())

// Nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
brotli on;
brotli_types text/plain text/css application/json application/javascript;
```

---

## Framework-Specific Optimizations

### React

**React DevTools in production:**
```javascript
// ❌ Bad - DevTools in production bundle
import React from 'react'

// ✅ Good - Remove DevTools in production
if (process.env.NODE_ENV === 'production') {
  // Disable React DevTools
  if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
    for (let [key, value] of Object.entries(window.__REACT_DEVTOOLS_GLOBAL_HOOK__)) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__[key] = typeof value === 'function' ? ()=>{} : null
    }
  }
}
```

**Lazy load heavy dependencies:**
```javascript
// Instead of importing directly
import { Editor } from '@monaco-editor/react'

// Lazy load
const Editor = lazy(() => 
  import('@monaco-editor/react').then(mod => ({ default: mod.Editor }))
)
```

---

### Next.js

**Analyze bundle:**
```bash
ANALYZE=true npm run build
```

**Optimize imports:**
```javascript
// next.config.js
module.exports = {
  // Tree-shake Lodash
  webpack: (config) => {
    config.plugins.push(
      new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/)
    )
    return config
  },
  
  // Experimental optimizations
  experimental: {
    optimizeFonts: true,
    optimizeImages: true,
    optimizeCss: true
  }
}
```

---

### Vue/Nuxt

**Nuxt bundle optimization:**
```javascript
// nuxt.config.ts
export default {
  build: {
    analyze: true, // Bundle analyzer
    
    // Terser options
    terser: {
      terserOptions: {
        compress: {
          drop_console: true
        }
      }
    },
    
    // Split vendor bundle
    splitChunks: {
      layouts: true,
      pages: true,
      commons: true
    }
  }
}
```

---

### Vite/Rollup

**Optimize chunk splitting:**
```javascript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separate node_modules
          if (id.includes('node_modules')) {
            return 'vendor'
          }
          
          // Separate by feature
          if (id.includes('/features/dashboard')) {
            return 'dashboard'
          }
        }
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500
  }
}
```

---

## Bundle Size Checklist

- [ ] **Bundle analyzer generated** - Understand bundle composition
- [ ] **Tree-shaking enabled** - Remove unused exports
- [ ] **Route-based code splitting** - Split by page
- [ ] **Component-based code splitting** - Split heavy components
- [ ] **Vendor code separated** - Better caching
- [ ] **Dynamic imports for features** - Load on demand
- [ ] **Unused dependencies removed** - depcheck clean
- [ ] **CSS purged** - Remove unused styles
- [ ] **Modern JavaScript target** - Fewer polyfills
- [ ] **Minification enabled** - Terser/esbuild
- [ ] **Compression enabled** - Brotli/Gzip
- [ ] **Large libraries replaced** - Use lighter alternatives

---

## Measuring Impact

### Before/After Comparison

```bash
# Generate bundle stats before optimization
npm run build
# Note sizes in console

# After optimization
npm run build
# Compare sizes

# Key metrics:
# - Total bundle size (compressed)
# - Initial JavaScript size
# - Time to Interactive improvement
```

### Lighthouse Bundle Size Impact

**Run Lighthouse before/after:**
- Reduces Total Blocking Time (TBT)
- Improves Time to Interactive (TTI)
- Faster First Contentful Paint (FCP)
- Lower "Reduce JavaScript execution time" score

---

## Next Steps

After bundle optimization:

1. **Verify improvements** - Run performance trace
2. **Check metrics impact** - TBT, TTI should improve
3. **Monitor production** - Track bundle sizes over time

For related topics:
- **Network optimization** → [network.md](./network.md)
- **Metrics impact** → [metrics.md](./metrics.md)
