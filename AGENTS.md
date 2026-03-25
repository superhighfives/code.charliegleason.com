# Project Context

This is a personal code blog built with Astro 6 and deployed on Cloudflare Workers. The project features MDX content, AI-generated visuals, live code examples, and a theme system.

## Tech Stack

- **Framework**: Astro 6 with SSR
- **Runtime**: Cloudflare Workers (edge computing)
- **Content**: MDX with React components (content collections)
- **Styling**: Tailwind CSS v4
- **Code Highlighting**: Shiki (built into Astro)
- **Interactive Code**: Sandpack (CodeSandbox)
- **AI Visuals**: Replicate API
- **Testing**: Vitest with happy-dom
- **Build**: Astro with Vite
- **Linting**: Biome

## Directory Structure

```
/src
  /components        # Astro and React components
  /content           # Content collections
    /posts           # MDX blog posts (YYYY-MM-DD.slug.mdx)
  /layouts           # Page layouts
  /pages             # Astro pages and API routes
  /styles            # Global CSS
  /utils             # Utility functions
  /workers           # Cloudflare Workers utilities
/scripts             # Build-time scripts for assets
  generate-images.ts # AI image generation via Replicate
  generate-videos.ts # AI video generation and optimization
  generate-colors.ts # Extract colors from generated visuals
  upload-assets.sh   # Upload optimized assets to R2
/public              # Static assets (fonts, generated visuals)
```

## Architecture

### Content Collections

Astro's content collections provide type-safe content management:

- Posts defined in `src/content/posts/`
- Schema defined in `src/content.config.ts`
- Accessed via `getCollection('posts')` API

### Routing System

**File-based routing in `/src/pages/`:**
- `[slug]/index.astro` - Blog post pages
- `[slug]/[index].astro` - Visual variation pages
- `[slug]/social.astro` - Dynamic OG images
- `rss.xml.ts` - RSS feed
- `about/index.astro` - About page

**Cookie-Based Visual Routing:**
- Index page (`/[slug]/[index]`) sets `en_currentVisual` cookie
- Post page reads cookie for consistent visual across session
- Enables shareable visual URLs while maintaining UX

### SSR Setup

- Server-side rendering via Cloudflare Workers
- Code highlighting via Shiki (built into Astro)
- Theme detected via cookies

## MDX Content System

### File Naming Convention

**Pattern:** `YYYY-MM-DD.slug.mdx`

Example: `2024-05-17.hello-world.mdx` creates `/hello-world` route with date May 17, 2024

### Frontmatter Schema

```yaml
slug: hello-world              # URL slug
title: Post Title              # Display title
description: Description text  # Meta description
visual:                        # AI-generated visuals configuration
  prompt: "AI generation prompt"
  image:
    url: replicate/model-name
    version: abc123...
    guidance: 7.5              # Optional
  video:
    url: replicate/video-model
    version: xyz789...
  colors:                      # Generated color pairs (text, background)
    - text: "#e5e5e5"
      background: "#1a1a1a"
data:                          # Optional key-value pairs
  Key: Value
links:                         # Optional related links
  Link Name: https://example.com
```

### MDX Components Available

Components are imported in MDX files as needed:
- `CodeBlock` - Syntax-highlighted code with copy button
- `Command` - Terminal command display
- `Picture` - Optimized image with lazy loading
- `Visual` - AI-generated visual display
- `YouTube` - Embedded YouTube player
- `SandpackCodeEditor` - Live, editable code with preview

## AI Visual Generation

### Image Generation (`npm run generate:images`)

1. Reads Replicate model from post frontmatter
2. Generates 9 variations per post
3. Validates solid left edge (for OG image backgrounds)
4. Retry logic (max 10 attempts) if validation fails
5. Optimizes PNGs with Sharp
6. Saves to `/public/posts/{slug}/{index}.png`

### Video Generation (`npm run generate:videos`)

1. Uses each image as source
2. Generates 3-second video at 480p (1:1 aspect)
3. Optimizes with FFmpeg
4. Saves to `/public/posts/{slug}/{index}.mp4`

**Note:** Videos removed from deployment bundle, served from R2

### Color Generation (`npm run generate:colors`)

1. Analyzes edges of all generated images
2. Detects dominant colors (excluding edges)
3. Boosts contrast for text readability
4. Stores color pairs in frontmatter

### Asset Upload

**Script:** `scripts/upload-assets.sh`

- Optimizes PNGs with pngquant and oxipng
- Maintains cache file to skip unchanged assets
- Uploads to Cloudflare R2 bucket
- Separate buckets for production/staging

## Theme System

**Storage:** Cookie (`en_theme`)

**Modes:**
- `light` - Catppuccin Latte
- `dark` - Catppuccin Mocha
- `system` - Follows OS preference

**Styling:**
- Tailwind v4 with custom theme tokens
- Typography plugin for prose content
- Catppuccin color scheme throughout

## Testing

**Framework:** Vitest with happy-dom

**Running Tests:**
```bash
npm test              # Run once
npm run test:watch    # Watch mode
```

## Deployment

### Environments

**Production:**
- Domain: `code.charliegleason.com`
- Branch: `main`
- Trigger: Push to main

**Staging:**
- Trigger: Manual workflow dispatch

### Workflow

1. Install dependencies (`npm ci`)
2. Build Astro app (`npm run build`)
3. Install PNG optimization tools
4. Upload optimized assets to R2
5. Remove videos from bundle
6. Deploy to Cloudflare Workers

### Manual Deployment

```bash
npm run deploy          # Production
npm run deploy:staging  # Staging
```

## Development

### Starting Development

```bash
npm install    # Install dependencies
npm run dev    # Start dev server (localhost:4321)
```

### Common Tasks

**Generate Visuals:**
```bash
npm run generate:images   # Generate AI images
npm run generate:videos   # Generate AI videos
npm run generate:colors   # Extract colors
```

**Quality Checks:**
```bash
npm run typecheck    # Type checking
npm run lint         # Check code style
npm run lint:fix     # Auto-fix issues
npm test             # Run tests
```

**Building:**
```bash
npm run build     # Production build
npm run preview   # Preview production build
```

### Adding a New Post

1. Create `src/content/posts/YYYY-MM-DD.slug.mdx`
2. Add frontmatter (see schema above)
3. Write content with MDX components
4. Generate visuals: `npm run generate:images`
5. Generate videos: `npm run generate:videos`
6. Extract colors: `npm run generate:colors`
7. Test locally: `npm run dev`
8. Deploy: `npm run deploy`

### Adding a New Component

**Location:** `src/components/{name}.tsx` or `src/components/{name}.astro`

**Usage in MDX:**
```mdx
import { NewComponent } from '../components/new-component';

<NewComponent />
```

### Adding a New Route

**Location:** `src/pages/{path}.astro`

Astro pages can be `.astro` files or `.ts` files for API endpoints.

## Environment Variables

**Required for Visuals:**
- `REPLICATE_API_TOKEN` - Replicate API key

**Required for Deployment:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

**Optional:**
- `CLOUDFLARE_ENV` - Environment (`staging` or omit for production)

## Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build            # Production build
npm run build:staging    # Staging build
npm run preview          # Preview build

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode

# Type Checking & Linting
npm run typecheck        # Check types
npm run lint             # Check style
npm run lint:fix         # Fix issues

# Visuals
npm run generate:images  # Generate images
npm run generate:videos  # Generate videos
npm run generate:colors  # Extract colors

# Deployment
npm run deploy           # Deploy production
npm run deploy:staging   # Deploy staging
```

## Troubleshooting

**Visual generation fails:**
- Check `REPLICATE_API_TOKEN` is set
- Verify model URL and version in frontmatter

**Deployment fails:**
- Check Worker bundle size
- Verify R2 asset upload completed
- Check Wrangler config

**Videos not loading:**
- Verify uploaded to R2 bucket
- Check R2 binding in `wrangler.json`

# IMPORTANT

Never commit or push code unless specifically asked, especially to `main`.
