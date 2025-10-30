/**
 * Cookie utility functions for managing visual index cookies
 */

/**
 * Sets a visual index cookie for a post
 * @param slug - The post slug
 * @param videoIndex - The video index (0-20)
 */
export function setVisualIndexCookie(slug: string, videoIndex: number): void {
  // biome-ignore lint/suspicious/noDocumentCookie: Client-side cookie setting for video index persistence
  document.cookie = `visual-index-${slug}=${videoIndex}; path=/; samesite=lax`;
}

/**
 * Sets a navigation cookie to track navigation from index page
 * @param slug - The post slug
 */
export function setNavigationCookie(slug: string): void {
  // biome-ignore lint/suspicious/noDocumentCookie: Client-side cookie setting for navigation tracking
  document.cookie = `nav-from-index-${slug}=1; path=/; max-age=2; samesite=lax`;
}
