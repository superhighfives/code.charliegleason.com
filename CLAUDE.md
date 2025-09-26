# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Runs Remix Vite dev server
- **External access**: `npm run dev-external` - Runs dev server accessible from external devices
- **Build**: `npm run build` - Builds the app and copies WASM files for og:image generation
- **Preview**: `npm run preview` - Builds and runs Wrangler Pages dev server
- **Local production**: `npm run start` - Serves built app with Wrangler Pages
- **Deploy**: `npm run deploy` - Builds and deploys to Cloudflare Pages
- **Linting**: `npm run lint` - Runs Biome
- **Type checking**: `npm run typecheck` - Runs TypeScript compiler
- **Type generation**: `npm run typegen` or `npm run cf-typegen` - Generates Cloudflare bindings types from wrangler.toml

## Architecture Overview

This is a **Remix application** deployed on **Cloudflare Pages** with the following key characteristics:

### Core Stack

- **Framework**: Remix with Vite bundler
- **Runtime**: Cloudflare Workers/Pages Functions
- **Styling**: Tailwind CSS with typography plugin
- **Content**: MDX-based blog posts and pages
- **OG Images**: Generated using Satori with WASM workers

### Key Directories

- `app/routes/` - File-based routing with MDX blog posts (pattern: `_post._YYYY-MM-DD.slug.mdx`)
- `app/components/` - Reusable React components
- `app/.server/` - Server-side utilities (posts processing, image generation)
- `functions/` - Cloudflare Pages Functions
- `public/` - Static assets
- `build/` - Built application output

### Content Architecture

- Blog posts are MDX files in `app/routes/` following the pattern `_post._YYYY-MM-DD.slug.mdx`
- Posts have frontmatter metadata and are processed server-side in `app/.server/posts.tsx`
- The `_post.tsx` layout handles post rendering and metadata
- About page and other content pages use the same MDX pattern

### Special Features

- **OG Image Generation**: Uses Satori with WASM workers via `vite-plugin-wasm-module-workers`
- **WASM Handling**: Build process copies WASM files from client to server build (`build/client/assets/*.wasm` → `build/server/assets`)
- **MDX Processing**: Configured with GitHub alerts, syntax highlighting, and frontmatter support
- **Cloudflare Integration**: Configured for Pages deployment with optional bindings (D1, KV, R2, etc.)

### Development Notes

- Run `npm run typegen` after modifying `wrangler.toml` to update Cloudflare bindings types
- The app uses Cloudflare-specific runtime APIs and deployment patterns
- WASM files are required for og:image generation and must be properly copied during build
