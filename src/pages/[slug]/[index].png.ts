import type { APIRoute } from "astro";
import { generateOgImage, PostNotFoundError } from "~/utils/og-image";

// Convert user-facing index (1-based) to internal index (0-based)
function parseImageIndex(indexParam: string | undefined): number | null {
  if (!indexParam) return null;

  const parsed = Number.parseInt(indexParam, 10);
  if (Number.isNaN(parsed) || parsed < 1) return null;

  // Convert from user-facing (1-based) to internal (0-based)
  return parsed - 1;
}

export const GET: APIRoute = async ({ params, request }) => {
  const { slug, index: indexParam } = params;

  // Validate params - return 404 for invalid input
  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  const imageIndex = parseImageIndex(indexParam);
  if (imageIndex === null) {
    return new Response("Not found", { status: 404 });
  }

  try {
    return await generateOgImage({
      slug,
      requestUrl: request.url,
      imageIndex,
    });
  } catch (e) {
    // 404 for missing posts
    if (e instanceof PostNotFoundError) {
      return new Response("Not found", { status: 404 });
    }
    // 500 for actual errors
    console.error("Error generating OG image", e);
    return new Response("Error generating image", { status: 500 });
  }
};
