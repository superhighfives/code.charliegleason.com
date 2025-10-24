import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { hasValidSolidLeftEdge } from "./image-validation.js";
import { getPosts, OUTPUT_DIR } from "./utils.js";

async function main() {
  console.log("🔍 Validating PNG images for solid left edge...\n");

  const posts = await getPosts();

  let totalImages = 0;
  let validImages = 0;
  let invalidImages = 0;
  const invalidImagesList: Array<{
    post: string;
    file: string;
    maxVariance: number;
  }> = [];

  for (const post of posts) {
    console.log(`\n📝 Processing: ${post.title}`);
    const postDir = join(OUTPUT_DIR, post.slug);

    try {
      const files = await readdir(postDir);
      const pngFiles = files
        .filter((file) => file.match(/^\d+\.png$/))
        .sort((a, b) => {
          const numA = Number.parseInt(a.replace(".png", ""), 10);
          const numB = Number.parseInt(b.replace(".png", ""), 10);
          return numA - numB;
        });

      if (pngFiles.length === 0) {
        console.log("   ℹ️  No PNG files found");
        continue;
      }

      console.log(`   📊 Found ${pngFiles.length} PNG files`);

      for (const file of pngFiles) {
        const imagePath = join(postDir, file);
        const buffer = await readFile(imagePath);
        const validation = await hasValidSolidLeftEdge(buffer);

        totalImages++;

        if (validation.isValid) {
          validImages++;
          console.log(
            `   ✅ ${file} - Valid (${(validation.percentageWithinThreshold * 100).toFixed(1)}% within threshold, max: ${validation.maxDistance.toFixed(1)})`,
          );
        } else {
          invalidImages++;
          console.log(
            `   ❌ ${file} - INVALID (${(validation.percentageWithinThreshold * 100).toFixed(1)}% within threshold, need 95%, max: ${validation.maxDistance.toFixed(1)})`,
          );
          invalidImagesList.push({
            post: post.slug,
            file,
            maxVariance: validation.maxDistance,
          });
        }
      }
    } catch (e) {
      console.log(`   ⚠️  Could not process directory: ${postDir}: ${e}`);
    }
  }

  console.log("\n\n✨ Validation complete!");
  console.log(`📊 Total images: ${totalImages}`);
  console.log(`✅ Valid: ${validImages}`);
  console.log(`❌ Invalid: ${invalidImages}`);

  if (invalidImagesList.length > 0) {
    console.log("\n⚠️  Images that need regeneration:");
    for (const img of invalidImagesList) {
      console.log(
        `   - ${img.post}/${img.file} (variance: ${img.maxVariance.toFixed(1)})`,
      );
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
