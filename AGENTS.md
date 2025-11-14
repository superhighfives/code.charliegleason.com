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

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**
```bash
bd ready --json
```

**Create new issues:**
```bash
bd create "Issue title" -t bug|feature|task -p 0-4 --json
bd create "Issue title" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**
```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**
```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`
6. **Commit together**: Always commit the `.beads/issues.jsonl` file together with the code changes so issue state stays in sync with code state

### Auto-Sync

bd automatically syncs with git:
- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### MCP Server (Recommended)

If using Claude or MCP-compatible clients, install the beads MCP server:

```bash
pip install beads-mcp
```

Add to MCP config (e.g., `~/.config/claude/config.json`):
```json
{
  "beads": {
    "command": "beads-mcp",
    "args": []
  }
}
```

Then use `mcp__beads__*` functions instead of CLI commands.

### Managing AI-Generated Planning Documents

AI assistants often create planning and design documents during development:
- PLAN.md, IMPLEMENTATION.md, ARCHITECTURE.md
- DESIGN.md, CODEBASE_SUMMARY.md, INTEGRATION_PLAN.md
- TESTING_GUIDE.md, TECHNICAL_DESIGN.md, and similar files

**Best Practice: Use a dedicated directory for these ephemeral files**

**Recommended approach:**
- Create a `history/` directory in the project root
- Store ALL AI-generated planning/design docs in `history/`
- Keep the repository root clean and focused on permanent project files
- Only access `history/` when explicitly asked to review past planning

**Example .gitignore entry (optional):**
```
# AI planning documents (ephemeral)
history/
```

**Benefits:**
- ✅ Clean repository root
- ✅ Clear separation between ephemeral and permanent documentation
- ✅ Easy to exclude from version control if desired
- ✅ Preserves planning history for archeological research
- ✅ Reduces noise when browsing the project

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Store AI planning docs in `history/` directory
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems
- ❌ Do NOT clutter repo root with planning documents

For more details, see README.md and QUICKSTART.md.

### Landing the Plane

**When the user says "let's land the plane"**, follow this clean session-ending protocol:

1. **File beads issues for any remaining work** that needs follow-up
2. **Ensure all quality gates pass** (only if code changes were made) - run tests, linters, builds (file P0 issues if broken)
3. **Update beads issues** - close finished work, update status
4. **Sync the issue tracker carefully** - Work methodically to ensure both local and remote issues merge safely. This may require pulling, handling conflicts (sometimes accepting remote changes and re-importing), syncing the database, and verifying consistency. Be creative and patient - the goal is clean reconciliation where no issues are lost.
5. **Clean up git state** - Clear old stashes and prune dead remote branches:
   ```bash
   git stash clear                    # Remove old stashes
   git remote prune origin            # Clean up deleted remote branches
   ```
6. **Verify clean state** - Ensure all changes are committed and pushed, no untracked files remain
7. **Choose a follow-up issue for next session**
   - Provide a prompt for the user to give to you in the next session
   - Format: "Continue work on bd-X: [issue title]. [Brief context about what's been done and what's next]"

**Example "land the plane" session:**

```bash
# 1. File remaining work
bd create "Add integration tests for sync" -t task -p 2 --json

# 2. Run quality gates (only if code changes were made)
go test -short ./...
golangci-lint run ./...

# 3. Close finished issues
bd close bd-42 bd-43 --reason "Completed" --json

# 4. Sync carefully - example workflow (adapt as needed):
git pull --rebase
# If conflicts in .beads/issues.jsonl, resolve thoughtfully:
#   - git checkout --theirs .beads/issues.jsonl (accept remote)
#   - bd import -i .beads/issues.jsonl (re-import)
#   - Or manual merge, then import
bd sync  # Export/import/verify
git push
# Repeat pull/push if needed until clean

# 5. Verify clean state
git status

# 6. Choose next work
bd ready --json
bd show bd-44 --json
```

**Then provide the user with:**

- Summary of what was completed this session
- What issues were filed for follow-up
- Status of quality gates (all passing / issues filed)
- Recommended prompt for next session

### Agent Session Workflow

**IMPORTANT for AI agents:** When you finish making issue changes, always run:

```bash
bd sync
```

This immediately:

1. Exports pending changes to JSONL (no 30s wait)
2. Commits to git
3. Pulls from remote
4. Imports any updates
5. Pushes to remote

**Example agent session:**

```bash
# Make multiple changes (batched in 30-second window)
bd create "Fix bug" -p 1
bd create "Add tests" -p 1
bd update bd-42 --status in_progress
bd close bd-40 --reason "Completed"

# Force immediate sync at end of session
bd sync

# Now safe to end session - everything is committed and pushed
```

**Why this matters:**

- Without `bd sync`, changes sit in 30-second debounce window
- User might think you pushed but JSONL is still dirty
- `bd sync` forces immediate flush/commit/push

**STRONGLY RECOMMENDED: Install git hooks for automatic sync** (prevents stale JSONL problems):

```bash
# One-time setup - run this in each beads workspace
bd hooks install
```

This installs:

- **pre-commit** - Flushes pending changes immediately before commit (bypasses 30s debounce)
- **post-merge** - Imports updated JSONL after pull/merge (guaranteed sync)
- **pre-push** - Exports database to JSONL before push (prevents stale JSONL from reaching remote)
- **post-checkout** - Imports JSONL after branch checkout (ensures consistency)

**Why git hooks matter:**
Without the pre-push hook, you can have database changes committed locally but stale JSONL pushed to remote, causing multi-workspace divergence. The hooks guarantee DB ↔ JSONL consistency.

**Note:** Hooks are embedded in the bd binary and work for all bd users (not just source repo users).

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

### Image Generation (`npm run generate:images`)

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

### Video Generation (`npm run generate:videos`)

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

### Color Generation (`npm run generate:colors`)

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
- JetBrains Mono (monospace)
- Preloaded for critical weights (400, 700)

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
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report
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

1. Install dependencies (`npm ci`)
2. Build React Router app (`npm run build`)
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
npm run deploy

# Staging
npm run deploy:staging
```

## Development Guidelines

### Starting Development

```bash
npm install           # Install dependencies
npm run dev           # Start dev server (localhost:5173)
npm run dev:staging   # Start with staging config
```

### Common Tasks

**Generate Visuals:**
```bash
npm run generate:images      # Generate AI images
npm run generate:videos      # Generate AI videos
npm run generate:colors      # Extract colors
npm run validate:images      # Check image validity
npm run delete:invalid-images # Remove failed images
```

**Type Checking:**
```bash
npm run typegen      # Generate Cloudflare types
npm run typecheck    # Run TypeScript compiler
```

**Linting:**
```bash
npm run lint         # Check code style
npm run lint:fix     # Auto-fix issues
```

**Building:**
```bash
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Full check (types + build + dry-run)
```

### Adding a New Post

1. Create `/posts/YYYY-MM-DD.slug.mdx`
2. Add frontmatter (see schema above)
3. Write content with MDX components
4. Generate visuals: `npm run generate:images`
5. Generate videos: `npm run generate:videos`
6. Extract colors: `npm run generate:colors`
7. Test locally: `npm run dev`
8. Deploy: `npm run deploy`

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
npm run dev                    # Start dev server
npm run dev:staging            # Dev with staging config

# Building
npm run build                  # Production build
npm run build:staging          # Staging build
npm run preview                # Preview prod build

# Testing
npm test                       # Run tests
npm run test:watch             # Watch mode
npm run test:ui                # Vitest UI
npm run test:coverage          # Coverage report

# Type Checking
npm run typegen                # Generate types
npm run typecheck              # Check types

# Linting
npm run lint                   # Check style
npm run lint:fix               # Fix style issues

# Visuals
npm run generate:images        # Generate images
npm run generate:videos        # Generate videos
npm run generate:colors        # Extract colors
npm run validate:images        # Validate images
npm run delete:invalid-images  # Remove invalid

# Deployment
npm run deploy                 # Deploy production
npm run deploy:staging         # Deploy staging
npm run upload:assets:production   # Upload to R2 (prod)
npm run upload:assets:staging      # Upload to R2 (staging)

# Utilities
npm run check                  # Full check (types + build)
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