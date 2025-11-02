import { redirect } from "react-router";
import { parseImageIndex } from "~/utils/video-index";
import { loadMdxRuntime } from "../mdx/mdx-runtime";
import type { Route } from "./+types/post-redirect";

/**
 * Loader for share links with image index (e.g., /hello-world/15)
 * Sets the video index cookie and redirects to the clean URL
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  // Get the slug by parsing the URL (remove the index part)
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const slug = pathParts[0]; // First part is the slug

  // Load the frontmatter to verify this is a valid post with visual config
  const { frontmatter } = await loadMdxRuntime(request.url);

  // Parse and validate the image index
  const imageParam = (params as { index?: string }).index;
  const parsedIndex = parseImageIndex(imageParam ?? null);

  // Build redirect response
  const redirectUrl = frontmatter.slug ? `/${frontmatter.slug}` : `/${slug}`;

  // If valid image index and post has visuals, set cookie and redirect
  if (parsedIndex !== null && frontmatter.visual && frontmatter.slug) {
    throw redirect(redirectUrl, {
      headers: {
        "Set-Cookie": `visual-index-${frontmatter.slug}=${parsedIndex}; path=/; samesite=lax`,
      },
    });
  }

  // If invalid index or no visual, just redirect without setting cookie
  return redirect(redirectUrl);
}
