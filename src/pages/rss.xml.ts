import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const posts = await getCollection("posts");

  // Filter to only posts with dates in filename, then sort by date (newest first)
  const sortedPosts = posts
    .map((post) => {
      // Extract date from filename (YYYY-MM-DD.slug.mdx)
      const dateMatch = post.id.match(/^(\d{4}-\d{2}-\d{2})\./);
      return dateMatch ? { ...post, date: new Date(dateMatch[1]) } : null;
    })
    .filter((post): post is NonNullable<typeof post> => post !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return rss({
    title: "code.charliegleason.com",
    description:
      "Code, resources, and thoughts on design and front-end development",
    site: context.site ?? "https://code.charliegleason.com",
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.date,
      link: `/${post.data.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
};
