---
name: web-perf
description: Comprehensive web performance analysis and optimization toolkit using Chrome DevTools. Analyzes Core Web Vitals (FCP, LCP, TBT, CLS, Speed Index), identifies render-blocking resources, network dependency chains, layout shifts, bundling issues, and accessibility problems. Use when auditing web performance, investigating slow page loads, analyzing Lighthouse metrics, or implementing performance improvements.
license: Apache-2.0
---

# Web Performance Analysis & Optimization

A comprehensive toolkit for analyzing and improving web performance using Chrome DevTools MCP server. This skill focuses on identifying and fixing real-world performance bottlenecks across metrics, network, rendering, bundling, and accessibility.

## When to Use This Skill

Use this skill when:
- Auditing web performance and Core Web Vitals
- Investigating slow page loads or poor user experience
- Analyzing Lighthouse metrics (FCP, LCP, TBT, CLS, Speed Index)
- Identifying render-blocking resources or network waterfalls
- Optimizing bundle size and eliminating unused code
- Debugging layout shifts or cumulative layout shift issues
- Checking accessibility issues (contrast ratios, ARIA, focus management)
- Implementing performance improvements in web frameworks

## Analysis Process

### Phase 1: Initial Performance Assessment

**Goal:** Establish baseline metrics and identify major issues

1. **Start a performance trace recording:**
   ```
   chrome-devtools_performance_start_trace({ reload: true, autoStop: true })
   ```
   - This captures Core Web Vitals and performance insights
   - Always reload the page for consistent measurements

2. **Wait for the trace to complete**, then analyze results:
   - Review Core Web Vitals scores (FCP, LCP, TBT, CLS, Speed Index)
   - Identify highlighted Performance Insights
   - Note any red flags in timing metrics

3. **List network requests:**
   ```
   chrome-devtools_list_network_requests({})
   ```
   - Review request timing, sizes, and types
   - Look for blocking patterns and slow resources

4. **Check console for errors:**
   ```
   chrome-devtools_list_console_messages({})
   ```
   - JavaScript errors can impact performance
   - Look for warnings about deprecated APIs or security issues

**Output:** Performance baseline with identified problem areas

### Phase 2: Deep Dive Analysis

Based on Phase 1 findings, use specialized reference guides:

- **[Metrics Analysis](./reference/metrics.md)** - Deep dive into Core Web Vitals
  - When: Poor FCP, LCP, TBT, CLS, or Speed Index scores
  - Analyzes specific metric failures and root causes

- **[Network Analysis](./reference/network.md)** - Network waterfall optimization
  - When: Slow initial load or render-blocking resources
  - Identifies dependency chains, critical paths, and caching issues

- **[Rendering Analysis](./reference/rendering.md)** - Layout shifts and rendering
  - When: High CLS or visual instability issues
  - Analyzes layout shifts, reflows, and rendering performance

- **[Bundle Analysis](./reference/bundle.md)** - JavaScript/CSS optimization
  - When: Large bundle sizes or unused code detected
  - Identifies opportunities for code-splitting and tree-shaking

- **[Accessibility Analysis](./reference/accessibility.md)** - A11y performance impact
  - When: Accessibility issues or poor focus management
  - Checks contrast ratios, ARIA attributes, and interactive elements

### Phase 3: Codebase Analysis

**Goal:** Understand architecture to recommend targeted fixes

1. **Identify the tech stack:**
   - Framework: React, Vue, Angular, Svelte, etc.
   - Bundler: Webpack, Vite, Rollup, esbuild, Parcel, etc.
   - Build tool: package.json scripts, configuration files
   - SSR/SSG: Next.js, Nuxt, SvelteKit, Remix, Gatsby, etc.

2. **Review configuration files:**
   - Bundler config (webpack.config.js, vite.config.ts, etc.)
   - Build optimization settings
   - Code splitting configuration
   - Asset optimization pipeline

3. **Analyze component structure:**
   - Identify heavy components or libraries
   - Check for dynamic imports and lazy loading
   - Review resource loading patterns

**Output:** Architectural understanding for targeted recommendations

### Phase 4: Recommendations

**Goal:** Provide actionable, framework-specific fixes

For each identified issue, provide:

1. **Problem description** - What the issue is and why it matters
2. **Impact assessment** - Metric affected and severity (High/Medium/Low)
3. **Recommended fix** - Specific code changes or configuration updates
4. **Framework-specific guidance** - Implementation details for the project's stack
5. **Expected improvement** - Estimated metric improvement
6. **Priority** - Critical/High/Medium/Low based on impact

**Implementation order:**
1. Critical issues blocking render or causing errors
2. High-impact quick wins (e.g., adding preload hints)
3. Medium-impact optimizations (e.g., code splitting)
4. Low-impact polish (e.g., minor accessibility improvements)

## Best Practices

### Working with Chrome DevTools MCP

- **Always reload when recording traces** - Use `reload: true` for consistent measurements
- **Wait for traces to complete** - Don't stop traces prematurely
- **Use Performance Insights** - These highlight the most important issues automatically
- **Check multiple page types** - Test homepage, content pages, and interactive flows
- **Consider device simulation** - Use CPU throttling for realistic mobile performance

### Analyzing Performance Data

- **Focus on user-centric metrics** - LCP and CLS have the most direct user impact
- **Look for patterns, not anomalies** - Single slow requests matter less than systemic issues
- **Consider the critical rendering path** - Resources needed for initial paint are highest priority
- **Balance metrics** - Optimizing one metric shouldn't harm others

### Making Recommendations

- **Be framework-aware** - Recommendations must fit the project's architecture
- **Prioritize implementation effort** - Quick wins first, major refactors later
- **Provide working examples** - Show exact code changes, not just concepts
- **Link to documentation** - Reference official docs for framework/tool features
- **Consider trade-offs** - Performance vs maintainability vs bundle size

## Performance Budgets

When assessing performance, use these general guidelines:

**Core Web Vitals (Target Scores):**
- **LCP (Largest Contentful Paint):** < 2.5s (Good), 2.5-4s (Needs Improvement), > 4s (Poor)
- **FID/TBT (Interactivity):** FID < 100ms, TBT < 200ms (Good)
- **CLS (Cumulative Layout Shift):** < 0.1 (Good), 0.1-0.25 (Needs Improvement), > 0.25 (Poor)
- **FCP (First Contentful Paint):** < 1.8s (Good), 1.8-3s (Needs Improvement), > 3s (Poor)
- **Speed Index:** < 3.4s (Good), 3.4-5.8s (Needs Improvement), > 5.8s (Poor)

**Resource Budgets:**
- **JavaScript (critical path):** < 150KB compressed
- **Total JavaScript:** < 500KB compressed (1.5MB uncompressed)
- **CSS (critical path):** < 50KB compressed
- **Total requests (initial load):** < 50
- **Time to Interactive:** < 3.5s on 4G, < 5s on 3G

## Common Issues & Quick Fixes

### Render-Blocking Resources
**Symptoms:** High FCP, delayed initial render
**Common Fixes:**
- Add `<link rel="preload">` for critical resources
- Inline critical CSS
- Defer or async non-critical JavaScript
- Use modern image formats (WebP, AVIF) with proper sizing

### Network Dependency Chains
**Symptoms:** Long waterfall in network panel
**Common Fixes:**
- Use `<link rel="preconnect">` for third-party origins
- Implement HTTP/2 Push (if applicable)
- Reduce redirect chains
- Parallelize independent requests

### Large JavaScript Bundles
**Symptoms:** High TBT, slow Time to Interactive
**Common Fixes:**
- Code splitting by route/component
- Remove unused dependencies
- Use dynamic imports for heavy features
- Enable tree-shaking in build config

### Layout Shifts
**Symptoms:** High CLS, visual instability
**Common Fixes:**
- Reserve space for images/ads with aspect-ratio or dimensions
- Avoid inserting content above existing content
- Use CSS transforms instead of layout properties for animations
- Preload fonts to avoid font flash

### Poor Caching
**Symptoms:** Repeated resource loads, slow return visits
**Common Fixes:**
- Set appropriate Cache-Control headers
- Use content hashing for static assets
- Implement service worker for offline support
- Enable compression (Brotli/Gzip)

## Reference Files

Load these as needed for deep analysis:

- **[reference/metrics.md](./reference/metrics.md)** - Core Web Vitals deep dive
- **[reference/network.md](./reference/network.md)** - Network optimization guide  
- **[reference/rendering.md](./reference/rendering.md)** - Rendering performance analysis
- **[reference/bundle.md](./reference/bundle.md)** - Bundle size optimization
- **[reference/accessibility.md](./reference/accessibility.md)** - Accessibility & performance

## Example Workflow

Here's a complete example of using this skill:

```
User: "Analyze the performance of my React app at localhost:3000"

1. Open or navigate to the page
2. Start performance trace with reload
3. Review Core Web Vitals and insights
4. List network requests to identify bottlenecks
5. Load relevant reference guides (e.g., metrics.md for LCP issues)
6. Analyze codebase to understand React/bundler setup
7. Provide prioritized recommendations with code examples
```

**Remember:** Always start with Phase 1 (baseline assessment) before diving into specific optimizations. Understand the full picture before making changes.
