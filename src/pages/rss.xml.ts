import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import rehypeStringify from "rehype-stringify";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

async function mdxToHtml(mdxContent: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(mdxContent);

  return String(result);
}

export const GET: APIRoute = async (context) => {
  const posts = await getCollection("posts");

  // Filter to only posts with dates in filename, then sort by date (newest first)
  const sortedPosts = posts
    .map((post) => {
      const dateMatch = post.id.match(/^(\d{4}-\d{2}-\d{2})\./);
      return dateMatch ? { ...post, date: new Date(dateMatch[1]) } : null;
    })
    .filter((post): post is NonNullable<typeof post> => post !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  // Render MDX to HTML for content:encoded
  const postsWithHtml = await Promise.all(
    sortedPosts.map(async (post) => ({
      post,
      html: await mdxToHtml(post.body ?? ""),
    })),
  );

  return rss({
    title: "code.charliegleason.com",
    description:
      "Code, resources, and thoughts on design and front-end development",
    site: context.site ?? "https://code.charliegleason.com",
    trailingSlash: false,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
    customData: [
      `<language>en-us</language>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<atom:link href="${context.site ?? "https://code.charliegleason.com"}/rss.xml" rel="self" type="application/rss+xml"/>`,
    ].join(""),
    items: postsWithHtml.map(({ post, html }) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.date,
      // No trailing slash — matches original production output
      link: `/${post.data.slug}`,
      content: html,
    })),
  });
};
