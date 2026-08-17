import { createHash } from "node:crypto";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";
import { ACTIVE_STYLE } from "./style-config";

/**
 * Bump the trailing revision whenever the rendering logic (harness, export
 * options) or tldraw version changes the visual output. It is NOT part of the
 * filename—it is written as a marker inside each SVG so the renderer can
 * detect stale files and re-render in place, keeping the public URL stable
 * (see render-mermaid.ts).
 */
export const RENDER_REVISION = "tldraw-5.1.1-r6";

/**
 * Version marker for a diagram rendered with `style`. The style is baked in
 * per-diagram (not globally) so a per-fence `style="..."` override invalidates
 * only that one diagram's SVGs and leaves the rest cached.
 */
export function renderVersion(style: string = ACTIVE_STYLE): string {
  return `${RENDER_REVISION}-${style}`;
}

/** Marker line embedded in each rendered SVG to track the render version. */
export function renderMarker(style: string = ACTIVE_STYLE): string {
  return `<!-- tldraw-mermaid render:${renderVersion(style)} -->`;
}

/** Public URL prefix and on-disk folder (under `public/`) for rendered SVGs. */
export const DIAGRAM_DIR = "diagrams";
export const DIAGRAM_PUBLIC_PREFIX = `/${DIAGRAM_DIR}`;

/** Normalise mermaid source so the same diagram always hashes the same. */
export function normalizeMermaidSource(source: string): string {
  return source.replace(/\r\n/g, "\n").trim();
}

/**
 * Stable filename for a given mermaid source. Depends ONLY on the diagram
 * source, so the URL never changes when render logic changes.
 */
export function hashMermaid(source: string): string {
  return createHash("sha256")
    .update(normalizeMermaidSource(source))
    .digest("hex")
    .slice(0, 16);
}

/**
 * Strip a leading YAML frontmatter block. `mdast-util-from-markdown` has no
 * frontmatter extension, so without this a `description:` containing the
 * literal ```` ```mermaid ```` token would be parsed as an opening code fence
 * and swallow the real diagrams underneath it.
 */
function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

export interface MermaidBlock {
  source: string;
  /** Style preset name from the fence meta (`style="..."`), or the default. */
  style: string;
}

/** Pull a `style="..."` override out of a fence meta string, if present. */
function parseStyle(meta: string | null | undefined): string {
  const match = meta?.match(/\bstyle="([^"]*)"/);
  return match ? match[1] : ACTIVE_STYLE;
}

/** Extract every fenced ```mermaid block (with its style) from markdown. */
export function extractMermaidBlocks(markdown: string): MermaidBlock[] {
  const tree = fromMarkdown(stripFrontmatter(markdown));
  const blocks: MermaidBlock[] = [];
  visit(tree, "code", (node) => {
    if (node.lang === "mermaid" && node.value.trim()) {
      blocks.push({ source: node.value, style: parseStyle(node.meta) });
    }
  });
  return blocks;
}
