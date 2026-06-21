import { createMermaidDiagram } from "@tldraw/mermaid";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { type Editor, type TLDefaultFont, Tldraw, toRichText } from "tldraw";
import "tldraw/tldraw.css";
import { ACTIVE_STYLE } from "./style-config";

/**
 * Style presets. Each one defines:
 *   - `shapeProps` / `arrowProps`: prop patches applied to every shape /
 *     arrow after `createMermaidDiagram`.
 *   - `transformSvg`: optional pass over the exported SVG, run separately for
 *     light and dark variants, for things that can't be expressed as props
 *     (e.g. non-token stroke widths, brand colours not in tldraw's palette).
 *
 * Switch the active style by editing `ACTIVE_STYLE` in `style-config.ts` —
 * that also bumps the render marker so existing SVGs invalidate.
 */
interface DiagramStyle {
  shapeProps: Record<string, unknown>;
  arrowProps: Record<string, unknown>;
  transformSvg?: (svg: string, variant: "light" | "dark") => string;
}

// Shapes at "m" export stroke-width 3.5; arrows at "l" export 5. 4 sits
// between them and reads as visually matched.
const splitArrowStroke = (svg: string) =>
  svg.replaceAll('stroke-width="5"', 'stroke-width="4"');

// Tailwind indigo tones the rest of the site uses for prose links. Arrows
// and text take the full-strength tone; shape outlines reuse the same hex
// with a stroke-opacity to fade against the background — automatically
// lighter on light and darker on dark, with no second palette to maintain.
const INDIGO_LIGHT_PRIMARY = "#4f46e5"; // indigo-600
const INDIGO_LIGHT_PRIMARY_RGB = "rgb(79, 70, 229)";
const INDIGO_DARK_PRIMARY = "#a5b4fc"; // indigo-300
const INDIGO_DARK_PRIMARY_RGB = "rgb(165, 180, 252)";
const OUTLINE_OPACITY = 0.1;

const recolorIndigo = (svg: string, variant: "light" | "dark") => {
  const sourceHex = variant === "light" ? "#1d1d1d" : "#f2f2f2";
  const sourceRgb =
    variant === "light" ? "rgb(29, 29, 29)" : "rgb(242, 242, 242)";
  const primaryHex =
    variant === "light" ? INDIGO_LIGHT_PRIMARY : INDIGO_DARK_PRIMARY;
  const primaryRgb =
    variant === "light" ? INDIGO_LIGHT_PRIMARY_RGB : INDIGO_DARK_PRIMARY_RGB;

  // Order matters: recolor arrows first (matched by `stroke-width="4"`, which
  // splitArrowStroke produced from the size="l" export), then sweep up the
  // remaining strokes — those belong to shape outlines and get the same hue
  // at reduced opacity. tldraw text uses inline `rgb(...)` rather than
  // `stroke="..."`, so it falls under the primary recolor regardless.
  return svg
    .replaceAll(
      `stroke="${sourceHex}" stroke-width="4"`,
      `stroke="${primaryHex}" stroke-width="4"`,
    )
    .replaceAll(
      `stroke="${sourceHex}"`,
      `stroke="${primaryHex}" stroke-opacity="${OUTLINE_OPACITY}"`,
    )
    .replaceAll(sourceRgb, primaryRgb);
};

const STYLES = {
  sleek: {
    shapeProps: { font: "sans", dash: "solid", fill: "none", size: "m" },
    arrowProps: { font: "sans", dash: "solid", size: "l" },
    transformSvg: splitArrowStroke,
  },
  indigo: {
    shapeProps: { font: "mono", dash: "solid", fill: "none", size: "m" },
    arrowProps: { font: "mono", dash: "solid", size: "l" },
    transformSvg: (svg: string, variant: "light" | "dark") =>
      recolorIndigo(splitArrowStroke(svg), variant),
  },
} satisfies Record<string, DiagramStyle>;

/**
 * Resolve a style name (from a fence's `style="..."` meta, defaulting to
 * `ACTIVE_STYLE`) to its preset. Unknown names fall back to the default so a
 * typo degrades to the site style rather than throwing mid-render.
 */
function resolveStyle(name: string): DiagramStyle {
  return STYLES[name as keyof typeof STYLES] ?? STYLES[ACTIVE_STYLE];
}

interface RenderOptions {
  padding: number;
}

interface RenderResult {
  light: string;
  dark: string;
}

declare global {
  interface Window {
    __tldrawEditor?: Editor;
    __tldrawReady?: Promise<void>;
    renderMermaid?: (
      source: string,
      opts: RenderOptions,
      style: string,
    ) => Promise<RenderResult>;
  }
}

/**
 * tldraw sizes text shapes by measuring them in the DOM. If the `tldraw_draw`
 * web font isn't loaded when `createMermaidDiagram` runs, labels get measured
 * against a fallback font and end up in boxes that are too small, so the real
 * font then wraps and clips them. Dropping a probe shape per font and waiting
 * for them to load forces the fonts in before we render anything.
 */
async function preloadFonts(editor: Editor): Promise<void> {
  const fonts: TLDefaultFont[] = ["draw", "sans", "serif", "mono"];
  for (const font of fonts) {
    editor.createShape({
      type: "text",
      x: 0,
      y: 0,
      props: { richText: toRichText("Mgjpqy"), font },
    });
  }
  await editor.fonts.loadRequiredFontsForCurrentPage();
  await editor.getContainerDocument().fonts.ready;
  editor.deleteShapes([...editor.getCurrentPageShapeIds()]);
}

function App() {
  return createElement(Tldraw, {
    onMount(editor: Editor) {
      window.__tldrawEditor = editor;
      window.__tldrawReady = preloadFonts(editor);
    },
  });
}

// biome-ignore lint/style/noNonNullAssertion: #root is guaranteed by harness.html
createRoot(document.getElementById("root")!).render(createElement(App));

window.renderMermaid = async (source, opts, styleName) => {
  const editor = window.__tldrawEditor;
  if (!editor) throw new Error("tldraw editor is not mounted yet");
  await window.__tldrawReady;

  const STYLE = resolveStyle(styleName);

  // Start from a clean page so diagrams never bleed into each other.
  const existing = [...editor.getCurrentPageShapeIds()];
  if (existing.length) editor.deleteShapes(existing);

  await createMermaidDiagram(editor, source, {
    async onUnsupportedDiagram(svgString: string) {
      // Fall back to mermaid's own SVG for diagram types tldraw can't model
      // (pie, gantt, class, ER, ...). Still gives a real diagram, just not the
      // native tldraw aesthetic.
      await editor.putExternalContent({ type: "svg-text", text: svgString });
    },
  });

  const ids = [...editor.getCurrentPageShapeIds()];
  if (!ids.length) throw new Error("mermaid produced no shapes");

  // Global style pass. Each prop is only applied if the shape actually has it
  // (tldraw shape types have different prop sets — e.g. arrows have `dash`
  // but no `fill`). Arrows and non-arrow shapes get separate prop bags so
  // stroke widths can be balanced across the two families.
  editor.updateShapes(
    ids
      .map((id) => {
        const shape = editor.getShape(id);
        if (!shape) return null;
        const props = shape.props as Record<string, unknown>;
        const style =
          shape.type === "arrow" ? STYLE.arrowProps : STYLE.shapeProps;
        const patch: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(style)) {
          if (key in props) patch[key] = value;
        }
        if (Object.keys(patch).length === 0) return null;
        return { id, type: shape.type, props: patch };
      })
      .filter((u): u is NonNullable<typeof u> => u !== null),
  );

  // Export the same layout twice: transparent background each time, but with
  // tldraw's light and dark theme colors, so the page can swap variants.
  const light = await editor.getSvgString(ids, {
    padding: opts.padding,
    background: false,
    darkMode: false,
  });
  const dark = await editor.getSvgString(ids, {
    padding: opts.padding,
    background: false,
    darkMode: true,
  });
  if (!light || !dark) throw new Error("tldraw export produced no svg");

  const finish = (svg: string, variant: "light" | "dark") =>
    STYLE.transformSvg ? STYLE.transformSvg(svg, variant) : svg;

  return {
    light: finish(light.svg, "light"),
    dark: finish(dark.svg, "dark"),
  };
};
