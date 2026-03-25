import type { APIRoute } from "astro";
import { generateOgImage, PostNotFoundError } from "~/utils/og-image";

// Exclude static files that might match [slug].png pattern
const EXCLUDED_SLUGS = ["favicon"];

export const GET: APIRoute = async ({ params, request }) => {
  const { slug } = params;

  // Validate params - return 404 for invalid input
  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  // Return 404 for excluded slugs (like favicon.png)
  if (EXCLUDED_SLUGS.includes(slug)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    return await generateOgImage({
      slug,
      requestUrl: request.url,
      // No imageIndex = random selection
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
