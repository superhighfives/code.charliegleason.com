import "dotenv/config";
import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import Replicate from "replicate";
import { extractModelName } from "../app/utils/replicate";
import { getPosts, IMAGES_PER_POST, OUTPUT_DIR } from "./utils";

const execAsync = promisify(exec);

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

/**
 * Optimizes a video using ffmpeg to create a fast-starting, web-optimized video
 * - Removes audio track
 * - Uses H.264 codec with medium quality
 * - Optimizes for fast start (moves moov atom to beginning)
 * @param videoPath - Path to the MP4 file to optimize
 */
async function optimizeVideo(videoPath: string): Promise<void> {
  try {
    const originalStats = await stat(videoPath);
    const originalSize = originalStats.size;

    const tempPath = videoPath.replace(".mp4", ".temp.mp4");

    // Use ffmpeg to optimize the video:
    // -filter_complex: Apply reverse, interpolation, and smooth ease-in at the end
    //   [0:v]reverse: Reverse the video
    //   minterpolate: First interpolate to high fps (60) for smooth frames
    //   setpts with smooth ease-in in last 0.5s:
    //     Before 2.5s: Normal speed (PTS unchanged)
    //     Last 0.5s: Ease-in cubic formula that starts fast and decelerates smoothly
    //     Formula inverts the cubic curve: heavy slowdown that feels smooth and natural
    // -an: Remove audio
    // -c:v libx264: Use H.264 codec
    // -crf 28: Constant Rate Factor (18-28 is good, higher = smaller file, lower quality)
    // -preset medium: Balance between encoding speed and compression
    // -movflags +faststart: Move moov atom to beginning for fast streaming
    // -pix_fmt yuv420p: Ensure compatibility
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -filter_complex "[0:v]reverse,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts='if(lt(T\\,2.5)\\,PTS\\,2.5/TB+(T-2.5)/TB+pow((T-2.5)*2\\,3)/TB)'[v]" -map "[v]" -an -c:v libx264 -crf 28 -preset medium -movflags +faststart -pix_fmt yuv420p "${tempPath}" -y`;

    await execAsync(ffmpegCommand, { maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer

    // Replace original with optimized version
    await rename(tempPath, videoPath);

    const optimizedStats = await stat(videoPath);
    const optimizedSize = optimizedStats.size;
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    console.log(
      `   📦 Optimized: ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(optimizedSize / 1024 / 1024).toFixed(1)}MB (${savings}% smaller)`,
    );
  } catch (error) {
    console.error("   ⚠️  Failed to optimize video:", error);
    // Don't fail the whole process if optimization fails
  }
}

async function main() {
  if (!REPLICATE_API_TOKEN) {
    console.error("❌ REPLICATE_API_TOKEN environment variable is required");
    process.exit(1);
  }

  console.log("🎬 Starting AI video generation...\n");

  const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
  });

  const posts = await getPosts();

  console.log(`📚 Found ${posts.length} posts with video generation enabled\n`);

  for (const post of posts) {
    console.log(`\n📝 Processing: ${post.title}`);
    console.log(`   Slug: ${post.slug}`);

    const postDir = join(OUTPUT_DIR, post.slug);

    // Check if post directory exists
    if (!existsSync(postDir)) {
      console.log(`   ⚠️  Post directory doesn't exist: ${postDir}`);
      console.log(`   ℹ️  Run generate-images.ts first to create images`);
      continue;
    }

    // Check which videos are missing
    const existingFiles = await readdir(postDir);

    const existingVideoIndices = new Set(
      existingFiles
        .filter((file) => file.match(/^\d+\.mp4$/))
        .map((file) => Number.parseInt(file.replace(".mp4", ""), 10)),
    );

    const existingImageIndices = new Set(
      existingFiles
        .filter((file) => file.match(/^\d+\.png$/))
        .map((file) => Number.parseInt(file.replace(".png", ""), 10)),
    );

    // Only generate videos for images that exist
    const possibleIndices = Array.from(
      { length: IMAGES_PER_POST },
      (_, i) => i,
    ).filter((i) => existingImageIndices.has(i));

    const missingIndices = possibleIndices.filter(
      (i) => !existingVideoIndices.has(i),
    );

    if (missingIndices.length === 0) {
      console.log(`   ✓ All ${possibleIndices.length} videos already exist`);
      continue;
    }

    console.log(
      `   📊 Missing ${missingIndices.length} videos: [${missingIndices.join(", ")}]`,
    );

    const videoModelName = extractModelName(post.visual.video.url);

    // Generate missing videos
    for (const index of missingIndices) {
      const imagePath = join(postDir, `${index}.png`);
      const videoPath = join(postDir, `${index}.mp4`);

      try {
        console.log(`   🎬 Generating video ${index}...`);
        console.log(`   📝 Using image: ${imagePath}`);

        // Append optional guidance if provided
        const prompt = post.visual.video.guidance
          ? `${post.visual.prompt}, ${post.visual.video.guidance}`
          : post.visual.prompt;

        console.log(`   📝 Prompt: ${prompt}`);
        console.log(
          `   📝 Model: ${videoModelName} (${post.visual.video.version})`,
        );

        const input = {
          fps: 24,
          image: await readFile(imagePath),
          prompt,
          duration: 3,
          resolution: "480p",
          aspect_ratio: "1:1",
          camera_fixed: false,
        };

        const output = (await replicate.run(
          post.visual.video.version as
            | `${string}/${string}:${string}`
            | `${string}/${string}`,
          {
            input,
          },
        )) as { url?: string | (() => URL) } | string;

        // Handle output - it might be:
        // - A FileOutput object with .url() method
        // - An object with url property (string or function)
        // - A direct URL string
        let videoUrl: string;
        if (typeof output === "string") {
          videoUrl = output;
        } else if (output.url) {
          // Check if url is a function (FileOutput.url())
          if (typeof output.url === "function") {
            videoUrl = output.url().toString();
          } else {
            videoUrl = output.url;
          }
        } else {
          throw new Error("No video URL returned from Replicate");
        }

        // Download the video
        console.log(`   📥 Downloading from: ${videoUrl}`);
        const response = await fetch(videoUrl);

        if (!response.ok) {
          throw new Error(`Failed to download video: ${response.statusText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        await writeFile(videoPath, buffer);

        console.log(`   ✅ Saved: ${videoPath}`);

        // Optimize the video to reduce file size and enable fast start
        await optimizeVideo(videoPath);
      } catch (error) {
        console.error(`   ❌ Failed to generate video ${index}:`, error);
      }
    }
  }

  console.log("\n\n✨ Video generation complete!\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
