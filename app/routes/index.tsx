import { differenceInMonths, formatDistanceToNow } from "date-fns";
import type { MetaFunction } from "react-router";
import { data, useLoaderData } from "react-router";
import { About } from "~/components/about";
import NavBlock from "~/components/nav-block";
import tags from "~/components/utils/tags";
import { loadAllMdxRuntime } from "~/mdx/mdx-runtime";
import type { Post } from "~/mdx/types";
import { randomVideoIndex } from "~/utils/video-index";
import type { Route } from "./+types/index";

export const meta: MetaFunction = () => tags();

export async function loader({ request }: Route.LoaderArgs) {
  const posts = await loadAllMdxRuntime();

  // Sort posts by published date (newest first)
  const sortedPosts = posts
    .filter((post) => post.date)
    .sort((a: Post, b: Post) => {
      if (!a.date || !b.date) return 0;
      return b.date.getTime() - a.date.getTime();
    });

  // Read existing cookies
  const cookieHeader = request.headers.get("Cookie");
  const initialVideos: Record<string, number> = {};
  const newCookies: string[] = [];

  // For each post, check if cookie exists, otherwise generate random
  for (const post of sortedPosts) {
    const cookieName = `visual-index-${post.slug}`;
    let videoIndex: number | null = null;

    // Try to read from cookie
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
      if (match) {
        const value = Number.parseInt(match[1], 10);
        if (!Number.isNaN(value) && value >= 0 && value <= 20) {
          videoIndex = value;
        }
      }
    }

    // If no cookie exists, generate random and prepare cookie header
    if (videoIndex === null) {
      videoIndex = randomVideoIndex();
      newCookies.push(
        `${cookieName}=${videoIndex}; path=/; samesite=lax`,
      );
    }

    initialVideos[post.slug] = videoIndex;
  }

  // Return data with Set-Cookie headers for new cookies
  const headers = new Headers();
  for (const cookie of newCookies) {
    headers.append("Set-Cookie", cookie);
  }

  return data(
    { posts: sortedPosts, initialVideos },
    { headers: newCookies.length > 0 ? headers : undefined },
  );
}

export default function Index() {
  const { posts, initialVideos } = useLoaderData<typeof loader>();

  return (
    <div className="grid gap-4 sm:gap-8 max-w-[65ch] content-end h-full">
      <h1 className="text-gray-400 dark:text-gray-500">
        ❯ cd ~/code.charliegleason.com
      </h1>
      <About />
      <div className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950 grid gap-4">
        <div className="rounded-md overflow-hidden shadow-sm divide-y divide-gray-100 dark:divide-gray-900 border border-gray-200 dark:border-gray-800">
          {posts.length ? (
            posts.map((post) => {
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
