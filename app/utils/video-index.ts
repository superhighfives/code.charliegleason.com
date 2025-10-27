/**
 * Utilities for handling video/image index conversion and validation.
 * Images and videos are stored as 0-20 (21 total files).
 * User-facing URLs and UI display as 1-21.
 */

export const VIDEO_COUNT = 21;
export const MIN_USER_INDEX = 1;
export const MAX_USER_INDEX = VIDEO_COUNT;
export const MIN_INTERNAL_INDEX = 0;
export const MAX_INTERNAL_INDEX = VIDEO_COUNT - 1;

/**
 * Parse and validate an image query parameter.
 * Converts from user-facing index (1-21) to internal index (0-20).
 *
 * @param imageParam - The raw query parameter value from URL (e.g., "1", "21", "invalid")
 * @returns The internal index (0-20) if valid, null if invalid or not provided
 *
 * @example
 * parseImageIndex("1") // 0
 * parseImageIndex("21") // 20
 * parseImageIndex("0") // null (invalid)
 * parseImageIndex("22") // null (out of range)
 * parseImageIndex("abc") // null (not a number)
 * parseImageIndex(null) // null (not provided)
 */
export function parseImageIndex(imageParam: string | null): number | null {
  if (imageParam === null) {
    return null;
  }

  const parsed = parseInt(imageParam, 10);

  // Validate: must be a valid number between 1-21
  if (
    Number.isNaN(parsed) ||
    parsed < MIN_USER_INDEX ||
    parsed > MAX_USER_INDEX
  ) {
    return null;
  }

  // Convert from user-facing (1-21) to internal (0-20)
  return parsed - 1;
}

/**
 * Convert internal index (0-20) to user-facing index (1-21).
 *
 * @param internalIndex - The internal index (0-20)
 * @returns The user-facing index (1-21)
 *
 * @example
 * toUserIndex(0) // 1
 * toUserIndex(20) // 21
 */
export function toUserIndex(internalIndex: number): number {
  return internalIndex + 1;
}

/**
 * Generate a random internal index (0-20).
 *
 * @returns A random internal index
 */
export function randomVideoIndex(): number {
  return Math.floor(Math.random() * VIDEO_COUNT);
}
