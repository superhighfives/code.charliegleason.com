import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { glob } from "glob";
import matter from "gray-matter";
import Replicate from "replicate";

// Load environment variables from .dev.vars
async function loadEnvVars() {
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

// Load env vars before accessing them
await loadEnvVars();

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const IMAGES_PER_POST = 21; // 0-20
const OUTPUT_DIR = "public/posts";
const POSTS_DIR = "posts";

interface PostData {
  slug: string;
  title: string;
  description?: string;
  image: string;
}

async function main() {
  if (!REPLICATE_API_TOKEN) {
    console.error("❌ REPLICATE_API_TOKEN environment variable is required");
    process.exit(1);
  }

  console.log("🎨 Starting AI image generation...\n");

  const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
  });

  // Find all MDX files in posts directory
  const mdxFiles = await glob(`${POSTS_DIR}/**/*.mdx`);

  // Parse frontmatter from each MDX file
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

  console.log(`📚 Found ${posts.length} posts with image generation enabled\n`);

  for (const post of posts) {
    console.log(`\n📝 Processing: ${post.title}`);
    console.log(`   Slug: ${post.slug}`);

    const postDir = join(OUTPUT_DIR, post.slug);

    // Create directory if it doesn't exist
    if (!existsSync(postDir)) {
      await mkdir(postDir, { recursive: true });
      console.log(`   ✓ Created directory: ${postDir}`);
    }

    // Check which images are missing
    const existingImages = existsSync(postDir) ? await readdir(postDir) : [];

    const existingIndices = new Set(
      existingImages
        .filter((file) => file.match(/^\d+\.png$/))
        .map((file) => Number.parseInt(file.replace(".png", ""))),
    );

    const missingIndices = Array.from(
      { length: IMAGES_PER_POST },
      (_, i) => i,
    ).filter((i) => !existingIndices.has(i));

    if (missingIndices.length === 0) {
      console.log(`   ✓ All ${IMAGES_PER_POST} images already exist`);
      continue;
    }

    console.log(
      `   📊 Missing ${missingIndices.length} images: [${missingIndices.join(", ")}]`,
    );

    // Generate missing images
    for (const index of missingIndices) {
      const imagePath = join(postDir, `${index}.png`);

      try {
        console.log(`   🎨 Generating image ${index}...`);

        // Use the image field as the prompt description
        const prompt = `${post.image}, solid background, LTNP style`;

        console.log(`   📝 Prompt: ${prompt}`);

        const output = (await replicate.run(
          "jakedahn/flux-latentpop:c5e4432e01d30a523f9ebf1af1ad9f7ce82adc6709ec3061a817d53ff3bb06cc",
          {
            input: {
              prompt,
              output_format: "png",
              aspect_ratio: "1:1", // 1024x1024
            },
          },
        )) as string | string[];

        // Handle output - it might be a URL string or array of URLs
        const imageUrl = Array.isArray(output) ? output[0] : output;

        if (!imageUrl) {
          throw new Error("No image URL returned from Replicate");
        }

        // Download the image
        console.log(`   📥 Downloading from: ${imageUrl}`);
        const response = await fetch(imageUrl);

        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        await writeFile(imagePath, buffer);

        console.log(`   ✅ Saved: ${imagePath}`);
      } catch (error) {
        console.error(`   ❌ Failed to generate image ${index}:`, error);
      }
    }
  }

  console.log("\n\n✨ Image generation complete!\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
