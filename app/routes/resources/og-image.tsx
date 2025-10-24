import { initWasm as initResvg, Resvg } from "@resvg/resvg-wasm";
import quantize from "quantize";
import type { SatoriOptions } from "satori";
import satori, { init as initSatori } from "satori/wasm";
import UPNG from "upng-js";
import { loadGoogleFont } from "workers-og";
import initYoga from "yoga-wasm-web";
import background from "~/assets/social-background.png";
import { loadAllMdxRuntime } from "~/mdx/mdx-runtime";
// @ts-expect-error: wasm is untyped in Vite
import RESVG_WASM from "../../vendor/resvg.wasm";
// @ts-expect-error: wasm is untyped in Vite
import YOGA_WASM from "../../vendor/yoga.wasm";
import type { Route } from "./+types/og-image";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

let initialisationPromise: Promise<void> | null = null;

async function ensureInitialised() {
  if (!initialisationPromise) {
    initialisationPromise = (async () => {
      try {
        await initResvg(RESVG_WASM);
      } catch (_e) {
        // Already initialized, ignore
      }
      try {
        initSatori(await initYoga(YOGA_WASM));
      } catch (_e) {
        // Already initialized, ignore
      }
    })();
  }
  return initialisationPromise;
}

// Web API compatible base64 encoding (works in Cloudflare Workers)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function extractBackgroundColorFromEdges(
  base64Image: string,
): Promise<string | null> {
  try {
    // Remove the data:image/png;base64, prefix
    const base64Data = base64Image.replace(/^data:image\/png;base64,/, "");

    // Decode base64 using Web APIs (works in Cloudflare Workers)
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode PNG using UPNG (WASM)
    const img = UPNG.decode(bytes.buffer);
    const rgba = UPNG.toRGBA8(img)[0]; // Get RGBA pixel data

    const width = img.width;
    const height = img.height;

    // Sample edge pixels (corners and borders)
    const edgePixels: Array<[number, number, number]> = [];
    const sampleSize = 10; // How many pixels to sample from each edge

    // Sample top edge
    for (let x = 0; x < width; x += Math.floor(width / sampleSize)) {
      const idx = x * 4;
      edgePixels.push([rgba[idx], rgba[idx + 1], rgba[idx + 2]]);
    }

    // Sample bottom edge
    for (let x = 0; x < width; x += Math.floor(width / sampleSize)) {
      const idx = ((height - 1) * width + x) * 4;
      edgePixels.push([rgba[idx], rgba[idx + 1], rgba[idx + 2]]);
    }

    // Sample left edge
    for (let y = 0; y < height; y += Math.floor(height / sampleSize)) {
      const idx = y * width * 4;
      edgePixels.push([rgba[idx], rgba[idx + 1], rgba[idx + 2]]);
    }

    // Sample right edge
    for (let y = 0; y < height; y += Math.floor(height / sampleSize)) {
      const idx = (y * width + (width - 1)) * 4;
      edgePixels.push([rgba[idx], rgba[idx + 1], rgba[idx + 2]]);
    }

    // Use quantize to find the dominant color from edge pixels
    const colorMap = quantize(edgePixels, 5); // Get 5 most common colors
    if (!colorMap) {
      return null;
    }

    // Get the most dominant color
    const dominantColor = colorMap.palette()[0];

    return `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
  } catch (e) {
    console.error("Error extracting background color from edges:", e);
    return null;
  }
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { slug } = params;

  const imageResponse = await context.assets.fetch(
    new URL(background, request.url),
  );
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = `data:image/png;base64,${arrayBufferToBase64(imageBuffer)}`;

  try {
    await ensureInitialised();

    if (!slug) {
      throw new Error("No slug provided");
    }

    const posts = await loadAllMdxRuntime();
    const post = posts.find((p) => p.slug === slug);

    if (!post) {
      throw new Error("Post not found");
    }

    const { title, description } = post.frontmatter;

    // Check for generated AI images
    let aiImageBase64: string | null = null;
    // Check if image is a string (custom prompt) - this means AI images should be generated
    // If image is true (boolean) or missing, fall back to text-only layout
    if (post.frontmatter.image) {
      try {
        // Random selection (0-20)
        const randomIndex = Math.floor(Math.random() * 4);
        const aiImagePath = `/posts/${slug}/${randomIndex}.png`;

        const aiImageResponse = await context.assets.fetch(
          new URL(aiImagePath, request.url),
        );

        if (aiImageResponse.ok) {
          const aiImageBuffer = await aiImageResponse.arrayBuffer();
          aiImageBase64 = `data:image/png;base64,${Buffer.from(aiImageBuffer).toString("base64")}`;
        }
      } catch (e) {
        // If image doesn't exist, we'll fall back to text-only layout
        console.log(`No AI image found for ${slug}, using fallback: ${e}`);
      }
    }
    // If image is true or missing, aiImageBase64 stays null and we use text-only layout

    const options: SatoriOptions = {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      fonts: [
        {
          name: "JetBrainsMono-Semibold",
          data: await loadGoogleFont({ family: "JetBrains Mono", weight: 600 }),
          style: "normal",
        },
      ],
    };

    const svg = await satori(
      <div
        style={{
          width: options.width,
          height: options.height,
          background: `url("${imageBase64}")`,
          backgroundSize: "1200 630",
          display: "flex",
          flexDirection: "row",
          color: "white",
        }}
      >
        {/* Left side: Text content */}
        <div
          style={{
            width: aiImageBase64 ? "600px" : "100%",
            height: "100%",
            padding: "100px 0 0 100px",
            display: "flex",
            flexDirection: "column",
            gap: "24",
            border: "1px solid red",
          }}
        >
          <div
            style={{
              display: "block",
              fontSize: 60,
              lineClamp: 2,
              lineHeight: 1.25,
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                display: "block",
                fontSize: 30,
                lineClamp: 2,
                lineHeight: 1.5,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>

        {/* Right side: AI image (if available) */}
        {aiImageBase64 ? (
          <div
            style={{
              width: "600px",
              height: "630px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={aiImageBase64}
              style={{
                width: "600px",
                height: "630px",
                objectFit: "cover",
              }}
              alt=""
            />
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            gap: "-6px",
            flexDirection: "column",
            position: "absolute",
            bottom: "64px",
            left: "96px",
            fontSize: 32,
          }}
        >
          {/** biome-ignore lint/a11y/noSvgWithoutTitle: output as a static image */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            style={{ transform: "rotate(45deg)" }}
          >
            <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
            <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
          <p>❯ cd ~/code.charliegleason.com</p>
        </div>
      </div>,
      options,
    );

    // Convert the SVG to PNG with "resvg"
    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    return new Response(pngData.asPng() as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "cache-control": "no-cache",
      },
    });
  } catch (e) {
    console.error("Error generating OG image", e);
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "cache-control": "public, immutable, no-transform, max-age=31536000",
      },
    });
  }
}
