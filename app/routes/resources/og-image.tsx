import { Buffer } from "node:buffer";
import { initWasm as initResvg, Resvg } from "@resvg/resvg-wasm";
import type { SatoriOptions } from "satori";
import satori, { init as initSatori } from "satori/wasm";
import { loadGoogleFont } from "workers-og";
import initYoga from "yoga-wasm-web";
import background from "~/assets/social-background.png";
import { loadAllMdxRuntime } from "~/mdx/mdx-runtime";
import { detectEdgeColors, detectImageColors } from "~/utils/edge-colors";
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

  // Get image index from query parameter (e.g., ?image=0)
  const url = new URL(request.url);
  const imageParam = url.searchParams.get("image");
  const imageIndex = imageParam !== null ? parseInt(imageParam, 10) : null;

  const imageResponse = await context.assets.fetch(
    new URL(background, request.url),
  );
  const imageBuffer = await imageResponse.arrayBuffer();

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
    let backgroundColor = `#03060E`;
    let textColor = "white";

    // Check if image is a string (custom prompt) - this means AI images should be generated
    // If image is true (boolean) or missing, fall back to text-only layout
    if (post.frontmatter.image) {
      try {
        // Use query parameter if provided, otherwise random selection (0-20)
        const selectedIndex =
          imageIndex !== null ? imageIndex : Math.floor(Math.random() * 21);
        const aiImagePath = `/posts/${slug}/${selectedIndex}.png`;

        console.log(
          `Loading AI image for ${slug}: index ${selectedIndex}${imageIndex !== null ? " (from query param)" : " (random)"}`,
        );

        const aiImageResponse = await context.assets.fetch(
          new URL(aiImagePath, request.url),
        );

        if (aiImageResponse.ok) {
          const aiImageBuffer = await aiImageResponse.arrayBuffer();
          aiImageBase64 = `data:image/png;base64,${Buffer.from(aiImageBuffer).toString("base64")}`;

          // Detect colors from AI image
          try {
            // Step 1: Get edge colors
            const edgeColors = await detectEdgeColors(aiImageBase64, {
              sampleRate: 10,
              edgeDepth: 10,
            });
            console.log(
              `Detected edge color for ${slug}: ${edgeColors.dominant}`,
            );

            // Step 2: Get dominant image color, excluding edge colors and boosting contrast
            const imageColors = await detectImageColors(aiImageBase64, {
              sampleRate: 10,
              excludeColor: edgeColors.left,
              colorTolerance: 30, // How similar colors need to be to edge color to be excluded
              contrastBoost: 4, // Boost colors that contrast with edge (0-10, higher = more contrast)
            });
            textColor = imageColors.dominant;
            backgroundColor = edgeColors.left;
            console.log(
              `Detected text color for ${slug}: ${textColor} (excluding edge color)`,
            );
          } catch (colorError) {
            console.log(
              `Color detection failed for ${slug}, using fallback: ${colorError}`,
            );
            // Falls back to white
          }
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
          background: backgroundColor,
          backgroundSize: "1200 630",
          display: "flex",
          flexDirection: "row",
          color: textColor,
        }}
      >
        {/* Left side: Text content */}
        <div
          style={{
            width: aiImageBase64 ? "600px" : "100%",
            height: "100%",
            padding: aiImageBase64 ? "80px 0 0 80px" : "80px",
            display: "flex",
            flexDirection: "column",
            gap: "24",
          }}
        >
          <div
            style={{
              display: "block",
              fontSize: 48,
              lineClamp: aiImageBase64 ? 3 : 2,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                display: "block",
                fontSize: 30,
                lineClamp: 3,
                lineHeight: 1.5,
                letterSpacing: "-0.01em",
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
            bottom: "54px",
            left: "86px",
            fontSize: 24,
            color: aiImageBase64 ? textColor : "#4C4CDD",
          }}
        >
          {/** biome-ignore lint/a11y/noSvgWithoutTitle: output as a static image */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke={aiImageBase64 ? textColor : "#4C4CDD"}
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
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("Error generating OG image", e);
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }
}
