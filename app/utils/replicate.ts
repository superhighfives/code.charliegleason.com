/**
 * Replicate utility functions
 */

/**
 * Extracts the model name from a Replicate URL
 * @param url - Replicate model URL (e.g. "https://replicate.com/jakedahn/flux-latentpop")
 * @returns Model name (e.g. "flux-latentpop")
 */
export function extractModelName(url: string): string {
  const match = url.match(/replicate\.com\/[^/]+\/([^/?#]+)/);
  if (!match) {
    throw new Error(`Invalid Replicate URL format: ${url}`);
  }
  return match[1];
}
