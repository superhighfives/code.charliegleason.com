import { decode } from "fast-png";
import type { PngData, RGB } from "./png-utils.js";
import {
  calculateAverageColor,
  getPixelFromPngData,
  rgbToHex,
} from "./png-utils.js";

/**
 * Decode a base64-encoded PNG image to PngData structure
 * @param base64Image - Base64-encoded PNG image (with or without data URI prefix)
 * @returns Decoded PNG data structure
 */
function decodeBase64ToPng(base64Image: string): PngData {
  // Remove data URI prefix if present
  const base64Data = base64Image.replace(/^data:image\/png;base64,/, "");
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Decode PNG
  const png = decode(bytes);
  const { width, height, data, depth, channels, palette } = png;

  // Validate decoded PNG data
  if (!width || !height || !data || data.length === 0) {
    throw new Error(
      `Invalid PNG data: width=${width}, height=${height}, dataLength=${data?.length || 0}`,
    );
  }

  return {
    width,
    height,
    data: data as Uint8Array,
    depth,
    channels,
    palette,
  };
}

export interface EdgeColors {
  top: string;
  bottom: string;
  left: string;
  right: string;
  dominant: string;
  averageAll: string;
}

export interface ImageColors {
  dominant: string;
  average: string;
}

/**
 * Detects edge colors from a base64-encoded PNG image
 * @param base64Image - Base64-encoded PNG image (with or without data URI prefix)
 * @param options - Configuration options
 * @param options.sampleRate - Sample every N pixels (default: 10)
 * @param options.edgeDepth - How many rows/columns to sample from each edge (default: 10)
 * @returns Object containing edge colors in hex format
 */
export async function detectEdgeColors(
  base64Image: string,
  options: {
    sampleRate?: number;
    edgeDepth?: number;
  } = {},
): Promise<EdgeColors> {
  const { sampleRate = 10, edgeDepth = 10 } = options;

  // Decode base64 PNG image
  const pngData = decodeBase64ToPng(base64Image);

  // Collect edge pixels
  const edgePixels = {
    top: [] as RGB[],
    bottom: [] as RGB[],
    left: [] as RGB[],
    right: [] as RGB[],
  };

  const { width, height } = pngData;

  // Sample top edge (first edgeDepth rows)
  for (let y = 0; y < Math.min(edgeDepth, height); y++) {
    for (let x = 0; x < width; x += sampleRate) {
      edgePixels.top.push(getPixelFromPngData(pngData, x, y));
    }
  }

  // Sample bottom edge (last edgeDepth rows)
  for (let y = Math.max(height - edgeDepth, 0); y < height; y++) {
    for (let x = 0; x < width; x += sampleRate) {
      edgePixels.bottom.push(getPixelFromPngData(pngData, x, y));
    }
  }

  // Sample left edge (first edgeDepth columns)
  for (let x = 0; x < Math.min(edgeDepth, width); x++) {
    for (let y = 0; y < height; y += sampleRate) {
      edgePixels.left.push(getPixelFromPngData(pngData, x, y));
    }
  }

  // Sample right edge (last edgeDepth columns)
  for (let x = Math.max(width - edgeDepth, 0); x < width; x++) {
    for (let y = 0; y < height; y += sampleRate) {
      edgePixels.right.push(getPixelFromPngData(pngData, x, y));
    }
  }

  // Calculate averages for each edge
  const topAvg = calculateAverageColor(edgePixels.top);
  const bottomAvg = calculateAverageColor(edgePixels.bottom);
  const leftAvg = calculateAverageColor(edgePixels.left);
  const rightAvg = calculateAverageColor(edgePixels.right);

  // Calculate dominant color from all edges
  const allEdgePixels = [
    ...edgePixels.top,
    ...edgePixels.bottom,
    ...edgePixels.left,
    ...edgePixels.right,
  ];
  const dominantAvg = calculateAverageColor(allEdgePixels);

  // Calculate weighted average (giving more weight to larger edges)
  const weightedAvg = {
    r:
      (topAvg.r * width +
        bottomAvg.r * width +
        leftAvg.r * height +
        rightAvg.r * height) /
      (2 * width + 2 * height),
    g:
      (topAvg.g * width +
        bottomAvg.g * width +
        leftAvg.g * height +
        rightAvg.g * height) /
      (2 * width + 2 * height),
    b:
      (topAvg.b * width +
        bottomAvg.b * width +
        leftAvg.b * height +
        rightAvg.b * height) /
      (2 * width + 2 * height),
  };

  return {
    top: rgbToHex(topAvg.r, topAvg.g, topAvg.b),
    bottom: rgbToHex(bottomAvg.r, bottomAvg.g, bottomAvg.b),
    left: rgbToHex(leftAvg.r, leftAvg.g, leftAvg.b),
    right: rgbToHex(rightAvg.r, rightAvg.g, rightAvg.b),
    dominant: rgbToHex(dominantAvg.r, dominantAvg.g, dominantAvg.b),
    averageAll: rgbToHex(weightedAvg.r, weightedAvg.g, weightedAvg.b),
  };
}

/**
 * Detects dominant color from entire PNG image
 * @param base64Image - Base64-encoded PNG image (with or without data URI prefix)
 * @param options - Configuration options
 * @param options.sampleRate - Sample every N pixels (default: 10)
 * @param options.excludeColor - Hex color to exclude from dominant color calculation (e.g., "#ff0000")
 * @param options.colorTolerance - How similar colors need to be to the excluded color to be filtered (0-255, default: 30)
 * @param options.contrastBoost - How much to boost colors with high contrast (0-10, default: 1). Higher values prefer more contrasting colors.
 * @returns Object containing dominant and average colors in hex format
 */
export async function detectImageColors(
  base64Image: string,
  options: {
    sampleRate?: number;
    excludeColor?: string;
    colorTolerance?: number;
    contrastBoost?: number;
  } = {},
): Promise<ImageColors> {
  const {
    sampleRate = 10,
    excludeColor,
    colorTolerance = 30,
    contrastBoost = 1,
  } = options;

  // Decode base64 PNG image
  const pngData = decodeBase64ToPng(base64Image);
  const { width, height } = pngData;

  // Parse exclude color if provided
  let excludeRGB: RGB | null = null;
  if (excludeColor) {
    const hex = excludeColor.replace("#", "");
    excludeRGB = {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }

  // Helper to check if a color is similar to the exclude color
  const isColorSimilar = (
    pixel: RGB,
    target: RGB,
    tolerance: number,
  ): boolean => {
    const distance = Math.sqrt(
      (pixel.r - target.r) ** 2 +
        (pixel.g - target.g) ** 2 +
        (pixel.b - target.b) ** 2,
    );
    return distance <= tolerance;
  };

  // Calculate relative luminance (WCAG formula)
  const getLuminance = (color: RGB): number => {
    const rsRGB = color.r / 255;
    const gsRGB = color.g / 255;
    const bsRGB = color.b / 255;

    const r =
      rsRGB <= 0.03928 ? rsRGB / 12.92 : ((rsRGB + 0.055) / 1.055) ** 2.4;
    const g =
      gsRGB <= 0.03928 ? gsRGB / 12.92 : ((gsRGB + 0.055) / 1.055) ** 2.4;
    const b =
      bsRGB <= 0.03928 ? bsRGB / 12.92 : ((bsRGB + 0.055) / 1.055) ** 2.4;

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Calculate contrast ratio between two colors (WCAG formula)
  const getContrastRatio = (color1: RGB, color2: RGB): number => {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  // Sample pixels from entire image
  const allPixels: RGB[] = [];

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const pixel = getPixelFromPngData(pngData, x, y);

      // Skip pixels that are similar to the exclude color
      if (excludeRGB && isColorSimilar(pixel, excludeRGB, colorTolerance)) {
        continue;
      }

      allPixels.push(pixel);
    }
  }

  // Calculate average color
  const averageColor = calculateAverageColor(allPixels);

  // Calculate dominant color using color quantization with contrast weighting
  const colorMap = new Map<string, { color: RGB; count: number }>();

  for (const pixel of allPixels) {
    // Quantize to reduce color variations (group similar colors)
    const quantize = (value: number) => Math.round(value / 16) * 16;
    const key = `${quantize(pixel.r)},${quantize(pixel.g)},${quantize(pixel.b)}`;

    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, {
        color: {
          r: quantize(pixel.r),
          g: quantize(pixel.g),
          b: quantize(pixel.b),
        },
        count: 1,
      });
    }
  }

  // Find most common color with sufficient contrast for text readability
  const MIN_CONTRAST_RATIO = 3; // WCAG AA standard for normal text
  let maxScore = 0;
  let dominantColor = { r: 0, g: 0, b: 0 };

  // If we have an exclude color (background), check if we need light or dark text
  const backgroundLuminance = excludeRGB ? getLuminance(excludeRGB) : 0;
  const needsDarkText = backgroundLuminance > 0.5; // Light background needs dark text

  for (const { color, count } of colorMap.values()) {
    let score = count;

    // If we have an exclude color (background), prioritize readable text colors
    if (excludeRGB) {
      const contrastRatio = getContrastRatio(color, excludeRGB);

      // Filter out colors with insufficient contrast for readability
      if (contrastRatio < MIN_CONTRAST_RATIO) {
        continue; // Skip this color entirely
      }

      // Check if this color has the right luminance direction for the background
      const colorLuminance = getLuminance(color);
      const isDarkColor = colorLuminance < 0.5;

      // Penalize colors that don't match the luminance direction we need
      if (needsDarkText && !isDarkColor) {
        score *= 0.1; // Heavy penalty for light text on light background
      } else if (!needsDarkText && isDarkColor) {
        score *= 0.1; // Heavy penalty for dark text on dark background
      }

      // Boost score based on contrast ratio
      // Higher contrast ratios are better for readability
      const contrastMultiplier =
        (contrastRatio / MIN_CONTRAST_RATIO) ** contrastBoost;
      score = count * contrastMultiplier;
    }

    if (score > maxScore) {
      maxScore = score;
      dominantColor = color;
    }
  }

  // Fallback: If no suitable color found, use black or white based on background
  if (maxScore === 0 && excludeRGB) {
    dominantColor = needsDarkText
      ? { r: 0, g: 0, b: 0 }
      : { r: 255, g: 255, b: 255 };
  }

  return {
    dominant: rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b),
    average: rgbToHex(averageColor.r, averageColor.g, averageColor.b),
  };
}
