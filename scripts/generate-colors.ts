import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { glob } from "glob";
import matter from "gray-matter";
import { detectImageColors } from "../app/utils/edge-colors.js";
import { IMAGES_PER_POST, OUTPUT_DIR, POSTS_DIR } from "./utils.js";

interface ColorData {
  dominant: string;
  average: string;
}

/**
 * Convert a PNG file to base64 format for edge-colors processing
 */
async function imageToBase64(imagePath: string): Promise<string> {
  const buffer = await readFile(imagePath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

/**
 * Extract colors from all images for a given post
 */
async function extractColorsForPost(
  slug: string,
): Promise<ColorData[] | null> {
  const postDir = join(OUTPUT_DIR, slug);
  const colors: ColorData[] = [];

  console.log(`   🎨 Extracting colors from images...`);

  for (let i = 0; i < IMAGES_PER_POST; i++) {
    const imagePath = join(postDir, `${i}.png`);

    try {
      // Convert image to base64
      const base64Image = await imageToBase64(imagePath);

      // Extract colors using existing edge-colors logic
      const imageColors = await detectImageColors(base64Image);

      colors.push({
        dominant: imageColors.dominant,
        average: imageColors.average,
      });

      console.log(
        `      ✓ Image ${i}: dominant=${imageColors.dominant} average=${imageColors.average}`,
      );
    } catch (error) {
      console.error(
        `      ⚠️  Failed to extract colors from ${imagePath}:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }

  return colors;
}

/**
 * Update the frontmatter of an MDX file with color data
 */
async function updatePostColors(
  filePath: string,
  colors: ColorData[],
): Promise<void> {
  const fileContent = await readFile(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  // Add colors to the visual config
  if (data.visual && typeof data.visual === "object") {
    data.visual.colors = colors;
  }

  // Write back to file
  const updatedContent = matter.stringify(content, data);
  await writeFile(filePath, updatedContent, "utf-8");

  console.log(`   ✓ Updated frontmatter with color data`);
}

async function main() {
  console.log("🎨 Starting color extraction for generated images...\n");

  // Find all MDX posts
  const mdxFiles = await glob(`${POSTS_DIR}/**/*.mdx`);

  console.log(`📚 Found ${mdxFiles.length} MDX files\n`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const filePath of mdxFiles) {
    const fileContent = await readFile(filePath, "utf-8");
    const { data } = matter(fileContent);

    // Only process posts with visual config
    if (!data.visual || typeof data.visual !== "object") {
      console.log(`\n⏭️  Skipping: ${data.title || filePath} (no visual config)`);
      skippedCount++;
      continue;
    }

    const slug = data.slug || filePath.split("/").pop()?.replace(".mdx", "");
    if (!slug) {
      console.error(`\n❌ Could not determine slug for ${filePath}`);
      errorCount++;
      continue;
    }

    console.log(`\n📝 Processing: ${data.title || slug}`);
    console.log(`   Slug: ${slug}`);

    // Check if images exist
    const postDir = join(OUTPUT_DIR, slug);
    const firstImagePath = join(postDir, "0.png");

    try {
      await readFile(firstImagePath);
    } catch {
      console.log(
        `   ⚠️  Skipping: Images not found (run generate:images first)`,
      );
      skippedCount++;
      continue;
    }

    // Extract colors from all images
    const colors = await extractColorsForPost(slug);

    if (!colors) {
      console.error(`   ❌ Failed to extract colors`);
      errorCount++;
      continue;
    }

    // Update the MDX file with color data
    try {
      await updatePostColors(filePath, colors);
      processedCount++;
    } catch (error) {
      console.error(
        `   ❌ Failed to update frontmatter:`,
        error instanceof Error ? error.message : error,
      );
      errorCount++;
    }
  }

  console.log(`\n✅ Color extraction complete!`);
  console.log(`   Processed: ${processedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount}`);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
