import type { APIRoute } from "astro";
import { generateOgImage } from "~/utils/og-image";

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

  try {
    if (!slug) {
      throw new Error("No slug provided");
    }

    const imageIndex = parseImageIndex(indexParam);
    if (imageIndex === null) {
      throw new Error("Invalid index");
    }

    return await generateOgImage({
      slug,
      requestUrl: request.url,
      imageIndex,
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
