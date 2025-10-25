import { readdir, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { hasValidSolidLeftEdge } from "./image-validation.js";
import { getPosts, OUTPUT_DIR } from "./utils.js";

async function main() {
  console.log("🗑️  Finding and deleting invalid PNG images...\n");

  const posts = await getPosts();

  let totalImages = 0;
  let deletedImages = 0;
  const deletedImagesList: Array<{
    post: string;
    file: string;
    reason: string;
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

        if (!validation.isValid) {
          // Delete the invalid image
          await unlink(imagePath);
          deletedImages++;

          const reason = `${(validation.percentageWithinThreshold * 100).toFixed(1)}% within threshold (need 95%), max distance: ${validation.maxDistance.toFixed(1)}`;

          console.log(`   🗑️  Deleted: ${file} - ${reason}`);

          deletedImagesList.push({
            post: post.slug,
            file,
            reason,
          });
        } else {
          console.log(
            `   ✅ ${file} - Valid (${(validation.percentageWithinThreshold * 100).toFixed(1)}% within threshold)`,
          );
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not process directory: ${postDir}`);
    }
  }

  console.log("\n\n✨ Deletion complete!");
  console.log(`📊 Total images checked: ${totalImages}`);
  console.log(`✅ Valid images kept: ${totalImages - deletedImages}`);
  console.log(`🗑️  Invalid images deleted: ${deletedImages}`);

  if (deletedImagesList.length > 0) {
    console.log("\n🗑️  Deleted images:");
    for (const img of deletedImagesList) {
      console.log(`   - ${img.post}/${img.file}`);
      console.log(`     Reason: ${img.reason}`);
    }
  } else {
    console.log("\n🎉 No invalid images found!");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
