/**
 * Active diagram style. Lives in its own file so it can be imported from both
 * Node (`shared.ts` → `render-mermaid.ts`) and the browser harness without
 * dragging `node:crypto` into the browser bundle.
 *
 * Add new styles in `harness.tsx` under `STYLES`. Switching the value here
 * also bumps the RENDER_VERSION marker (see `shared.ts`), so existing SVGs
 * invalidate and re-render on next boot.
 */
export const ACTIVE_STYLE = "indigo" as const;
