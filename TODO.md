# Astro 6 Migration - Issues & Status

All issues found during visual comparison of `feature/astro-6-migration` against production (`https://code.charliegleason.com`).

## All items resolved ✓

---

---

## ~~Fixed this session~~

### ~~Post page blank (critical)~~
~~Two React instances in SSR — `use-scramble` bundles its own CJS React copy (`chunk-S73QDKPN.js`). When `NavMenuItem`, `ThemeToggle`, and `VideoMasthead` called `useState`, they got the wrong React instance, causing `Cannot read properties of null (reading 'useState')` and silently cutting off the SSR stream mid-render.~~

~~**Fix:** Added `resolve.dedupe` for React packages to `astro.config.mjs` so all modules share one React instance.~~

~~Also removed stale `ssr.noExternal` and `optimizeDeps` workarounds that weren't solving the root cause.~~

~~File: `astro.config.mjs`~~

---

### ~~Social grid page had debug UI chrome~~
~~`/[slug]/social` was rendering a "Social Grid" heading, breadcrumb, and instruction text that doesn't exist on production. Production renders only the 3-col grid of OG cards.~~

~~**Fix:** Rewrote `social.astro` to match the original `social-grid.tsx` — grid only, no extra chrome, no `aspect-square`/`max-w` constraints, no counter overlay.~~

~~File: `src/pages/[slug]/social.astro`~~

---

- ~~OG image generation (`/[slug]/social`)~~
- ~~Visual index pages (`/[slug]/[index]`)~~ — these redirect to post page, which now works
- ~~RSS feed output~~ — added `content:encoded`, `atom:link`, `lastBuildDate`, no trailing slashes
- ~~Navigation/view transitions~~ — verified: home→post→home, nav morphs correctly, no console errors

---

## ~~Fixed in this session~~

### ~~NavMenuItem blank text (critical)~~
~~Astro doesn't serialize React `children` passed between component tags into `astro-island` hydration props. `NavMenuItem` was receiving `children` as a slot but the text never made it to the hydrated component, leaving "Home" and "About" blank in the nav.~~

~~**Fix:** Changed `children: string` prop to `label: string` and passed it as an explicit attribute (`label="Home"`), which Astro serializes correctly.~~

~~Also removed the `mounted ? children : ""` guard on the `useScramble` text — `playOnMount: false` means it won't auto-animate, so there's no blank flash. The `ref` is now always attached.~~

~~Files: `src/components/NavMenuItem.tsx`, `src/layouts/Layout.astro`~~

---

### ~~Dark mode code blocks showing light theme (critical)~~
~~Shiki's dual-theme renderer sets `background-color` and `color` as inline styles directly on `<pre>` and `<span>` elements. CSS class rules (even with higher specificity) can't override inline styles without `!important`.~~

~~Removing `!important` (per PR #29 Copilot suggestion) broke dark mode code blocks — the light theme inline style won.~~

~~**Fix:** Restored `!important` on the dark mode Shiki rules in `global.css`, with a comment explaining why.~~

~~File: `src/styles/global.css`~~

---

### ~~Sandpack/LiveCodeBlock failing to hydrate (critical)~~
~~The `~` path alias (`~/components/LiveCodeBlock`) is defined in `tsconfig.json` but wasn't configured in Vite. At runtime, Astro generates `component-url="/@id/~/components/LiveCodeBlock"` for the island, which Vite couldn't resolve — returning 404 and failing hydration entirely. The Sandpack live editor showed a loading skeleton permanently.~~

~~**Fix:** Added `resolve.alias` for `~` in `astro.config.mjs`.~~

~~File: `astro.config.mjs`~~

---

### ~~extractModelName showing full author/model path (minor)~~
~~`VideoMasthead.tsx` had a different regex than the original (`~/utils/replicate.ts`). It was capturing `jakedahn/flux-latentpop` instead of just `flux-latentpop`.~~

~~**Fix:** Corrected the regex to match the original behavior.~~

~~File: `src/components/VideoMasthead.tsx`~~

---

## ~~Previously fixed (commit fa7f116, PR #28)~~

- ~~`Picture.astro` - slot/image rendering~~
- ~~`EditOnGitHub.astro` - link rendering~~
- ~~`api/kudos.ts` - request handling~~
- ~~`api/theme-switch.ts` - cookie setting~~
- ~~`rss.xml.ts` - feed generation~~
- ~~`[slug]/social.astro` - OG image event delegation~~
- ~~`[slug].png.ts` - OG image route~~
- ~~`og-image.ts` - PostNotFoundError + font caching~~
- ~~`scripts/generate-images.ts` / `generate-videos.ts` - asset generation~~
- ~~`scripts/replicate.ts` - extractModelName deduped~~

## ~~Previously fixed (CSS, post PR #29 review)~~

- ~~`global.css` - removed `!important` from light mode Shiki (note: dark mode `!important` was deliberately restored above), added `background-color` + `.astro-code` selectors, added `.astro-code:focus-visible`~~
- ~~`NavBlock.astro` - fixed TypeScript error (`this` → `e.currentTarget` in click handler)~~
