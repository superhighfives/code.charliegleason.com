import { readFile } from "node:fs/promises";
import { glob } from "glob";
import matter from "gray-matter";

// Load environment variables from .dev.vars
export async function loadEnvVars() {
  try {
    const envContent = await readFile(".dev.vars", "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join("=").trim();
        }
      }
    }
  } catch {
    console.warn("⚠️  Could not load .dev.vars file");
  }
}

export interface PostData {
  slug: string;
  title: string;
  description?: string;
  image: string;
}

export const IMAGES_PER_POST = 21; // 0-20
export const OUTPUT_DIR = "public/posts";
export const POSTS_DIR = "posts";

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
