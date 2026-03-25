# code.charliegleason.com

A personal code blog built with Astro 6 and deployed on Cloudflare Workers. Previously built with React Router 7.

## Tech stack

- **Framework**: Astro 6 with SSR
- **Runtime**: Cloudflare Workers (edge)
- **Content**: MDX via Astro content collections
- **Styling**: Tailwind CSS v4
- **Code highlighting**: Shiki (built into Astro)
- **Interactive code**: Sandpack
- **AI visuals**: Replicate API
- **Testing**: Vitest

## Why Astro

The site was migrated from React Router 7. The main wins:

- **Less JavaScript by default.** The home page went from a React SPA bundle to zero client-side islands — the about section, post grid, and breadcrumb all render as static HTML. React is only loaded where it's actually needed (theme toggle, video masthead, kudos button).
- **Islands architecture.** Interactive components hydrate independently and lazily (`client:load`, `client:idle`) instead of the whole page being a React tree. Non-interactive components that were React components in React Router are now plain `.astro` files.
- **Server-side cookie access.** Astro's SSR has `Astro.cookies` available in every page, so theme detection and visual index routing happen on the server before the first byte is sent. No client hints, no hydration flash, no `useEffect` to read cookies.
- **File-based routing.** Routes are files. No `routes.ts` config to keep in sync with the file system.
- **Content collections.** MDX posts have a typed schema enforced at build time. The old app loaded MDX at runtime via a custom manifest system; Astro handles this natively with `getCollection()` and `render()`.
- **Native view transitions.** Astro's `<ClientRouter>` replaces React Router's `viewTransition` prop on `<Link>`. The nav bar persists across navigations with `transition:persist` instead of being manually excluded from the transition tree.

## Development

```bash
npm install
npm run dev     # http://localhost:4321
```

## Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Type checking |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm test` | Run tests |

## Visual generation

AI images and videos are generated with Replicate and stored in `public/posts/{slug}/`.

```bash
npm run generate:images   # Generate AI images (9 per post)
npm run generate:videos   # Generate AI videos from images
npm run generate:colors   # Extract color pairs from images
```

## Deployment

```bash
npm run deploy           # Production
npm run deploy:staging   # Staging
```

Assets (videos, optimized images) are uploaded to Cloudflare R2 separately via `scripts/upload-assets.sh` and served via R2 bindings in the Worker.

## License

MIT
