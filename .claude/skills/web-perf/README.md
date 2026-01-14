# Web Performance Analysis Skill

A comprehensive skill for analyzing and optimizing web performance using the Chrome DevTools MCP server.

## Overview

This skill provides deep expertise in:
- **Core Web Vitals** - LCP, FCP, TBT, CLS, Speed Index analysis
- **Network Optimization** - Render-blocking resources, dependency chains, caching
- **Rendering Performance** - Layout shifts, paint operations, compositing
- **Bundle Optimization** - Code splitting, tree-shaking, removing unused code
- **Accessibility** - Contrast ratios, ARIA attributes, focus management

## Skill Structure

The skill uses **progressive disclosure** to keep context efficient:

```
web-perf/
├── SKILL.md              # Main skill (core workflow + overview)
└── reference/            # Deep-dive guides (loaded on demand)
    ├── metrics.md        # Core Web Vitals deep analysis
    ├── network.md        # Network waterfall optimization
    ├── rendering.md      # Layout shifts & rendering performance
    ├── bundle.md         # JavaScript/CSS bundle optimization
    └── accessibility.md  # Accessibility & performance
```

## How It Works

### Phase 1: Baseline Assessment
The skill starts with Chrome DevTools performance tracing:
1. Record performance trace with page reload
2. Analyze Core Web Vitals scores
3. Review network requests and timing
4. Check console for errors

### Phase 2: Deep Dive Analysis
Based on findings, the skill loads specific reference guides:
- **Poor LCP/FCP/TBT?** → Load `metrics.md`
- **Render-blocking resources?** → Load `network.md`
- **High CLS?** → Load `rendering.md`
- **Large bundles?** → Load `bundle.md`
- **Accessibility issues?** → Load `accessibility.md`

### Phase 3: Codebase Analysis
The skill analyzes the project architecture:
- Identifies framework (React, Vue, Remix, etc.)
- Reviews bundler configuration (Webpack, Vite, etc.)
- Examines build optimization settings
- Checks for SSR/SSG setup

### Phase 4: Recommendations
Provides prioritized, actionable fixes:
- Framework-specific code examples
- Configuration changes
- Expected metric improvements
- Implementation priority (Critical → High → Medium → Low)

## Requirements

### Chrome DevTools MCP Server
This skill requires the `chrome-devtools` MCP server to be installed and configured.

**Key tools used:**
- `chrome-devtools_performance_start_trace` - Record performance metrics
- `chrome-devtools_performance_analyze_insight` - Deep dive into specific issues
- `chrome-devtools_list_network_requests` - Network waterfall analysis
- `chrome-devtools_list_console_messages` - Error detection
- `chrome-devtools_take_snapshot` - DOM structure analysis

## Usage Examples

### Basic Usage
```
User: "Analyze the performance of my site at localhost:3000"

1. Navigates to localhost:3000
2. Starts performance trace with reload
3. Reviews Core Web Vitals (LCP: 3.2s, CLS: 0.15)
4. Identifies issues: slow LCP, moderate CLS
5. Loads metrics.md for LCP analysis
6. Loads rendering.md for CLS analysis
7. Analyzes React + Vite setup
8. Provides prioritized recommendations with code examples
```

### Focused Analysis
```
User: "Why is my LCP so slow?"

1. Runs performance trace
2. Loads metrics.md for LCP deep dive
3. Analyzes LCP element and blocking resources
4. Checks network timing for LCP image
5. Reviews framework image optimization settings
6. Provides specific fixes (preload, fetchpriority, etc.)
```

### Bundle Analysis
```
User: "My JavaScript bundle is 2MB. Help me optimize it."

1. Loads bundle.md reference
2. Guides through bundle analysis tool setup
3. Identifies large dependencies
4. Recommends code-splitting strategies
5. Shows framework-specific dynamic imports
6. Provides tree-shaking configuration
```

## Framework Support

The skill provides specific guidance for:
- **React** - Next.js, Create React App, Vite
- **Vue** - Nuxt, Vite
- **Svelte** - SvelteKit
- **Remix** - All rendering modes
- **Astro** - Static & SSR
- **Vanilla** - Plain HTML/JS with build tools

## Performance Budgets

The skill uses these target metrics:

**Core Web Vitals:**
- LCP: < 2.5s (Good)
- FCP: < 1.8s (Good)
- TBT: < 200ms (Good)
- CLS: < 0.1 (Good)
- Speed Index: < 3.4s (Good)

**Resource Budgets:**
- Critical JavaScript: < 150KB compressed
- Total JavaScript: < 500KB compressed
- Critical CSS: < 50KB compressed
- Initial requests: < 50

## Best Practices

### When Using This Skill

1. **Start with baseline** - Always run Phase 1 assessment first
2. **Load references selectively** - Don't load all reference files at once
3. **Focus on user impact** - Prioritize LCP and CLS over other metrics
4. **Be framework-aware** - Recommendations must fit the project's stack
5. **Provide working code** - Show exact implementations, not just concepts

### What to Avoid

- ❌ Don't guess at issues without running performance trace
- ❌ Don't load all reference files upfront (wastes context)
- ❌ Don't provide generic advice (be framework-specific)
- ❌ Don't ignore trade-offs (performance vs maintainability)
- ❌ Don't skip codebase analysis (need architecture understanding)

## Common Issues Solved

### Render-Blocking Resources
- Identifies blocking CSS/JS
- Recommends preload/async strategies
- Shows inlining techniques

### Network Dependency Chains
- Detects waterfall patterns
- Suggests preconnect hints
- Implements resource prioritization

### Large JavaScript Bundles
- Analyzes bundle composition
- Implements code splitting
- Removes unused dependencies

### Layout Shifts
- Identifies shifting elements
- Reserves space for dynamic content
- Optimizes font loading

### Poor Caching
- Configures Cache-Control headers
- Implements service workers
- Sets up CDN caching

## Related Documentation

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [MDN Web Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)

## License

Apache-2.0

## Contributing

This skill is part of the project's `.claude/skills/` directory. Improvements welcome via pull request.

## Changelog

### v1.0.0 (Initial Release)
- Comprehensive Core Web Vitals analysis
- Network waterfall optimization
- Rendering performance analysis  
- Bundle size optimization
- Accessibility integration
- Progressive disclosure structure
- Framework-specific recommendations
