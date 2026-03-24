# Code styling parity with main branch

**Status: COMPLETED**

Fixes identified gaps between the Astro 6 migration (feature branch) and the live site (main branch) for code snippet and Sandpack styling.

## Context

The live site at code.charliegleason.com runs the main branch (React Router/Remix). The feature/astro-6-migration branch is a full rewrite. During review, several code-related styling gaps were identified.

## What was done

### 1. Wrap code blocks in `.code` container (rehype plugin)

**Files:** `src/utils/rehype-code-wrapper.ts` (new), `astro.config.mjs`

Created a rehype plugin that wraps all `<pre>` elements in `<div class="not-prose code">`. This provides:
- Background color (`bg-gray-50` / `dark:bg-gray-900/50`)
- Borders
- Horizontal scroll
- Negative margins for full-bleed effect

### 2. Add vertical padding to code blocks via CSS

**Files:** `src/styles/global.css`

Added `.code > pre { @apply py-4; }` to provide consistent vertical padding matching main branch.

### 3. Fix Shiki background colors

**Files:** `src/styles/global.css`

Changed Shiki styling to use `background-color: transparent !important` in BOTH light and dark mode. Shiki sets inline `background-color` styles that override our `.code` wrapper background. The `!important` is necessary to override these inline styles.

### 3b. Fix Sandpack CSS injection

**Files:** `src/components/LiveCodeBlock.tsx`

Moved Sandpack CSS injection from inline `<style>` tag to programmatic injection via `document.head.appendChild()`. This prevents the CSS text from rendering as visible content during React hydration (similar to how main branch uses `<ClientOnly>` wrapper).

### 4. Style inline code via CSS (not MDX component)

**Files:** `src/styles/global.css`

Added `:not(pre) > code` selector for inline code styling instead of using an MDX component override. This prevents the InlineCode styles from being applied to `<code>` elements inside `<pre>` blocks.

### 5. Use composed `.post` class

**Files:** `src/pages/[slug]/index.astro`

Changed from manually specifying prose classes to using the composed `.post` utility class.

## Files changed

- `src/utils/rehype-code-wrapper.ts` (new) - rehype plugin to wrap code blocks
- `src/styles/global.css` - inline code styling, Shiki fixes, code block padding
- `src/pages/[slug]/index.astro` - use `.post` class, remove InlineCode import
- `src/components/LiveCodeBlock.tsx` - wrap in `.code` div, fix CSS injection
- `astro.config.mjs` - add rehype plugin
- `package.json` - add `unist-util-visit` dependency

## Verification

Visually compared in Chrome DevTools:
- Local: http://localhost:4321/paper-design-shaders  
- Live: https://code.charliegleason.com/paper-design-shaders

Both show:
- Clean, uniform backgrounds on code blocks (no per-line highlighting)
- Proper vertical padding
- Correct syntax highlighting colors
- Sandpack live editor working correctly
