import path from "node:path";
import type { Plugin } from "vite";

const POSTS_DIR = path.resolve(process.cwd(), "posts");
const HARNESS_DIR = path.resolve(process.cwd(), "scripts", "mermaid");
const RENDER_SCRIPT = path.resolve(
  process.cwd(),
  "scripts",
  "render-mermaid.ts",
);

/**
 * Dynamic import so the bundled `vite.config` file never statically references
 * playwright / vite / @vitejs/plugin-react. If it did, the Cloudflare plugin's
 * SSR module scan would follow the chain and try to fulfil `node:worker_threads`
 * via the worker fallback service, which fails. esbuild still bundles the
 * target (so .ts resolution works), it just doesn't hoist the dependencies up.
 */
async function loadRenderer() {
  const mod = await import("../scripts/render-mermaid");
  return mod.renderDiagrams;
}

function isPostMarkdown(file: string): boolean {
  const normalized = path.resolve(file);
  return (
    normalized.startsWith(`${POSTS_DIR}${path.sep}`) &&
    /\.mdx?$/.test(normalized)
  );
}

/**
 * Renderer-side edits (harness, style presets, hash logic) also need to trigger
 * a re-render so style iteration in dev doesn't require a full restart. The
 * RENDER_VERSION marker inside each SVG is what decides whether anything
 * actually re-exports — if the marker still matches, the renderer no-ops.
 */
function isRendererSource(file: string): boolean {
  const normalized = path.resolve(file);
  return (
    (normalized.startsWith(`${HARNESS_DIR}${path.sep}`) ||
      normalized === RENDER_SCRIPT) &&
    /\.(ts|tsx|html)$/.test(normalized)
  );
}

/**
 * Renders mermaid diagrams in `posts/**` to SVGs in `public/diagrams/` and
 * keeps the runtime manifest (`app/mdx/mermaid-manifest.json`) in sync.
 *
 * - `buildStart` runs once before dev/build so the SVGs the runtime points at
 *   always exist (Playwright only launches if something is actually stale).
 * - In dev, post edits trigger a re-render and a full reload so a freshly
 *   produced diagram shows up without a manual refresh.
 */
export function mermaidPlugin(): Plugin {
  let scheduled: Promise<void> = Promise.resolve();
  let isBuild = false;

  return {
    name: "mermaid-tldraw",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    async buildStart() {
      try {
        const renderDiagrams = await loadRenderer();
        const { total, rendered } = await renderDiagrams();
        if (total) {
          // eslint-disable-next-line no-console
          console.log(
            rendered
              ? `[mermaid] rendered ${rendered}/${total} diagram(s)`
              : `[mermaid] ${total} diagram(s) cached`,
          );
        }
      } catch (err) {
        // In `vite build` (and therefore CI), keep going past a render failure
        // would ship a broken deploy: the manifest could point at SVGs that
        // are stale or absent. Fail loud so the build errors out. In dev we
        // just log so style iteration stays interactive.
        if (isBuild) {
          throw err;
        }
        // eslint-disable-next-line no-console
        console.error("[mermaid] render failed:", err);
      }
    },
    configureServer(server) {
      server.watcher.add("posts/**/*.{md,mdx}");
      server.watcher.add("scripts/mermaid/**/*.{ts,tsx,html}");
      server.watcher.add("scripts/render-mermaid.ts");

      const onChange = (file: string) => {
        if (isRendererSource(file)) {
          // Renderer source (harness, style preset, render script) can't be
          // hot-swapped in-process — esbuild bundled the original copy into
          // the vite.config chain. Bounce the whole server so the next
          // buildStart picks up the edit and re-renders against the new
          // RENDER_VERSION marker.
          // eslint-disable-next-line no-console
          console.log("[mermaid] renderer source changed, restarting server");
          void server.restart();
          return;
        }
        if (!isPostMarkdown(file)) return;
        scheduled = scheduled
          .then(async () => {
            const renderDiagrams = await loadRenderer();
            return renderDiagrams();
          })
          .then(({ rendered }) => {
            if (rendered) {
              // eslint-disable-next-line no-console
              console.log(
                `[mermaid] re-rendered ${rendered} diagram(s), reloading`,
              );
              server.ws.send({ type: "full-reload" });
            }
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error("[mermaid] render failed:", err);
          });
      };

      server.watcher.on("change", onChange);
      server.watcher.on("add", onChange);
    },
  };
}
