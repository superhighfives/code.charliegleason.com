import { decode } from "fast-png";

interface RGB {
  r: number;
  g: number;
  b: number;
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

  // Helper functions
  const getPixel = (x: number, y: number): RGB => {
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
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    // Handle NaN or invalid values by defaulting to 0
    const safeR = Number.isFinite(r) ? Math.max(0, Math.min(255, Math.round(r))) : 0;
    const safeG = Number.isFinite(g) ? Math.max(0, Math.min(255, Math.round(g))) : 0;
    const safeB = Number.isFinite(b) ? Math.max(0, Math.min(255, Math.round(b))) : 0;

    return `#${[safeR, safeG, safeB]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")}`;
  };

  const calculateAverage = (pixels: RGB[]): RGB => {
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
  };

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
      edgePixels.top.push(getPixel(x, y));
    }
  }

  // Sample bottom edge (last edgeDepth rows)
  for (let y = Math.max(height - edgeDepth, 0); y < height; y++) {
    for (let x = 0; x < width; x += sampleRate) {
      edgePixels.bottom.push(getPixel(x, y));
    }
  }

  // Sample left edge (first edgeDepth columns)
  for (let x = 0; x < Math.min(edgeDepth, width); x++) {
    for (let y = 0; y < height; y += sampleRate) {
      edgePixels.left.push(getPixel(x, y));
    }
  }

  // Sample right edge (last edgeDepth columns)
  for (let x = Math.max(width - edgeDepth, 0); x < width; x++) {
    for (let y = 0; y < height; y += sampleRate) {
      edgePixels.right.push(getPixel(x, y));
    }
  }

  // Calculate averages for each edge
  const topAvg = calculateAverage(edgePixels.top);
  const bottomAvg = calculateAverage(edgePixels.bottom);
  const leftAvg = calculateAverage(edgePixels.left);
  const rightAvg = calculateAverage(edgePixels.right);

  // Calculate dominant color from all edges
  const allEdgePixels = [
    ...edgePixels.top,
    ...edgePixels.bottom,
    ...edgePixels.left,
    ...edgePixels.right,
  ];
  const dominantAvg = calculateAverage(allEdgePixels);

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
 * @returns Object containing dominant and average colors in hex format
 */
export async function detectImageColors(
  base64Image: string,
  options: {
    sampleRate?: number;
  } = {},
): Promise<ImageColors> {
  const { sampleRate = 10 } = options;

  // Decode base64 to Uint8Array
  const base64Data = base64Image.replace(/^data:image\/png;base64,/, "");
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Decode PNG
  const png = decode(bytes);
  const { width, height, data, depth, channels } = png;

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

  // Helper functions
  const getPixel = (x: number, y: number): RGB => {
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
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    // Handle NaN or invalid values by defaulting to 0
    const safeR = Number.isFinite(r) ? Math.max(0, Math.min(255, Math.round(r))) : 0;
    const safeG = Number.isFinite(g) ? Math.max(0, Math.min(255, Math.round(g))) : 0;
    const safeB = Number.isFinite(b) ? Math.max(0, Math.min(255, Math.round(b))) : 0;

    return `#${[safeR, safeG, safeB]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")}`;
  };

  const calculateAverage = (pixels: RGB[]): RGB => {
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
  };

  // Sample pixels from entire image
  const allPixels: RGB[] = [];

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      allPixels.push(getPixel(x, y));
    }
  }

  // Calculate average color
  const averageColor = calculateAverage(allPixels);

  // Calculate dominant color using simple color quantization
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

  // Find most common color
  let maxCount = 0;
  let dominantColor = { r: 0, g: 0, b: 0 };

  for (const { color, count } of colorMap.values()) {
    if (count > maxCount) {
      maxCount = count;
      dominantColor = color;
    }
  }

  console.log('Image color analysis:', {
    totalPixelsSampled: allPixels.length,
    uniqueColors: colorMap.size,
    dominantColorCount: maxCount,
    dominantColor: rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b),
    averageColor: rgbToHex(averageColor.r, averageColor.g, averageColor.b),
  });

  return {
    dominant: rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b),
    average: rgbToHex(averageColor.r, averageColor.g, averageColor.b),
  };
}
