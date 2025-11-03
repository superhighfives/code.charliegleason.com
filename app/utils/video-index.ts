import { VISUAL_COUNT as VISUAL_COUNT_CONSTANT } from "~/config/constants";

/**
 * Utilities for handling video/image index conversion and validation.
 * Images and videos are stored as 0-(VISUAL_COUNT-1).
 * User-facing URLs and UI display as 1-VISUAL_COUNT.
 */

// Re-export VISUAL_COUNT for convenience
export const VISUAL_COUNT = VISUAL_COUNT_CONSTANT;

export const MIN_USER_INDEX = 1;
export const MAX_USER_INDEX = VISUAL_COUNT;
export const MIN_INTERNAL_INDEX = 0;
export const MAX_INTERNAL_INDEX = VISUAL_COUNT - 1;

/**
 * Parse and validate an image query parameter.
 * Converts from user-facing index to internal index.
 *
 * @param imageParam - The raw query parameter value from URL
 * @returns The internal index if valid, null if invalid or not provided
 *
 * @example
 * parseImageIndex("1") // 0
 * parseImageIndex("9") // 8
 * parseImageIndex("0") // null (invalid)
 * parseImageIndex("10") // null (out of range)
 * parseImageIndex("abc") // null (not a number)
 * parseImageIndex(null) // null (not provided)
 */
export function parseImageIndex(imageParam: unknown | null): number | null {
  if (imageParam === null) {
    return null;
  }

  if (typeof imageParam !== "string") {
    return null;
  }

  const parsed = parseInt(imageParam, 10);

  // Validate: must be a valid number in the user-facing range
  if (
    Number.isNaN(parsed) ||
    parsed < MIN_USER_INDEX ||
    parsed > MAX_USER_INDEX
  ) {
    return null;
  }

  // Convert from user-facing to internal index
  return parsed - 1;
}

/**
 * Convert internal index to user-facing index.
 *
 * @param internalIndex - The internal index
 * @returns The user-facing index
 *
 * @example
 * toUserIndex(0) // 1
 * toUserIndex(8) // 9
 */
export function toUserIndex(internalIndex: number): number {
  return internalIndex + 1;
}

/**
 * Generate a random internal index.
 *
 * @returns A random internal index
 */
export function randomVideoIndex(): number {
  return Math.floor(Math.random() * VISUAL_COUNT);
}

/**
 * Generate a random internal index that's different from the current index.
 *
 * @param currentIndex - The current internal index to exclude
 * @returns A random internal index different from currentIndex
 *
 * @example
 * randomVideoIndexExcluding(5) // returns a random index but never 5
 */
export function randomVideoIndexExcluding(currentIndex: number): number {
  let newIndex = randomVideoIndex();
  while (newIndex === currentIndex) {
    newIndex = randomVideoIndex();
  }
  return newIndex;
}

/**
 * Preload a video by creating a hidden video element.
 * This ensures smooth transitions when the video is displayed.
 *
 * @param slug - The post slug
 * @param videoIndex - The internal video index to preload
 * @returns The ID of the preloaded video element for later cleanup
 *
 * @example
 * const preloadId = preloadVideo("hello-world", 5)
 * // Later: cleanupPreloadedVideo(preloadId)
 */
export function preloadVideo(slug: string, videoIndex: number): string {
  const preloadId = `preload-${slug}-${videoIndex}`;

  // Check if already preloaded
  if (document.getElementById(preloadId)) {
    return preloadId;
  }

  const video = document.createElement("video");
  video.preload = "auto";
  video.src = `/posts/${slug}/${videoIndex}.mp4`;
  video.style.display = "none";
  video.id = preloadId;
  document.body.appendChild(video);

  return preloadId;
}

/**
 * Clean up a preloaded video element.
 *
 * @param preloadId - The ID returned from preloadVideo()
 *
 * @example
 * cleanupPreloadedVideo("preload-hello-world-5")
 */
export function cleanupPreloadedVideo(preloadId: string): void {
  const preloadVideo = document.getElementById(preloadId);
  if (preloadVideo) {
    preloadVideo.remove();
  }
}
