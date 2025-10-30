import { readFile } from "node:fs/promises";
import { glob } from "glob";
import matter from "gray-matter";
import { extractModelName } from "../app/utils/replicate.js";

export interface ModelConfig {
  url: string;
  version: string;
  guidance?: string;
}

export interface VisualConfig {
  prompt: string;
  image: ModelConfig;
  video: ModelConfig;
}

export interface PostData {
  slug: string;
  title: string;
  description?: string;
  visual: VisualConfig;
}

export const IMAGES_PER_POST = 21; // 0-20
export const OUTPUT_DIR = "public/posts";
export const POSTS_DIR = "posts";

// Image validation constants
export const COLOR_THRESHOLD = 15; // RGB units tolerance for "very close" colors (per-channel, legacy)
export const PERCEPTUAL_COLOR_THRESHOLD = 30; // Euclidean distance threshold in RGB space for perceptual color difference
export const LEFT_EDGE_WIDTH = 5; // Number of pixels from left edge to sample
export const SOLID_EDGE_PERCENTAGE = 0.95; // 95% of pixels must be within threshold for a solid edge

// Parse all MDX posts and extract metadata
export async function getPosts(): Promise<PostData[]> {
  const mdxFiles = await glob(`${POSTS_DIR}/**/*.mdx`);
  const posts: PostData[] = [];

  for (const filePath of mdxFiles) {
    const fileContent = await readFile(filePath, "utf-8");
    const { data } = matter(fileContent);

    // Only include posts with visual config (prompt + image + video models)
    if (data.visual && typeof data.visual === "object") {
      const visual = data.visual;

      // Validate required fields exist
      if (!visual.prompt || typeof visual.prompt !== "string" || !visual.prompt.trim()) {
        throw new Error(
          `Post ${filePath} has a visual field but missing or invalid prompt`
        );
      }

      if (!visual.image || typeof visual.image !== "object") {
        throw new Error(
          `Post ${filePath} has a visual field but missing or invalid image config`
        );
      }

      if (!visual.video || typeof visual.video !== "object") {
        throw new Error(
          `Post ${filePath} has a visual field but missing or invalid video config`
        );
      }

      // Validate image model config
      if (!visual.image.url || !visual.image.version) {
        throw new Error(
          `Post ${filePath} has invalid image config (missing url or version)`
        );
      }

      // Validate video model config
      if (!visual.video.url || !visual.video.version) {
        throw new Error(
          `Post ${filePath} has invalid video config (missing url or version)`
        );
      }

      posts.push({
        slug: data.slug || filePath.split("/").pop()?.replace(".mdx", "") || "",
        title: data.title || "Untitled",
        description: data.description,
        visual: {
          prompt: visual.prompt,
          image: {
            url: visual.image.url,
            version: visual.image.version,
            ...(visual.image.guidance && { guidance: visual.image.guidance }),
          },
          video: {
            url: visual.video.url,
            version: visual.video.version,
            ...(visual.video.guidance && { guidance: visual.video.guidance }),
          },
        },
      });
    }
  }

  return posts;
}
