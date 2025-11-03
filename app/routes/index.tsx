import { differenceInMonths, formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { About } from "~/components/about";
import NavBlock from "~/components/nav-block";
import tags from "~/components/utils/tags";
import { loadAllMdxRuntime } from "~/mdx/mdx-runtime";
import type { Post } from "~/mdx/types";
import { randomVideoIndex } from "~/utils/video-index";

export const meta: MetaFunction = () => tags();

export async function loader() {
  const posts = await loadAllMdxRuntime();

  // Sort posts by published date (newest first)
  const sortedPosts = posts
    .filter((post) => post.date)
    .sort((a: Post, b: Post) => {
      if (!a.date || !b.date) return 0;
      return b.date.getTime() - a.date.getTime();
    });

  // Generate random initial videos for each post
  // These are just for display; the redirect handler will set cookies on click
  const initialVideos: Record<string, number> = {};
  for (const post of sortedPosts) {
    initialVideos[post.slug] = randomVideoIndex();
  }

  return { posts: sortedPosts, initialVideos };
}

export default function Index() {
  const { posts, initialVideos } = useLoaderData<typeof loader>();

  // Preload initial videos for first 5 visible posts with high priority
  useEffect(() => {
    const visiblePosts = posts.slice(0, 5);
    visiblePosts.forEach((post) => {
      fetch(`/posts/${post.slug}/${initialVideos[post.slug]}.mp4`, {
        priority: "high",
      } as RequestInit).catch(() => {});
    });
  }, [posts, initialVideos]);

  return (
    <div className="grid gap-4 sm:gap-8 max-w-[65ch] content-end h-full">
      <h1 className="text-gray-400 dark:text-gray-500">
        ❯ cd ~/code.charliegleason.com
      </h1>
      <About />
      <div className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950 grid gap-4">
        <div className="rounded-md overflow-hidden shadow-sm divide-y divide-gray-100 dark:divide-gray-900 border border-gray-200 dark:border-gray-800">
          {posts.length ? (
            posts.map((post, index) => {
              const dateCaption =
                post.date && differenceInMonths(new Date(), post.date) <= 3
                  ? `${formatDistanceToNow(post.date)} ago`
                  : null;
              return (
                <NavBlock
                  key={post.slug}
                  title={post.title}
                  description={post.description}
                  caption={dateCaption}
                  href={post.url}
                  slug={post.slug}
                  initialVideo={initialVideos[post.slug]}
                  index={index}
                />
              );
            })
          ) : (
            <p className="flex items-center p-4 leading-6 text-gray-400">
              No posts found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
