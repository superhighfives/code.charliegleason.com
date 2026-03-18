/**
 * PNG utilities that work in both Node.js and Cloudflare Workers
 * No Node.js-specific dependencies - pure JavaScript only
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface PngData {
  width: number;
  height: number;
  data: Uint8Array;
  depth: number;
  channels: number;
  palette?: number[][]; // Array of [r, g, b] or [r, g, b, a] tuples
}

/**
 * Gets a pixel's RGB value from PNG data at specific coordinates
 * @param pngData - Decoded PNG data from fast-png
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns RGB object with values 0-255
 */
export function getPixelFromPngData(
  pngData: PngData,
  x: number,
  y: number,
): RGB {
  const { width, data, depth, channels, palette } = pngData;
  const bytesPerPixel = channels || 4;
  const idx = (y * width + x) * bytesPerPixel;

  // Helper to normalize color values based on bit depth
  const normalizeValue = (value: number): number => {
    if (depth === 16) {
      // 16-bit values need to be scaled down to 8-bit (0-255)
      return Math.round(value / 257); // 65535 / 255 ≈ 257
    }
    return value;
  };

  // Handle palette-based (indexed color) PNGs
  if (palette && channels === 1) {
    // Data contains palette indices, look up the actual RGB values
    const paletteIndex = data[idx] ?? 0;
    const paletteEntry = palette[paletteIndex];
    if (paletteEntry) {
      return {
        r: paletteEntry[0] ?? 0,
        g: paletteEntry[1] ?? 0,
        b: paletteEntry[2] ?? 0,
      };
    }
  }

  // Handle different channel configurations
  if (channels === 1) {
    // Grayscale - use same value for R, G, B
    const gray = normalizeValue(data[idx] ?? 0);
    return { r: gray, g: gray, b: gray };
  } else if (channels === 2) {
    // Grayscale + Alpha - use grayscale value for R, G, B
    const gray = normalizeValue(data[idx] ?? 0);
    return { r: gray, g: gray, b: gray };
  } else if (channels === 3) {
    // RGB (no alpha)
    return {
      r: normalizeValue(data[idx] ?? 0),
      g: normalizeValue(data[idx + 1] ?? 0),
      b: normalizeValue(data[idx + 2] ?? 0),
    };
  } else {
    // RGBA (4 channels) - default
    return {
      r: normalizeValue(data[idx] ?? 0),
      g: normalizeValue(data[idx + 1] ?? 0),
      b: normalizeValue(data[idx + 2] ?? 0),
    };
  }
}

/**
 * Converts RGB values to hex color string
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color string (e.g., "#ff0000")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  // Handle NaN or invalid values by defaulting to 0
  const safeR = Number.isFinite(r)
    ? Math.max(0, Math.min(255, Math.round(r)))
    : 0;
  const safeG = Number.isFinite(g)
    ? Math.max(0, Math.min(255, Math.round(g)))
    : 0;
  const safeB = Number.isFinite(b)
    ? Math.max(0, Math.min(255, Math.round(b)))
    : 0;

  return `#${[safeR, safeG, safeB]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Calculates the average color from an array of RGB values
 * @param pixels - Array of RGB objects
 * @returns Average RGB color
 */
export function calculateAverageColor(pixels: RGB[]): RGB {
  if (pixels.length === 0) return { r: 0, g: 0, b: 0 };

  const sum = pixels.reduce(
    (acc, p) => ({
      r: acc.r + p.r,
      g: acc.g + p.g,
      b: acc.b + p.b,
    }),
    { r: 0, g: 0, b: 0 },
  );

  return {
    r: sum.r / pixels.length,
    g: sum.g / pixels.length,
    b: sum.b / pixels.length,
  };
}

/**
 * Calculates Euclidean distance between two colors in RGB space
 * This provides a perceptually better measure of color difference than
 * comparing individual channels
 * @param color1 - First RGB color
 * @param color2 - Second RGB color
 * @returns Distance value (0-441, where 441 is max distance between black and white)
 */
export function calculateColorDistance(color1: RGB, color2: RGB): number {
  return Math.sqrt(
    (color1.r - color2.r) ** 2 +
      (color1.g - color2.g) ** 2 +
      (color1.b - color2.b) ** 2,
  );
}
