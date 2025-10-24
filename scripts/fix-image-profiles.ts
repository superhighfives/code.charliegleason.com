import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { getPosts, OUTPUT_DIR } from "./utils.js";

/**
 * Re-optimizes existing PNG images and ensures they have an sRGB color profile
 * This fixes images that were previously optimized without color profiles
 */
async function reOptimizePng(imagePath: string): Promise<void> {
  try {
    const originalBuffer = await readFile(imagePath);
    const originalSize = originalBuffer.length;

    // Check if image has a color profile
    const metadata = await sharp(originalBuffer).metadata();
    const hasProfile = metadata.space && metadata.space !== "rgb";

    // Optimize PNG while preserving original pixel values
    // Force RGB output (not palette) so fast-png can read colors correctly
    const optimizedBuffer = await sharp(originalBuffer)
      .toColorspace("srgb") // Ensure RGB color space
      .withMetadata() // Preserve existing metadata
      .png({
        compressionLevel: 9, // Maximum compression
        palette: false, // Force RGB output, disable palette compression
      })
      .toBuffer();

    const optimizedSize = optimizedBuffer.length;
    const sizeDiff = optimizedSize - originalSize;
    const diffPercent = ((sizeDiff / originalSize) * 100).toFixed(1);
    const diffSymbol = sizeDiff > 0 ? "+" : "";

    await writeFile(imagePath, optimizedBuffer);

    const profileStatus = hasProfile ? "preserved" : "added sRGB";
    console.log(
      `   ✅ Fixed (${profileStatus}): ${imagePath.split("/").pop()} - ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${diffSymbol}${diffPercent}%)`,
    );
  } catch (error) {
    console.error(`   ❌ Failed to re-optimize: ${imagePath}`, error);
  }
}

async function main() {
  console.log(
    "🔧 Re-optimizing PNG images with color profile preservation...\n",
  );

  const posts = await getPosts();

  let totalProcessed = 0;
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const post of posts) {
    console.log(`\n📝 Processing: ${post.title}`);
    const postDir = join(OUTPUT_DIR, post.slug);

    try {
      const files = await readdir(postDir);
      const pngFiles = files.filter((file) => file.endsWith(".png"));

      if (pngFiles.length === 0) {
        console.log("   ℹ️  No PNG files found");
        continue;
      }

      console.log(`   📊 Found ${pngFiles.length} PNG files`);

      for (const file of pngFiles) {
        const imagePath = join(postDir, file);
        const beforeBuffer = await readFile(imagePath);
        totalOriginalSize += beforeBuffer.length;

        await reOptimizePng(imagePath);

        const afterBuffer = await readFile(imagePath);
        totalOptimizedSize += afterBuffer.length;
        totalProcessed++;
      }
    } catch (e) {
      console.log(`   ⚠️  Could not process directory: ${postDir}: ${e}`);
    }
  }

  const totalDiff = totalOptimizedSize - totalOriginalSize;
  const totalDiffPercent = ((totalDiff / totalOriginalSize) * 100).toFixed(1);
  const diffSymbol = totalDiff > 0 ? "+" : "";

  console.log("\n\n✨ Re-optimization complete!");
  console.log(
    `📊 Processed ${totalProcessed} images: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB → ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB (${diffSymbol}${totalDiffPercent}%)`,
  );
  console.log(
    "ℹ️  Note: Files may be slightly larger due to preserved color profiles\n",
  );
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
