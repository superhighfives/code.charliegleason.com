import { readFile } from "node:fs/promises";
import { glob } from "glob";
import matter from "gray-matter";

export interface PostData {
  slug: string;
  title: string;
  description?: string;
  image: string;
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

    // Only include posts with image as a string (the prompt description)
    if (typeof data.image === "string" && data.image.trim()) {
      posts.push({
        slug: data.slug || filePath.split("/").pop()?.replace(".mdx", "") || "",
        title: data.title || "Untitled",
        description: data.description,
        image: data.image,
      });
    }
  }

  return posts;
}
