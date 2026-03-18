import type { APIRoute } from "astro";
import { generateOgImage } from "~/utils/og-image";

// Exclude static files that might match [slug].png pattern
const EXCLUDED_SLUGS = ["favicon"];

export const GET: APIRoute = async ({ params, request }) => {
  const { slug } = params;

  try {
    if (!slug) {
      throw new Error("No slug provided");
    }

    // Return 404 for excluded slugs (like favicon.png)
    if (EXCLUDED_SLUGS.includes(slug)) {
      return new Response("Not found", { status: 404 });
    }

    return await generateOgImage({
      slug,
      requestUrl: request.url,
      // No imageIndex = random selection
    });
  } catch (e) {
    console.error("Error generating OG image", e);
    return new Response("Error generating image", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
};
