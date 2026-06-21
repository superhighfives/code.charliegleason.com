import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { chromium } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import {
  DIAGRAM_DIR,
  extractMermaidBlocks,
  hashMermaid,
  normalizeMermaidSource,
  renderMarker,
} from "./mermaid/shared";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const harnessRoot = path.join(here, "mermaid");
const postsDir = path.join(projectRoot, "posts");
const outDir = path.join(projectRoot, "public", DIAGRAM_DIR);
const manifestPath = path.join(
  projectRoot,
  "app",
  "mdx",
  "mermaid-manifest.json",
);

// Visual export options. SVG keeps diagrams crisp and small; padding gives the
// shapes a little breathing room inside the prose column.
const RENDER_OPTS = { padding: 16 };

interface Diagram {
  hash: string;
  source: string;
  style: string;
  post: string;
}

async function walkMarkdown(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walkMarkdown(full);
      return entry.isFile() && /\.mdx?$/.test(entry.name) ? [full] : [];
    }),
  );
  return files.flat();
}

async function collectDiagrams(): Promise<Diagram[]> {
  const files = await walkMarkdown(postsDir);
  const diagrams: Diagram[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    const markdown = await fs.readFile(file, "utf8");
    // Dedup by hash (source-only). Two fences with identical source but
    // different `style="..."` would collide on one file; first one wins. In
    // practice diagram sources are unique, so this never bites.
    for (const { source, style } of extractMermaidBlocks(markdown)) {
      const hash = hashMermaid(source);
      if (seen.has(hash)) continue;
      seen.add(hash);
      diagrams.push({
        hash,
        source,
        style,
        post: path.relative(projectRoot, file),
      });
    }
  }
  return diagrams;
}

function variantPaths(hash: string): { light: string; dark: string } {
  return {
    light: path.join(outDir, `${hash}.svg`),
    dark: path.join(outDir, `${hash}.dark.svg`),
  };
}

async function hasMarker(file: string, style: string): Promise<boolean> {
  try {
    return (await fs.readFile(file, "utf8")).includes(renderMarker(style));
  } catch {
    return false;
  }
}

/**
 * A diagram is up to date when both theme variants exist and carry the current
 * render marker for its style. Source edits change the filename (so a missing
 * file triggers a render); render-logic or per-fence style changes bump the
 * marker (so a stale marker does).
 */
async function isUpToDate(hash: string, style: string): Promise<boolean> {
  const { light, dark } = variantPaths(hash);
  return (await hasMarker(light, style)) && (await hasMarker(dark, style));
}

async function pruneOrphans(keep: Set<string>): Promise<void> {
  let files: string[];
  try {
    files = await fs.readdir(outDir);
  } catch {
    return;
  }
  for (const name of files) {
    if (!name.endsWith(".svg")) continue;
    const hash = name.replace(/\.dark\.svg$/, "").replace(/\.svg$/, "");
    if (!keep.has(hash)) {
      await fs.rm(path.join(outDir, name));
      console.log(`[mermaid] pruned orphan ${name}`);
    }
  }
}

async function writeManifest(diagrams: Diagram[]): Promise<void> {
  const manifest: Record<string, string> = {};
  for (const diagram of diagrams) {
    manifest[normalizeMermaidSource(diagram.source)] = diagram.hash;
  }
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
  );
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(sorted, null, 2)}\n`,
    "utf8",
  );
}

async function renderPending(pending: Diagram[]): Promise<void> {
  let server: ViteDevServer | undefined;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    server = await createServer({
      root: harnessRoot,
      configFile: false,
      plugins: [react()],
      logLevel: "warn",
      server: { host: "127.0.0.1" },
      optimizeDeps: {
        include: ["react", "react-dom/client", "tldraw", "@tldraw/mermaid"],
      },
    });
    await server.listen();
    const base = server.resolvedUrls?.local[0];
    if (!base) throw new Error("vite did not report a local url");

    browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1200 },
    });
    page.on("pageerror", (err) =>
      console.error("[harness pageerror]", err.message),
    );
    page.on("console", (msg) => {
      if (msg.type() === "error")
        console.error("[harness console]", msg.text());
    });

    await page.goto(new URL("harness.html", base).href);
    await page.waitForFunction(
      () =>
        Boolean(
          (window as unknown as { __tldrawEditor?: unknown }).__tldrawEditor,
        ),
      {
        timeout: 30_000,
      },
    );

    for (const diagram of pending) {
      const result = await page.evaluate(
        ({ source, opts, style }) =>
          (
            window as unknown as {
              renderMermaid: (
                s: string,
                o: typeof opts,
                style: string,
              ) => Promise<{ light: string; dark: string }>;
            }
          ).renderMermaid(source, opts, style),
        { source: diagram.source, opts: RENDER_OPTS, style: diagram.style },
      );
      const { light, dark } = variantPaths(diagram.hash);
      const marker = renderMarker(diagram.style);
      await fs.writeFile(light, `${marker}\n${result.light}`, "utf8");
      await fs.writeFile(dark, `${marker}\n${result.dark}`, "utf8");
      console.log(
        `[mermaid] rendered ${diagram.hash}.svg (+dark)  [${diagram.style}]  (${diagram.post})`,
      );
    }
  } finally {
    await browser?.close();
    await server?.close();
  }
}

export interface RenderSummary {
  total: number;
  rendered: number;
}

/**
 * Ensure every mermaid diagram in the content has an up-to-date SVG plus a
 * fresh manifest mapping source → hash for the runtime to look up. Launches
 * the headless browser only when something is actually pending.
 */
export async function renderDiagrams(): Promise<RenderSummary> {
  const diagrams = await collectDiagrams();
  await writeManifest(diagrams);
  if (!diagrams.length) return { total: 0, rendered: 0 };

  await fs.mkdir(outDir, { recursive: true });

  const pending: Diagram[] = [];
  for (const diagram of diagrams) {
    if (await isUpToDate(diagram.hash, diagram.style)) continue;
    pending.push(diagram);
  }

  if (pending.length) {
    console.log(
      `[mermaid] rendering ${pending.length} of ${diagrams.length} diagram(s)...`,
    );
    await renderPending(pending);
  }

  return { total: diagrams.length, rendered: pending.length };
}

async function main(): Promise<void> {
  if (process.argv.includes("--clean")) {
    const diagrams = await collectDiagrams();
    await pruneOrphans(new Set(diagrams.map((d) => d.hash)));
  }

  const { total, rendered } = await renderDiagrams();
  if (!total) console.log("[mermaid] no mermaid diagrams found");
  else if (!rendered)
    console.log(
      `[mermaid] ${total} diagram(s) already cached, nothing to render`,
    );
  else console.log("[mermaid] done");
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  main().catch((err) => {
    console.error("[mermaid] render failed:", err);
    process.exit(1);
  });
}
