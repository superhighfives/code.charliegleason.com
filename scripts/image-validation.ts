/**
 * Image validation utilities for Node.js scripts
 * Uses shared PNG utilities from app/utils
 */

import { decode } from "fast-png";
import type { PngData, RGB } from "../app/utils/png-utils.js";
import {
  calculateAverageColor,
  calculateColorDistance,
  getPixelFromPngData,
} from "../app/utils/png-utils.js";
import {
  LEFT_EDGE_WIDTH,
  PERCEPTUAL_COLOR_THRESHOLD,
  SOLID_EDGE_PERCENTAGE,
} from "./utils.js";

export interface EdgeValidationResult {
  isValid: boolean;
  maxDistance: number;
  avgColor: RGB;
  percentageWithinThreshold: number;
}

/**
 * Validates that the leftmost edge of an image has a consistent solid color
 * Uses Euclidean distance in RGB space for more accurate perceptual validation
 * Checks that at least SOLID_EDGE_PERCENTAGE (95%) of pixels are within threshold
 * @param buffer - The image buffer to validate
 * @returns Validation result with distance metric, average color, and percentage
 */
export async function hasValidSolidLeftEdge(
  buffer: Buffer,
): Promise<EdgeValidationResult> {
  try {
    // Decode PNG using fast-png
    const png = decode(buffer);
    const { width, height, data, depth, channels, palette } = png;

    if (!width || !height || !data || data.length === 0) {
      return {
        isValid: false,
        maxDistance: 0,
        avgColor: { r: 0, g: 0, b: 0 },
        percentageWithinThreshold: 0,
      };
    }

    const pngData: PngData = { width, height, data, depth, channels, palette };

    // Get all pixels from leftmost edge
    const leftEdgePixels: RGB[] = [];
    const edgeWidth = Math.min(LEFT_EDGE_WIDTH, width);
    for (let x = 0; x < edgeWidth; x++) {
      for (let y = 0; y < height; y++) {
        leftEdgePixels.push(getPixelFromPngData(pngData, x, y));
      }
    }

    // Calculate average color of left edge
    const avgColor = calculateAverageColor(leftEdgePixels);

    // Count how many pixels are within threshold and track max distance
    let maxDistance = 0;
    let pixelsWithinThreshold = 0;

    for (const pixel of leftEdgePixels) {
      const distance = calculateColorDistance(pixel, avgColor);
      maxDistance = Math.max(maxDistance, distance);

      if (distance <= PERCEPTUAL_COLOR_THRESHOLD) {
        pixelsWithinThreshold++;
      }
    }

    const percentageWithinThreshold =
      pixelsWithinThreshold / leftEdgePixels.length;
    const isValid = percentageWithinThreshold >= SOLID_EDGE_PERCENTAGE;

    return {
      isValid,
      maxDistance,
      avgColor,
      percentageWithinThreshold,
    };
  } catch (error) {
    console.error("   ❌ Error validating image:", error);
    return {
      isValid: false,
      maxDistance: 0,
      avgColor: { r: 0, g: 0, b: 0 },
      percentageWithinThreshold: 0,
    };
  }
}
