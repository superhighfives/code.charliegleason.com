import { getCollection } from "astro:content";
import { Buffer } from "node:buffer";
import { ImageResponse, loadGoogleFont } from "workers-og";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// Cache fonts in module scope to avoid loading on every request
let cachedFonts: { jetBrainsMono: ArrayBuffer; inter: ArrayBuffer } | null =
  null;

async function getFonts() {
  if (cachedFonts) return cachedFonts;
  const [jetBrainsMono, inter] = await Promise.all([
    loadGoogleFont({ family: "JetBrains Mono", weight: 600 }),
    loadGoogleFont({ family: "Inter", weight: 600 }),
  ]);
  cachedFonts = { jetBrainsMono, inter };
  return cachedFonts;
}

// Custom error for 404 cases
export class PostNotFoundError extends Error {
  constructor(slug: string) {
    super(`Post not found: ${slug}`);
    this.name = "PostNotFoundError";
  }
}

export interface OgImageOptions {
  slug: string;
  requestUrl: string;
  imageIndex?: number; // Optional specific index (0-based internal)
}

export async function generateOgImage({
  slug,
  requestUrl,
  imageIndex,
}: OgImageOptions): Promise<Response> {
  // Find the post
  const posts = await getCollection("posts");
  const post = posts.find((p) => p.data.slug === slug);

  if (!post) {
    throw new PostNotFoundError(slug);
  }

  const { title, description, visual } = post.data;

  // Get AI image if available
  let aiImageBase64: string | null = null;
  let backgroundColor = `#03060E`;
  let textColor = "white";

  if (visual?.colors?.length) {
    try {
      // Use provided index or random
      const visualCount = visual.colors.length;
      const selectedIndex =
        imageIndex !== undefined
          ? Math.min(imageIndex, visualCount - 1)
          : Math.floor(Math.random() * visualCount);
      const aiImagePath = `/posts/${slug}/${selectedIndex}.png`;

      // Fetch the image from the public directory
      const aiImageResponse = await fetch(new URL(aiImagePath, requestUrl));

      if (aiImageResponse.ok) {
        const aiImageBuffer = await aiImageResponse.arrayBuffer();
        aiImageBase64 = `data:image/png;base64,${Buffer.from(aiImageBuffer).toString("base64")}`;

        // Use pre-computed colors from frontmatter
        const colorPair = visual.colors[selectedIndex];
        if (colorPair) {
          textColor = colorPair.text;
          backgroundColor = colorPair.background;
        }
      }
    } catch (_e) {
      // If image doesn't exist, we'll fall back to text-only layout
    }
  }

  // Build the HTML template
  const leftWidth = aiImageBase64 ? "600px" : "1000px";
  const leftPadding = aiImageBase64 ? "80px 0 0 80px" : "80px";
  const footerColor = aiImageBase64 ? textColor : "#4C4CDD";

  // Simplified image section - just the image, no gradient overlay
  const imageSection = aiImageBase64
    ? `<img src="${aiImageBase64}" width="600" height="630" style="width: 600px; height: 630px; object-fit: cover;" />`
    : "";

  const descriptionSection = description
    ? `<div style="display: flex; font-size: 24px; line-height: 1.5; letter-spacing: -0.01em;">${description}</div>`
    : "";

  const html = `
    <div style="position: relative; width: ${OG_IMAGE_WIDTH}px; height: ${OG_IMAGE_HEIGHT}px; background: ${backgroundColor}; display: flex; flex-direction: row; color: ${textColor}; font-family: 'JetBrains Mono', monospace;">
      <div style="width: ${leftWidth}; height: 100%; padding: ${leftPadding}; display: flex; flex-direction: column; gap: 24px;">
        <div style="display: flex; font-size: 48px; line-height: 1.25; letter-spacing: -0.01em; font-family: 'Inter', sans-serif;">
          ${title}
        </div>
        ${descriptionSection}
      </div>
      ${imageSection}
      <div style="display: flex; position: absolute; bottom: 54px; left: 86px; font-size: 24px; color: ${footerColor};">
        ❯ cd ~/code.charliegleason.com
      </div>
    </div>
  `;

  // Load fonts (cached in module scope)
  const fonts = await getFonts();

  const imageResponse = new ImageResponse(html, {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    fonts: [
      {
        name: "JetBrains Mono",
        data: fonts.jetBrainsMono,
        weight: 600,
        style: "normal",
      },
      {
        name: "Inter",
        data: fonts.inter,
        weight: 600,
        style: "normal",
      },
    ],
  });

  // Convert to ArrayBuffer and return as new Response
  const imageBuffer = await imageResponse.arrayBuffer();

  // Cache immutably if specific index, no-cache if random
  const cacheControl =
    imageIndex !== undefined
      ? "public, max-age=31536000, immutable"
      : "no-cache, no-store, must-revalidate";

  return new Response(imageBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "cache-control": cacheControl,
    },
  });
}
