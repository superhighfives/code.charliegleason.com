import { Link, useLoaderData } from "react-router";
import EditOnGitHub from "~/components/edit-on-github";
import { KudosButton } from "~/components/kudos-button";
import Metadata from "~/components/metadata";
import Metalinks from "~/components/metalinks";
import { components } from "~/components/utils/components";
import tags from "~/components/utils/tags";
import VideoMasthead from "~/components/video-masthead";
import { customMdxParse } from "~/mdx/custom-mdx-parser";
import { useMdxAttributes, useMdxComponent } from "~/mdx/mdx-hooks";
import type { PostLoaderData } from "~/mdx/types";
import { getKudosCookie, getKudosCount } from "~/utils/kudos.server";
import { processArticleDate } from "~/utils/posts";
import { highlightCode } from "~/utils/shiki.server";
import { loadMdxRuntime } from "../mdx/mdx-runtime";
import type { Route } from "./+types/post";

export async function loader({
  request,
  context,
}: Route.LoaderArgs): Promise<PostLoaderData> {
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

  // Get image from search params
  const url = new URL(request.url);
  const image = url.searchParams.get("image");

  // Select random video (0-20) if post has image enabled
  // Convert from user-facing (1-21) to internal (0-20)
  let randomVideo: number | undefined;

  if (image !== null) {
    const parsed = parseInt(image, 10);
    // Validate: must be a valid number between 1-21
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 21) {
      randomVideo = parsed - 1;
    } else if (frontmatter.image) {
      // Invalid parameter, fall back to random
      randomVideo = Math.floor(Math.random() * 21);
    }
  } else if (frontmatter.image) {
    // No parameter, use random
    randomVideo = Math.floor(Math.random() * 21);
  }

  return {
    __raw: rawContent,
    attributes: frontmatter,
    highlightedBlocks,
    kudosTotal,
    kudosYou,
    randomVideo,
  };
}

export function meta({ data, location }: Route.MetaArgs) {
  if (!data) return tags();
  const { attributes } = data;
  const searchParams = new URLSearchParams(location.search);
  const image = searchParams.get("image");
  return tags(attributes, image ? parseInt(image, 10) : undefined);
}

export function shouldRevalidate() {
  // Don't revalidate on theme changes - the content doesn't change
  return false;
}

export default function Post() {
  const {
    kudosTotal,
    kudosYou,
    randomVideo: initialVideo,
  } = useLoaderData<typeof loader>();

  const Component = useMdxComponent(components);
  const { title, data, links, date, slug, image } = useMdxAttributes();
  const { metadata, isOldArticle } = processArticleDate(data, date);

  return (
    <div className="grid gap-y-4 relative">
      {slug && initialVideo !== undefined && image && (
        <VideoMasthead slug={slug} initialVideo={initialVideo} image={image} />
      )}
      <div className="flex flex-wrap gap-y-2 font-medium max-w-[65ch]">
        <Link
          to="/"
          className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 pr-2"
        >
          ❯ cd ~/code
          <span className="hidden sm:inline">.charliegleason.com</span>
        </Link>
        <span className="text-gray-300 dark:text-gray-700 max-sm:pr-4">/</span>
        <h1 className="text-gray-900 dark:text-gray-100 leading-relaxed sm:pl-4">
          {title}
        </h1>
      </div>

      <Metadata data={metadata} />

      {isOldArticle ? (
        <p className="rounded-md overflow-hidden border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 px-4 py-3 max-w-[65ch]">
          This has not been updated in the last three months, so this
          information miiiiiight be out of date. Here be dragons, etc.
        </p>
      ) : null}
      <div className="post">
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
