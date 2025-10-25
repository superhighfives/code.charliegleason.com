import "dotenv/config";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import Replicate from "replicate";
import sharp from "sharp";
import { hasValidSolidLeftEdge } from "./image-validation.js";
import {
  getPosts,
  IMAGES_PER_POST,
  OUTPUT_DIR,
  PERCEPTUAL_COLOR_THRESHOLD,
} from "./utils.js";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const MAX_RETRIES = 3;

/**
 * Optimizes a PNG image to reduce file size
 * @param imagePath - Path to the PNG file to optimize
 */
async function optimizePng(imagePath: string): Promise<void> {
  try {
    const originalBuffer = await readFile(imagePath);
    const originalSize = originalBuffer.length;

    // Optimize the PNG with sharp
    // Force RGB output (not palette) so fast-png can read colors correctly in edge-colors
    const optimizedBuffer = await sharp(originalBuffer)
      .toColorspace("srgb") // Ensure RGB color space
      .withMetadata() // Preserve color profile and metadata
      .png({
        compressionLevel: 9, // Maximum compression
        palette: false, // Force RGB output, disable palette compression
      })
      .toBuffer();

    const optimizedSize = optimizedBuffer.length;
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    await writeFile(imagePath, optimizedBuffer);
    console.log(
      `   📦 Optimized: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${savings}% smaller)`,
    );
  } catch (error) {
    console.error("   ⚠️  Failed to optimize PNG:", error);
    // Don't fail the whole process if optimization fails
  }
}

async function main() {
  if (!REPLICATE_API_TOKEN) {
    console.error("❌ REPLICATE_API_TOKEN environment variable is required");
    process.exit(1);
  }

  console.log("🎨 Starting AI image generation...\n");

  const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
  });

  const posts = await getPosts();

  console.log(`📚 Found ${posts.length} posts with image generation enabled\n`);

  for (const post of posts) {
    console.log(`\n📝 Processing: ${post.title}`);
    console.log(`   Slug: ${post.slug}`);

    const postDir = join(OUTPUT_DIR, post.slug);

    // Create directory if it doesn't exist
    if (!existsSync(postDir)) {
      await mkdir(postDir, { recursive: true });
      console.log(`   ✓ Created directory: ${postDir}`);
    }

    // Check which images are missing
    const existingImages = existsSync(postDir) ? await readdir(postDir) : [];

    const existingIndices = new Set(
      existingImages
        .filter((file) => file.match(/^\d+\.png$/))
        .map((file) => Number.parseInt(file.replace(".png", ""), 10)),
    );

    const missingIndices = Array.from(
      { length: IMAGES_PER_POST },
      (_, i) => i,
    ).filter((i) => !existingIndices.has(i));

    if (missingIndices.length === 0) {
      console.log(`   ✓ All ${IMAGES_PER_POST} images already exist`);
      continue;
    }

    console.log(
      `   📊 Missing ${missingIndices.length} images: [${missingIndices.join(", ")}]`,
    );

    // Generate missing images
    for (const index of missingIndices) {
      const imagePath = join(postDir, `${index}.png`);
      let attempt = 0;
      let success = false;

      while (attempt < MAX_RETRIES && !success) {
        attempt++;
        const attemptPrefix =
          attempt > 1 ? ` (attempt ${attempt}/${MAX_RETRIES})` : "";

        try {
          console.log(`   🎨 Generating image ${index}${attemptPrefix}...`);

          // Use the image field as the prompt description
          const prompt = `${post.image}, solid background, LTNP style`;

          if (attempt === 1) {
            console.log(`   📝 Prompt: ${prompt}`);
          }

          const output = (await replicate.run(
            "jakedahn/flux-latentpop:c5e4432e01d30a523f9ebf1af1ad9f7ce82adc6709ec3061a817d53ff3bb06cc",
            {
              input: {
                prompt,
                output_format: "png",
                aspect_ratio: "1:1", // 1024x1024
              },
            },
          )) as string | string[];

          // Handle output - it might be a URL string or array of URLs
          const imageUrl = Array.isArray(output) ? output[0] : output;

          if (!imageUrl) {
            throw new Error("No image URL returned from Replicate");
          }

          // Download the image
          console.log(`   📥 Downloading from: ${imageUrl}`);
          const response = await fetch(imageUrl);

          if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
          }

          const buffer = Buffer.from(await response.arrayBuffer());

          // Validate solid left edge using Euclidean distance
          console.log(`   🔍 Validating solid left edge...`);
          const validation = await hasValidSolidLeftEdge(buffer);

          if (!validation.isValid) {
            if (attempt < MAX_RETRIES) {
              console.log(
                `   🔄 Left edge not solid (distance: ${validation.maxDistance.toFixed(1)}, threshold: ${PERCEPTUAL_COLOR_THRESHOLD}). Retrying...`,
              );
              continue;
            } else {
              console.log(
                `   ⚠️  Max retries reached. Skipping image ${index}.`,
              );
              break;
            }
          }

          // Save the valid image
          await writeFile(imagePath, buffer);
          console.log(`   ✅ Saved: ${imagePath}`);

          // Optimize the PNG to reduce file size
          await optimizePng(imagePath);

          success = true;
        } catch (error) {
          console.error(
            `   ❌ Failed to generate image ${index} (attempt ${attempt}):`,
            error,
          );
          if (attempt >= MAX_RETRIES) {
            console.log(`   ⚠️  Max retries reached. Skipping image ${index}.`);
          }
        }
      }
    }
  }

  console.log("\n\n✨ Image generation complete!\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
