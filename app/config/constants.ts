/**
 * Application-wide constants
 * This file contains constants used across both the app and scripts
 */

/**
 * Number of video/image variations generated per post
 * Images/videos are stored as 0-(VISUAL_COUNT-1)
 * User-facing URLs display as 1-VISUAL_COUNT
 */
export const VISUAL_COUNT = 9;

/**
 * Maximum content width class for consistent layout across the site
 * Used to constrain content width in prose areas, metadata, and navigation
 */
export const MAX_WIDTH_CLASS = "max-w-4xl";
