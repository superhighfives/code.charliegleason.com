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
 * - For models that don't loop natively (seedance, etc), reverses the video
 *   and adds an ease-in to mask the seam. For loop-native models (vidu), skips
 *   both since the source already returns to its starting state.
 * @param videoPath - Path to the MP4 file to optimize
 * @param nativeLoop - If true, the source video already loops cleanly
 */
async function optimizeVideo(
  videoPath: string,
  nativeLoop = false,
): Promise<void> {
  try {
    const originalStats = await stat(videoPath);
    const originalSize = originalStats.size;

    const tempPath = videoPath.replace(".mp4", ".temp.mp4");

    // Filter chain differs depending on whether the source loops natively:
    //   reverse: only applied for non-looping sources to fake a return-to-start
    //   crop+scale: only applied for native-loop sources (vidu), which emit a
    //     few pixels of white grain along the frame edges. Trimming 4px off
    //     each edge and scaling back up crops the artifact out. Cropping before
    //     scaling keeps this dimension-agnostic (iw/ih resolve at runtime), and
    //     even-minus-8 stays even, which yuv420p requires.
    //   minterpolate: bump to 60fps for smooth playback in both cases
    //   setpts ease-in: only applied for reversed clips, where the seam needs
    //     to be smoothed by decelerating into the loop point
    //
    // The native-loop branch is a single linear filter, so we use the simpler
    // `-vf` form. The reversed branch is a labelled graph and uses
    // `-filter_complex` + `-map "[v]"`.
    const filterArgs = nativeLoop
      ? `-vf "crop=iw-8:ih-8,scale=iw+8:ih+8,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"`
      : `-filter_complex "[0:v]reverse,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts='if(lt(T\\,2.5)\\,PTS\\,2.5/TB+(T-2.5)/TB+pow((T-2.5)*2\\,3)/TB)'[v]" -map "[v]"`;

    const ffmpegCommand = `ffmpeg -i "${videoPath}" ${filterArgs} -an -c:v libx264 -crf 28 -preset medium -movflags +faststart -pix_fmt yuv420p "${tempPath}" -y`;

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

        // Vidu Q3 Pro supports start-and-end-frame control for true seamless
        // loops. Passing the same image as both frames produces a video that
        // returns to its starting state, removing the need for the FFmpeg
        // reverse trick. Vidu's schema declares those fields as `format: uri`
        // rather than the file-handle pattern other models use, so we encode
        // the image as a base64 data URI inline. (replicate.files.create()
        // returns an API metadata URL the model worker can't fetch.)
        const isVidu = post.visual.video.url.includes("vidu/");

        const imageBuffer = await readFile(imagePath);
        const imageDataUri = isVidu
          ? `data:image/png;base64,${imageBuffer.toString("base64")}`
          : undefined;

        const input: Record<string, unknown> = isVidu
          ? {
              start_image: imageDataUri,
              end_image: imageDataUri,
              prompt,
              duration: 5,
              resolution: "540p",
              audio: false,
            }
          : {
              fps: 24,
              image: imageBuffer,
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

        // Optimize the video. Posts with `video.loop: true` already return to
        // their starting frame, so we skip the reverse + ease-in seam-masker.
        await optimizeVideo(videoPath, post.visual.video.loop === true);
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
