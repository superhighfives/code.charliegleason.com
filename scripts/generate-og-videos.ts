import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { getPosts, IMAGES_PER_POST, OUTPUT_DIR } from "./utils";

const execAsync = promisify(exec);

/**
 * Generates animated versions of the social card for og:video.
 *
 * Each video is the static og:image card (rendered by the running app at
 * /:slug/:index.png) with the post's visual loop composited over the right
 * half, so the link preview poster and the video line up exactly.
 *
 * Requires the production build to be running (the dev server serves .png
 * requests as static files, so cards 404 there). BASE_URL defaults to
 * `pnpm preview`.
 *
 * Usage:
 *   pnpm preview                  # in another terminal
 *   pnpm generate:og-videos       # only missing videos
 *   pnpm generate:og-videos --force
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4173";
const FORCE = process.argv.includes("--force");

// Must match the layout in app/routes/resources/og-image.tsx
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const VISUAL_X = 600;
const VISUAL_WIDTH = 600;
// The card fades the visual's left edge over 10px, but the video model drifts
// the background colour slightly, so the video needs a wider fade to hide
// the seam
const FADE_WIDTH = 80;
const FPS = 30;

async function fetchCard(slug: string, index: number, path: string) {
  // Card URLs are user-facing (1-based)
  const response = await fetch(`${BASE_URL}/${slug}/${index + 1}.png`);
  if (!response.ok) {
    throw new Error(`Card request failed: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const { width, height } = await sharp(buffer).metadata();
  if (width !== CARD_WIDTH || height !== CARD_HEIGHT) {
    throw new Error(`Unexpected card size ${width}x${height}`);
  }
  await writeFile(path, buffer);
  return buffer;
}

async function backgroundColor(card: Buffer) {
  // Top-left pixel is always the card background
  const { data } = await sharp(card)
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return [data[0], data[1], data[2]]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("");
}

async function composite(
  cardPath: string,
  videoPath: string,
  color: string,
  outputPath: string,
) {
  // Videos are square: scale to card height and centre-crop to the visual
  // column, matching the card's objectFit: cover
  const cropX = (CARD_HEIGHT - VISUAL_WIDTH) / 2;
  const filter = [
    `[1:v]scale=${CARD_HEIGHT}:${CARD_HEIGHT},crop=${VISUAL_WIDTH}:${CARD_HEIGHT}:${cropX}:0,fps=${FPS}[visual]`,
    `[0:v][visual]overlay=${VISUAL_X}:0:shortest=1[base]`,
    `color=c=0x${color}:s=${FADE_WIDTH}x${CARD_HEIGHT},format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*(0.5+0.5*cos(PI*X/${FADE_WIDTH}))'[fade]`,
    `[base][fade]overlay=${VISUAL_X}:0:shortest=1,format=yuv420p[v]`,
  ].join(";");

  await execAsync(
    `ffmpeg -loop 1 -framerate ${FPS} -i "${cardPath}" -i "${videoPath}" -filter_complex "${filter}" -map "[v]" -an -c:v libx264 -crf 26 -preset slow -movflags +faststart "${outputPath}" -y`,
    { maxBuffer: 50 * 1024 * 1024 },
  );
}

async function main() {
  try {
    await fetch(BASE_URL);
  } catch {
    console.error(
      `❌ App isn't reachable at ${BASE_URL}. Run pnpm preview first.`,
    );
    process.exit(1);
  }

  const posts = await getPosts();
  let generated = 0;

  for (const post of posts) {
    const postDir = join(OUTPUT_DIR, post.slug);
    if (!existsSync(postDir)) continue;

    const files = await readdir(postDir);
    const indices = Array.from({ length: IMAGES_PER_POST }, (_, i) => i).filter(
      (i) => files.includes(`${i}.mp4`),
    );
    if (indices.length === 0) continue;

    const ogDir = join(postDir, "og");
    await mkdir(ogDir, { recursive: true });

    console.log(`\n🎬 ${post.slug}`);

    for (const index of indices) {
      const outputPath = join(ogDir, `${index}.mp4`);
      if (!FORCE && existsSync(outputPath)) {
        console.log(`   ✓ ${index}.mp4 exists`);
        continue;
      }

      const cardPath = join(ogDir, `${index}.card.png`);
      try {
        const card = await fetchCard(post.slug, index, cardPath);
        const color = await backgroundColor(card);
        await composite(
          cardPath,
          join(postDir, `${index}.mp4`),
          color,
          outputPath,
        );
        const { size } = await stat(outputPath);
        console.log(`   ✅ ${index}.mp4 (${Math.round(size / 1024)}KB)`);
        generated++;
      } catch (error) {
        console.error(`   ❌ ${index}.mp4:`, error);
      } finally {
        await rm(cardPath, { force: true });
      }
    }
  }

  console.log(`\n✨ Generated ${generated} social card videos`);
}

main();
