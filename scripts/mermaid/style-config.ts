/**
 * Active diagram style. Lives in its own file so it can be imported from both
 * Node (`shared.ts` → `render-mermaid.ts`) and the browser harness without
 * dragging `node:crypto` into the browser bundle.
 *
 * This is the default style for any fence that doesn't set its own. Individual
 * fences can opt into a different preset with `style="..."` meta (resolved in
 * `harness.tsx`). Add new styles in `harness.tsx` under `STYLES`.
 *
 * Switching the value here changes the render marker (see `renderVersion` in
 * `shared.ts`) for every diagram still on the default, so they invalidate and
 * re-render on next boot.
 */
export const ACTIVE_STYLE = "indigo" as const;
