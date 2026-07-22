import { VISUAL_COUNT } from "~/config/constants";
import { randomVideoIndex } from "~/utils/video-index";

/**
 * Picks a visual index per post so the homepage grid spreads across colours
 * instead of every post independently landing on a similar hue.
 *
 * The background colour of a card is locked to its visual index (the same index
 * drives the image), so we can't recolour a card freely — we can only choose
 * which of the post's pre-generated palette entries to show. This biases that
 * choice: posts are processed in a random order and each one softly favours the
 * palette entry whose background is most different from the cards already
 * placed. Randomness is preserved (shuffle + weighted pick), so the arrangement
 * still varies on every load; it's just less likely to look same-y.
 */

interface PaletteEntry {
  background: string;
  text: string;
}

interface PostPalette {
  slug: string;
  colors?: PaletteEntry[];
}

/**
 * How strongly to favour more-distant colours. Higher = more contrast, less
 * randomness. A candidate is picked with probability proportional to
 * distance^SHARPNESS.
 */
const SHARPNESS = 4;

/** Weight of lightness vs. chroma in the distance metric. */
const LIGHTNESS_WEIGHT = 1;

interface ColorVector {
  a: number;
  b: number;
  L: number;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const value = hex.replace("#", "");
  if (value.length !== 6) return null;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return [r, g, b];
}

/**
 * Convert a hex colour to a small Cartesian vector where hue and saturation
 * become chroma coordinates (a, b) and lightness stays as L. Mapping hue onto a
 * circle means near-greys collapse toward the centre, so a desaturated dark card
 * is separated by lightness rather than an unstable hue.
 */
function colorVector(hex: string): ColorVector | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const L = (max + min) / 2;
  const delta = max - min;

  let s = 0;
  let h = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * L - 1));
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const rad = (h * Math.PI) / 180;
  return { a: s * Math.cos(rad), b: s * Math.sin(rad), L };
}

function distance(c1: ColorVector, c2: ColorVector): number {
  const da = c1.a - c2.a;
  const db = c1.b - c2.b;
  const dL = c1.L - c2.L;
  return Math.sqrt(da * da + db * db + LIGHTNESS_WEIGHT * dL * dL);
}

/** In-place Fisher-Yates shuffle using Math.random. */
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Pick an index into `weights` with probability proportional to each weight. */
function weightedPick(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) {
    return Math.floor(Math.random() * weights.length);
  }
  let threshold = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) return i;
  }
  return weights.length - 1;
}

/**
 * Choose a visual index per post that maximises colour contrast across the grid
 * while staying random from load to load.
 *
 * @returns A map of post slug to internal visual index (0 to VISUAL_COUNT - 1).
 */
export function selectDiverseIndices(
  posts: PostPalette[],
): Record<string, number> {
  const result: Record<string, number> = {};
  const chosen: ColorVector[] = [];

  for (const post of shuffle(posts)) {
    const colors = post.colors ?? [];
    const limit = Math.min(colors.length, VISUAL_COUNT);

    if (limit === 0) {
      result[post.slug] = randomVideoIndex();
      continue;
    }

    // Score each candidate by how far its background sits from the colours
    // already placed. Unparseable colours fall back to a neutral score so they
    // stay selectable but aren't artificially favoured.
    const vectors: (ColorVector | null)[] = [];
    const scores: number[] = [];
    for (let i = 0; i < limit; i++) {
      const vector = colorVector(colors[i].background);
      vectors.push(vector);
      if (!vector || chosen.length === 0) {
        scores.push(1);
        continue;
      }
      let minDistance = Infinity;
      for (const placed of chosen) {
        minDistance = Math.min(minDistance, distance(vector, placed));
      }
      scores.push(minDistance);
    }

    const weights =
      chosen.length === 0
        ? scores.map(() => 1)
        : scores.map((score) => score ** SHARPNESS);

    const picked = weightedPick(weights);
    result[post.slug] = picked;
    if (vectors[picked]) chosen.push(vectors[picked]);
  }

  return result;
}
