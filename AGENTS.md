# Project Context for Claude

This is a personal code blog built with React Router 7 and deployed on Cloudflare Workers. The project features MDX content, AI-generated visuals, live code examples, and a sophisticated theme system.

## Tech Stack

- **Framework**: React Router 7 with SSR
- **Runtime**: Cloudflare Workers (edge computing)
- **Content**: MDX with React components
- **Styling**: Tailwind CSS v4
- **Code Highlighting**: Shiki (WASM-based, server-side)
- **Interactive Code**: Sandpack (CodeSandbox)
- **AI Visuals**: Replicate API
- **Testing**: Vitest with happy-dom
- **Build**: Vite with custom plugins
- **Linting**: Biome

## Managing AI-Generated Planning Documents

AI assistants often create planning and design documents during development:
- PLAN.md, IMPLEMENTATION.md, ARCHITECTURE.md
- DESIGN.md, CODEBASE_SUMMARY.md, INTEGRATION_PLAN.md
- TESTING_GUIDE.md, TECHNICAL_DESIGN.md, and similar files

**Best Practice: Use a dedicated directory for these ephemeral files**

- Create a `history/` directory in the project root
- Store ALL AI-generated planning/design docs in `history/`
- Keep the repository root clean and focused on permanent project files
- Only access `history/` when explicitly asked to review past planning

## Directory Structure

```
/app                    # Main application code
  /components          # Reusable React components
  /routes              # React Router route modules
  /utils               # Utility functions
/posts                 # MDX blog content (YYYY-MM-DD.slug.mdx)
/scripts               # Build-time scripts for assets
  generate-images.ts   # AI image generation via Replicate
  generate-videos.ts   # AI video generation and optimization
  generate-colors.ts   # Extract colors from generated visuals
  upload-assets.sh     # Upload optimized assets to R2
/workers               # Cloudflare Workers entry point
/public                # Static assets (fonts, generated visuals)
/lib                   # Shared utilities
  mdx-plugin.ts        # Custom Vite plugin for MDX route generation
```

## Architecture

### Routing System

**Dynamic Route Generation:**
- Custom Vite plugin (`lib/mdx-plugin.ts`) scans `/posts` directory
- Generates virtual module `virtual:mdx-manifest` at build time
- Creates routes like `/hello-world` from `2024-05-17.hello-world.mdx`
- Date automatically extracted from filename pattern

**Special Routes:**
- `/:slug` - Blog post pages
- `/:slug/:index` - Indexed visual variations (1-21)
- `/:slug.png` - Dynamic OG images (Satori)
- `/:slug.json` - Post metadata API
- `/theme-switch` - Theme toggle resource route
- `/kudos` - Likes system (Durable Objects)
- `/rss` - RSS feed generation

**Cookie-Based Visual Routing:**
- Index page (`/:slug/:index`) sets `en_currentVisual` cookie
- Post page reads cookie for consistent visual across session
- Cookie deleted after read for fresh random on next visit
- Enables shareable visual URLs while maintaining UX

### SSR Setup

- Server-side rendering via Cloudflare Workers
- Code highlighting happens server-side (Shiki WASM)
- Theme detected via client hints before first paint
- No flash of unstyled content (FOUC)

## MDX Content System

### File Naming Convention

**Pattern:** `YYYY-MM-DD.slug.mdx`

Example: `2024-05-17.hello-world.mdx` creates `/hello-world` route with date May 17, 2024

### Frontmatter Schema

```yaml
slug: hello-world              # URL slug (extracted from filename if omitted)
title: Post Title              # Display title
description: Description text  # Meta description and social card
visual:                        # AI-generated visuals configuration
  prompt: "AI generation prompt"
  image:
    url: replicate/model-name
    version: abc123...         # Model version hash
    guidance: 7.5              # Optional guidance scale
  video:
    url: replicate/video-model
    version: xyz789...
  colors:                      # Generated color pairs (text, background)
    - ["#e5e5e5", "#1a1a1a"]
    - ["#2a2a2a", "#f0f0f0"]
data:                          # Optional key-value pairs for post
  Key: Value
links:                         # Optional related links
  Link Name: https://example.com
```

### MDX Components Available

- `<CodeBlock>` - Syntax-highlighted code with copy button
- `<Command>` - Terminal command display
- `<Picture>` - Optimized image with lazy loading
- `<Visual>` - AI-generated visual display
- `<YouTube>` - Embedded YouTube player
- `<SandpackCodeEditor>` - Live, editable code with preview

### Processing Pipeline

1. **Build Time:**
   - Glob finds all `.mdx` files in `/posts`
   - Gray-matter parses frontmatter + content
   - Virtual module created with manifest
   - Shiki highlights code blocks server-side

2. **Runtime:**
   - `mdx-runtime.ts` loads manifest for SSR
   - Custom MDX component evaluates content
   - Pre-highlighted HTML passed to client (no hydration mismatch)

## AI Visual Generation

### Image Generation (`pnpm generate:images`)

**Process:**
1. Reads Replicate model from post frontmatter
2. Generates 21 variations per post (configurable)
3. Validates solid left edge (for OG image backgrounds)
4. Retry logic (max 10 attempts) if validation fails
5. Optimizes PNGs with Sharp
6. Saves to `/public/posts/{slug}/{index}.png`

**Validation:**
- Checks leftmost 20 pixels for color consistency
- Uses Euclidean distance in RGB space
- Threshold: d5 units perceptual difference

### Video Generation (`pnpm generate:videos`)

**Process:**
1. Uses first image (index 0) as source
2. Generates 3-second video at 480p (1:1 aspect)
3. Optimizes with FFmpeg:
   - Reverses video for continuous loop
   - Interpolates to 60fps for smoothness
   - Applies ease-in effect in last 0.5s
   - H.264 with fast-start for web streaming
4. Saves to `/public/posts/{slug}/visual.mp4`

**Note:** Videos removed from deployment bundle, served from R2

### Color Generation (`pnpm generate:colors`)

**Process:**
1. Analyzes edges of all generated images
2. Detects dominant colors (excluding edges)
3. Boosts contrast for text readability
4. Stores color pairs in frontmatter
5. Used for theme-aware visual display

### Asset Upload

**Script:** `scripts/upload-assets.sh`

- Optimizes PNGs with pngquant and oxipng
- Maintains cache file to skip unchanged assets
- Uploads to Cloudflare R2 bucket
- Separate buckets for production/staging
- Worker intercepts `/posts/**/*.{png,mp4}` to serve from R2

## Theme System

### Implementation

**Storage:** Cookie (`en_theme`)

**Modes:**
- `light` - Catppuccin Latte
- `dark` - Catppuccin Mocha
- `system` - Follows OS preference

**Detection:**
- Epic Web client-hints pattern
- Server detects theme before first paint
- No FOUC (flash of unstyled content)

**Updates:**
- Optimistic UI via fetcher
- Resource route at `/theme-switch`
- JavaScript-free fallback via form submission

### Styling

**Tailwind v4:**
- Custom theme tokens in `global.css` via `@theme` directive
- Typography plugin for prose content
- Custom breakpoints: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`

**Fonts:**
- Inter (sans-serif)
- Geist Mono (monospace)
- Preloaded for critical weights (400, 600)

**Color Scheme:**
- Catppuccin Latte (light mode)
- Catppuccin Mocha (dark mode)
- Consistent across Shiki, Sandpack, and UI

## Code Highlighting

### Server-Side (Shiki)

**Features:**
- WASM-based syntax highlighting
- Runs on Cloudflare Workers (edge)
- Catppuccin themes matching UI
- Pre-highlighted HTML passed to client

**Implementation:**
```typescript
// Highlight code server-side
const html = await highlightCode(code, language, theme);
// Pass HTML to client (no hydration mismatch)
```

### Interactive Blocks (Sandpack)

**Features:**
- Full CodeSandbox environment in browser
- Live preview with hot reload
- File system support
- Automatic dependency detection
- Template support (react, vanilla, etc.)

**Usage in MDX:**
```mdx
<SandpackCodeEditor
  template="react"
  files={{
    "/App.js": "...",
    "/styles.css": "..."
  }}
/>
```

## Testing

### Setup

**Framework:** Vitest with happy-dom

**Config:** `vitest.config.ts`
- Test pattern: `**/__tests__/**/*.{test,spec}.{ts,tsx}`
- Setup file: `vitest.setup.ts`
- Coverage: V8 provider

**Mocks:**
- `fetch` API (global)
- `window.matchMedia` (theme detection)
- `HTMLMediaElement` (video/audio)

### Conventions

**Location:** Co-located in `__tests__` directories

**Structure:**
```
app/
  components/
    __tests__/
      button.test.tsx
    button.tsx
  routes/
    __tests__/
      index.test.tsx
    index.tsx
```

**Running Tests:**
```bash
pnpm test              # Run once
pnpm test:watch    # Watch mode
pnpm test:ui       # Vitest UI
pnpm test:coverage # Coverage report
```

## Deployment

### Environments

**Production:**
- Domain: `code.charliegleason.com`
- Branch: `main`
- Trigger: Push to main

**Staging:**
- Domain: `staging.code.charliegleason.com`
- Branch: Any
- Trigger: Manual workflow dispatch

### Workflow (`.github/workflows/deploy.yml`)

1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Build React Router app (`pnpm build`)
3. Install PNG optimization tools (pngquant, oxipng)
4. Upload optimized assets to R2 (`upload-assets.sh`)
5. Remove videos from bundle (served from R2)
6. Deploy to Cloudflare Workers (`wrangler deploy`)

### Cloudflare Resources

**Workers:**
- SSR React Router app
- Request interception for R2 assets

**R2 Buckets:**
- `code-blog-assets` (production)
- `code-blog-assets-staging` (staging)

**Durable Objects:**
- `kudos` - Likes/reactions system
- State persisted at edge

**Assets:**
- Static files (fonts, etc.)
- Served via Workers Assets binding

### Manual Deployment

```bash
# Production
pnpm deploy

# Staging
pnpm deploy:staging
```

## Development Guidelines

### Starting Development

```bash
pnpm install           # Install dependencies
pnpm dev           # Start dev server (localhost:5173)
pnpm dev:staging   # Start with staging config
```

### Common Tasks

**Generate Visuals:**
```bash
pnpm generate:images      # Generate AI images
pnpm generate:videos      # Generate AI videos
pnpm generate:colors      # Extract colors
pnpm validate:images      # Check image validity
pnpm delete:invalid-images # Remove failed images
```

**Type Checking:**
```bash
pnpm typegen      # Generate Cloudflare types
pnpm typecheck    # Run TypeScript compiler
```

**Linting:**
```bash
pnpm lint         # Check code style
pnpm lint:fix     # Auto-fix issues
```

**Building:**
```bash
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm check        # Full check (types + build + dry-run)
```

### Adding a New Post

1. Create `/posts/YYYY-MM-DD.slug.mdx`
2. Add frontmatter (see schema above)
3. Write content with MDX components
4. Generate visuals: `pnpm generate:images`
5. Generate videos: `pnpm generate:videos`
6. Extract colors: `pnpm generate:colors`
7. Test locally: `pnpm dev`
8. Deploy: `pnpm deploy`

### Adding a New Component

**Location:** `/app/components/{name}.tsx`

**Test:** `/app/components/__tests__/{name}.test.tsx`

**Import in MDX:**
```typescript
// app/utils/mdx-runtime.ts
import { NewComponent } from '~/components/new-component';

// Add to scope
scope: {
  NewComponent,
  // ... other components
}
```

### Adding a New Route

**Location:** `/app/routes/{name}.tsx`

**Pattern:**
```typescript
import type { Route } from "./+types/{name}";

export async function loader({ request }: Route.LoaderArgs) {
  // Load data
}

export default function Component() {
  // Render route
}
```

**Test:** `/app/routes/__tests__/{name}.test.tsx`

## Key Patterns & Gotchas

### Virtual Module System

**Why:** Dynamic route generation from MDX files at build time

**How:**
- Custom Vite plugin scans `/posts` directory
- Creates virtual module: `virtual:mdx-manifest`
- Module contains parsed frontmatter + metadata
- Loaded by both client and server

**Gotcha:** Changes to MDX frontmatter require dev server restart

### Cookie-Based Visual Routing

**Flow:**
1. User visits `/hello-world/15`
2. Route sets cookie: `en_currentVisual=14` (0-indexed)
3. Redirects to `/hello-world`
4. Post page reads cookie for visual index
5. Cookie deleted after read

**Why:** Shareable visual URLs + consistent UX

**Gotcha:** Cookie must be deleted after read or same visual will persist

### Asset Separation

**Pattern:**
- Videos stored in R2 (not in Worker bundle)
- Worker intercepts `/posts/**/*.mp4` requests
- Fetches from R2 and returns response

**Why:**
- Worker bundle size limits (1MB compressed)
- Faster deployments (no large assets)
- Better caching at edge

**Gotcha:** Videos must be uploaded to R2 before deployment

### Fingerprinting for Kudos

**Pattern:**
```typescript
const fingerprint = `${serverId}:${clientId}`;
```

**Why:**
- Prevent spam/abuse of likes
- Privacy-preserving (no personal data)
- Works without authentication

**Components:**
- `serverId`: Hashed IP + user agent
- `clientId`: Browser localStorage ID

**Gotcha:** Clearing localStorage resets client ID

### Edge Color Validation

**Process:**
1. Generate image with Replicate
2. Check leftmost 20 pixels for consistency
3. If inconsistent, retry (max 10 attempts)
4. Ensures solid color for OG image backgrounds

**Why:** OG images overlay text on left side

**Gotcha:** Some models/prompts may never produce valid edges

### Hydration-Safe Code Highlighting

**Pattern:**
```typescript
// Server: Pre-highlight code
const html = await highlighter.highlight(code);

// Client: Receive HTML string
<div dangerouslySetInnerHTML={{ __html: html }} />
```

**Why:** Shiki WASM is slow on client, causes hydration mismatch

**Gotcha:** Code blocks must be highlighted server-side only

### File Naming Conventions

**Posts:** `YYYY-MM-DD.slug.mdx`
- Date extracted automatically
- Slug becomes URL path
- Chronological sorting by filename

**Visuals:** `{slug}/{index}.{png,mp4}`
- Index: 0-20 (internal), 1-21 (user-facing)
- PNG for images, MP4 for videos

**Tests:** `{name}.test.{ts,tsx}` in `__tests__/`
- Co-located with source files
- Mirrors directory structure

### Theme Consistency

**Challenge:** Matching themes across Shiki, Sandpack, and UI

**Solution:**
- All use Catppuccin color schemes
- Shiki: `catppuccin-latte` / `catppuccin-mocha`
- Sandpack: Custom themes with Catppuccin colors
- UI: Tailwind with Catppuccin palette

**Gotcha:** Theme changes require updating multiple configs

## Useful Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm dev:staging            # Dev with staging config

# Building
pnpm build                  # Production build
pnpm build:staging          # Staging build
pnpm preview                # Preview prod build

# Testing
pnpm test                       # Run tests
pnpm test:watch             # Watch mode
pnpm test:ui                # Vitest UI
pnpm test:coverage          # Coverage report

# Type Checking
pnpm typegen                # Generate types
pnpm typecheck              # Check types

# Linting
pnpm lint                   # Check style
pnpm lint:fix               # Fix style issues

# Visuals
pnpm generate:images        # Generate images
pnpm generate:videos        # Generate videos
pnpm generate:colors        # Extract colors
pnpm validate:images        # Validate images
pnpm delete:invalid-images  # Remove invalid

# Deployment
pnpm deploy                 # Deploy production
pnpm deploy:staging         # Deploy staging
pnpm upload:assets:production   # Upload to R2 (prod)
pnpm upload:assets:staging      # Upload to R2 (staging)

# Utilities
pnpm check                  # Full check (types + build)
```

## Environment Variables

**Required for Visuals:**
- `REPLICATE_API_TOKEN` - Replicate API key

**Required for Deployment:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

**Optional:**
- `CLOUDFLARE_ENV` - Environment (`staging` or omit for production)
- `VISUAL_COUNT` - Number of visuals to generate (default: 21)

## Troubleshooting

**Visual generation fails:**
- Check `REPLICATE_API_TOKEN` is set
- Verify model URL and version in frontmatter
- Check edge color validation (may need different prompt)

**Hydration mismatch:**
- Ensure code highlighting happens server-side only
- Check theme is detected before first paint
- Verify no client-only data in SSR

**Deployment fails:**
- Check Worker bundle size (<1MB compressed)
- Verify R2 asset upload completed
- Check Wrangler config and secrets

**Videos not loading:**
- Verify uploaded to R2 bucket
- Check Worker route intercepts `/posts/**/*.mp4`
- Verify R2 binding in `wrangler.json`

**Theme not persisting:**
- Check `en_theme` cookie is set
- Verify client hints middleware
- Check theme resource route `/theme-switch`

# IMPORTANT

🚨 Never commit or push code unless specifically asked, especially to `main`. 🚨
