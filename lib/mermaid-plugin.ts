import path from "node:path";
import type { Plugin } from "vite";

const POSTS_DIR = path.resolve(process.cwd(), "posts");

/**
 * Dynamic import so the bundled `vite.config` file never statically references
 * playwright / vite / @vitejs/plugin-react. If it did, the Cloudflare plugin's
 * SSR module scan would follow the chain and try to fulfil `node:worker_threads`
 * via the worker fallback service, which fails.
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

  return {
    name: "mermaid-tldraw",
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
        // eslint-disable-next-line no-console
        console.error("[mermaid] render failed:", err);
      }
    },
    configureServer(server) {
      server.watcher.add("posts/**/*.{md,mdx}");

      const onChange = (file: string) => {
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
