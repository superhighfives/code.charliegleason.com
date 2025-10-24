import { decode } from "fast-png";
import type { PngData, RGB } from "./png-utils.js";
import {
  calculateAverageColor,
  getPixelFromPngData,
  rgbToHex,
} from "./png-utils.js";

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

  // Decode base64 to Uint8Array
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
    throw new Error(`Invalid PNG data: width=${width}, height=${height}, dataLength=${data?.length || 0}`);
  }

  // Debug: Log PNG metadata to understand the format
  console.log('PNG metadata:', {
    width,
    height,
    depth,
    channels,
    hasPalette: !!palette,
    dataLength: data.length,
    expectedLength: width * height * (channels || 4),
    bytesPerPixel: data.length / (width * height),
    samplePixels: Array.from(data.slice(0, 20))
  });

  // Use shared PNG utilities
  const pngData: PngData = { width, height, data: data as Uint8Array, depth, channels, palette };

  // Collect edge pixels
  const edgePixels = {
    top: [] as RGB[],
    bottom: [] as RGB[],
    left: [] as RGB[],
    right: [] as RGB[],
  };

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

  // Debug: Log if we're getting invalid values
  if (!Number.isFinite(dominantAvg.r) || !Number.isFinite(dominantAvg.g) || !Number.isFinite(dominantAvg.b)) {
    console.warn('Invalid dominant color values:', {
      dominantAvg,
      pixelCount: allEdgePixels.length,
      samplePixels: allEdgePixels.slice(0, 5),
      imageSize: { width, height }
    });
  }

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
  const { sampleRate = 10, excludeColor, colorTolerance = 30, contrastBoost = 1 } = options;

  // Decode base64 to Uint8Array
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
    throw new Error(`Invalid PNG data: width=${width}, height=${height}, dataLength=${data?.length || 0}`);
  }

  console.log('PNG metadata (full image):', {
    width,
    height,
    depth,
    channels,
    dataLength: data.length,
    bytesPerPixel: data.length / (width * height),
  });

  // Parse exclude color if provided
  let excludeRGB: RGB | null = null;
  if (excludeColor) {
    const hex = excludeColor.replace('#', '');
    excludeRGB = {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
    console.log('Excluding color:', excludeColor, excludeRGB);
  }

  // Helper to check if a color is similar to the exclude color
  const isColorSimilar = (pixel: RGB, target: RGB, tolerance: number): boolean => {
    const distance = Math.sqrt(
      Math.pow(pixel.r - target.r, 2) +
      Math.pow(pixel.g - target.g, 2) +
      Math.pow(pixel.b - target.b, 2)
    );
    return distance <= tolerance;
  };

  // Use shared PNG utilities
  const pngData: PngData = { width, height, data: data as Uint8Array, depth, channels, palette };

  // Sample pixels from entire image
  const allPixels: RGB[] = [];
  let excludedPixelCount = 0;

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const pixel = getPixelFromPngData(pngData, x, y);

      // Skip pixels that are similar to the exclude color
      if (excludeRGB && isColorSimilar(pixel, excludeRGB, colorTolerance)) {
        excludedPixelCount++;
        continue;
      }

      allPixels.push(pixel);
    }
  }

  if (excludeRGB) {
    console.log(`Excluded ${excludedPixelCount} pixels similar to ${excludeColor}`);
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

  // Find most common color, weighted by contrast to exclude color
  let maxScore = 0;
  let dominantColor = { r: 0, g: 0, b: 0 };

  for (const { color, count } of colorMap.values()) {
    let score = count;

    // If we have an exclude color, boost score for colors with higher contrast
    if (excludeRGB) {
      // Calculate contrast distance (Euclidean distance in RGB space)
      const contrastDistance = Math.sqrt(
        Math.pow(color.r - excludeRGB.r, 2) +
        Math.pow(color.g - excludeRGB.g, 2) +
        Math.pow(color.b - excludeRGB.b, 2)
      );

      // Boost score based on contrast distance
      // Maximum possible distance is ~441 (sqrt(255^2 * 3))
      // Normalize to 0-1 range, then apply user-defined boost multiplier
      const normalizedContrast = contrastDistance / 441;
      const boost = 1 + (normalizedContrast * contrastBoost);
      score = count * boost;
    }

    if (score > maxScore) {
      maxScore = score;
      dominantColor = color;
    }
  }

  // Calculate contrast distance for the selected dominant color
  let contrastInfo = {};
  if (excludeRGB) {
    const finalContrastDistance = Math.sqrt(
      Math.pow(dominantColor.r - excludeRGB.r, 2) +
      Math.pow(dominantColor.g - excludeRGB.g, 2) +
      Math.pow(dominantColor.b - excludeRGB.b, 2)
    );
    contrastInfo = {
      contrastDistance: Math.round(finalContrastDistance),
      maxPossibleDistance: 441,
      contrastPercentage: Math.round((finalContrastDistance / 441) * 100) + '%',
    };
  }

  console.log('Image color analysis:', {
    totalPixelsSampled: allPixels.length,
    uniqueColors: colorMap.size,
    dominantColor: rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b),
    averageColor: rgbToHex(averageColor.r, averageColor.g, averageColor.b),
    ...contrastInfo,
  });

  return {
    dominant: rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b),
    average: rgbToHex(averageColor.r, averageColor.g, averageColor.b),
  };
}
