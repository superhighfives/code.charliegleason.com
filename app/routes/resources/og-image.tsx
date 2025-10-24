import { Buffer } from "node:buffer";
import { initWasm as initResvg, Resvg } from "@resvg/resvg-wasm";
import type { SatoriOptions } from "satori";
import satori, { init as initSatori } from "satori/wasm";
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

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { slug } = params;

  const imageResponse = await context.assets.fetch(
    new URL(background, request.url),
  );
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = `data:image/png;base64,${Buffer.from(imageBuffer).toString("base64")}`;

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
        const randomIndex = Math.floor(Math.random() * 21);
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
            padding: "100px",
            display: "flex",
            flexDirection: "column",
            gap: "24",
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
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "100px",
            }}
          >
            <img
              src={aiImageBase64}
              style={{
                width: "400px",
                height: "400px",
                objectFit: "contain",
              }}
              alt="AI generated image"
            />
          </div>
        ) : null}
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
