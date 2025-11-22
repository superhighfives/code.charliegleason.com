import { data, Link, useLoaderData } from "react-router";
import EditOnGitHub from "~/components/edit-on-github";
import { KudosButton } from "~/components/kudos-button";
import Metadata from "~/components/metadata";
import Metalinks from "~/components/metalinks";
import { components } from "~/components/utils/components";
import metatags from "~/components/utils/metatags";
import VideoMasthead from "~/components/video-masthead";
import { customMdxParse } from "~/mdx/custom-mdx-parser";
import { useMdxAttributes, useMdxComponent } from "~/mdx/mdx-hooks";
import { getKudosCookie, getKudosCount } from "~/utils/kudos.server";
import { processArticleData } from "~/utils/posts";
import { highlightCode } from "~/utils/shiki.server";
import {
  parseImageIndex,
  randomVideoIndex,
  randomVideoIndexExcluding,
  VISUAL_COUNT,
} from "~/utils/video-index";
import { loadMdxRuntime } from "../mdx/mdx-runtime";
import type { Route } from "./+types/post";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { content, frontmatter } = await loadMdxRuntime(request.url);
  const rawContent = content as string;

  // Pre-process code blocks
  const ast = customMdxParse(rawContent);
  const highlightedBlocks: Record<string, string> = {};

  // Find all code blocks and highlight them (skip live blocks)
  let blockIndex = 0;
  for (const node of ast.children) {
    if (node.type === "code" && node.value) {
      // Skip live code blocks
      if (node.meta?.includes("live")) {
        continue;
      }
      const key = `code-block-${blockIndex}`;
      highlightedBlocks[key] = await highlightCode(
        node.value,
        node.lang || "text",
      );
      blockIndex++;
    }
  }

  // Fetch kudos data for this post
  const kudosTotal = frontmatter.slug
    ? await getKudosCount(frontmatter.slug, request, context.cloudflare.env)
    : 0;

  const kudosYou = frontmatter.slug
    ? getKudosCookie(request, frontmatter.slug)
    : 0;

  // Get image from path params and validate
  // The index param is optional - only present when navigating from shared links
  const imageParam = "index" in params ? params.index : undefined;
  const parsedIndex = parseImageIndex(imageParam);

  // Get image index from cookie (set by redirect handler or video-masthead)
  const cookieHeader = request.headers.get("Cookie");
  let cookieIndex: number | null = null;
  if (frontmatter.slug && cookieHeader) {
    const cookieName = `visual-index-${frontmatter.slug}`;
    const match = cookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
    if (match) {
      const value = Number.parseInt(match[1], 10);
      if (!Number.isNaN(value) && value >= 0 && value < VISUAL_COUNT) {
        cookieIndex = value;
      }
    }
  }

  // Determine which video to show (internal index)
  // Priority: URL param > Cookie > Random
  let randomVideo: number | undefined;
  let nextVideo: number | undefined;
  let shouldDeleteCookie = false;

  if (parsedIndex !== null) {
    // Valid URL parameter provided (share link via redirect)
    randomVideo = parsedIndex;
  } else if (cookieIndex !== null && frontmatter.visual) {
    // Use cookie value (set by redirect handler on navigation from index)
    randomVideo = cookieIndex;
    // Delete the cookie after reading it so refresh generates a new random video
    shouldDeleteCookie = true;
  } else if (frontmatter.visual) {
    // No parameter or cookie - generate random (refresh or first visit scenario)
    randomVideo = randomVideoIndex();
  }

  // Pre-generate next video on server to prevent hydration mismatch
  if (randomVideo !== undefined && frontmatter.visual) {
    nextVideo = randomVideoIndexExcluding(randomVideo);
  }

  // Calculate isOldArticle on server to prevent hydration mismatch
  const currentDate = new Date();
  const { isOldArticle } = processArticleData({
    frontmatter,
    currentDate,
  });

  const responseData = {
    __raw: rawContent,
    attributes: frontmatter,
    highlightedBlocks,
    kudosTotal,
    kudosYou,
    randomVideo,
    nextVideo,
    isOldArticle,
  };

  // If we used the cookie, delete it so next refresh is random
  if (shouldDeleteCookie && frontmatter.slug) {
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `visual-index-${frontmatter.slug}=; path=/; max-age=0; samesite=lax`,
    );
    return data(responseData, { headers });
  }

  return data(responseData);
}

export function meta({ data, params }: Route.MetaArgs) {
  if (!data) return metatags();
  const { attributes } = data;
  // The index param is optional - only present when navigating from shared links
  const imageParam =
    "index" in params ? (params.index as string | undefined) : undefined;
  const parsedIndex = parseImageIndex(imageParam ?? null);
  // Convert internal index back to user-facing for meta tags
  return metatags(
    attributes,
    parsedIndex !== null ? parsedIndex + 1 : undefined,
  );
}

export function shouldRevalidate() {
  // Don't revalidate on theme changes - the content doesn't change
  return false;
}

export default function Post() {
  const {
    kudosTotal,
    kudosYou,
    randomVideo: video,
    nextVideo,
    isOldArticle,
  } = useLoaderData<typeof loader>();

  const Component = useMdxComponent(components);
  const frontmatter = useMdxAttributes();
  const { title, links, date, slug, visual } = frontmatter;
  const { metadata } = processArticleData({ frontmatter });

  return (
    <div className="grid gap-y-4 relative">
      {slug && video !== undefined && nextVideo !== undefined && visual && (
        <VideoMasthead
          slug={slug}
          video={video}
          nextVideo={nextVideo}
          visual={visual}
        />
      )}
      <div
        className="flex flex-wrap gap-y-2 max-w-xl"
        style={{ viewTransitionName: "post-breadcrumb" }}
      >
        <Link
          to="/"
          viewTransition
          prefetch="intent"
          className="font-mono font-semibold group link-primary focus-ring-primary pr-2"
        >
          ❯ cd ~/code
          <span className="hidden sm:inline">.</span>
          <span className="hidden sm:inline">charliegleason</span>
          <span className="hidden sm:inline">.com</span>
        </Link>
        <span className="text-gray-300 dark:text-gray-700 max-sm:pr-4">/</span>
        <h1 className="font-semibold text-gray-900 dark:text-gray-100 sm:pl-4 text-3xl w-full">
          {title}
        </h1>
      </div>

      <Metadata
        data={metadata}
        style={{ viewTransitionName: "post-metadata" }}
      />

      {isOldArticle ? (
        <p className="font-mono rounded-md overflow-hidden border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 px-4 py-3 max-w-xl">
          This has not been updated in the last three months, so this
          information miiiiiight be out of date. Here be dragons, etc.
        </p>
      ) : null}
      <div className="post" style={{ viewTransitionName: "post-content" }}>
        <Component />
      </div>
      {slug && (
        <div className="flex flex-wrap justify-start sm:px-4 items-center gap-4">
          <KudosButton
            slug={slug}
            initialTotal={kudosTotal}
            initialYou={kudosYou}
          />
          {date && <EditOnGitHub date={date} slug={slug} />}
        </div>
      )}
      <Metalinks links={links} />
    </div>
  );
}
