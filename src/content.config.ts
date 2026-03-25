import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Schema matching existing frontmatter structure
const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/*.mdx",
    // Preserve full filename (including date prefix) as ID
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ""),
  }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    description: z.string().optional(),
    visual: z
      .object({
        prompt: z.string(),
        image: z.object({
          url: z.string(),
          version: z.string(),
          guidance: z.string().optional(),
        }),
        video: z
          .object({
            url: z.string(),
            version: z.string(),
          })
          .optional(),
        colors: z
          .array(
            z.object({
              text: z.string(),
              background: z.string(),
            }),
          )
          .optional(),
      })
      .optional(),
    tags: z.array(z.string()).optional(),
    data: z
      .record(z.string(), z.union([z.string(), z.date(), z.number()]))
      .optional(),
    links: z.record(z.string(), z.string()).optional(),
  }),
});

export const collections = { posts };
