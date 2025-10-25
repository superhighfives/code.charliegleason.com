import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import EditOnGitHub from "~/components/edit-on-github";
import { KudosButton } from "~/components/kudos-button";
import Metadata from "~/components/metadata";
import Metalinks from "~/components/metalinks";
import { components } from "~/components/utils/components";
import tags from "~/components/utils/tags";
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

  // Select random video (0-15) if post has image enabled
  const randomVideo = frontmatter.image
    ? Math.floor(Math.random() * 21)
    : undefined;

  return {
    __raw: rawContent,
    attributes: frontmatter,
    highlightedBlocks,
    kudosTotal,
    kudosYou,
    randomVideo,
  };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) return tags();
  const { attributes } = data;
  return tags(attributes);
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
  const [currentVideo, setCurrentVideo] = useState(initialVideo);
  const [rotationCount, setRotationCount] = useState(0);
  const Component = useMdxComponent(components);
  const { title, data, links, date, slug, image } = useMdxAttributes();
  const { metadata, isOldArticle } = processArticleDate(data, date);

  const changeVideo = () => {
    setCurrentVideo(Math.floor(Math.random() * 21));
    setRotationCount((prev) => prev + 1);
  };

  return (
    <div className="grid gap-y-4 relative">
      <div className="relative -top-12 -mb-6 flex items-end gap-4 max-w-[65ch]">
        <div className="size-96 shrink-0">
          <video
            key={currentVideo}
            src={`/posts/${slug}/${currentVideo}.mp4`}
            autoPlay
            muted
            playsInline
            className="size-full shadow-lg rounded-lg -rotate-1"
          />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              "{image}"
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-[10px]">
              Generated with{" "}
              <a
                href="https://replicate.com/jakedahn/flux-latentpop"
                className="underline underline-offset-2"
              >
                flux-latentpop
              </a>{" "}
              and{" "}
              <a
                href="https://replicate.com/bytedance/seedance-1-pro-fast"
                className="underline underline-offset-2"
              >
                seedance-1-pro-fast
              </a>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={changeVideo}
            className="flex hover:cursor-pointer items-center gap-2 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 text-[10px] px-2 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          >
            <motion.div
              animate={{ rotate: rotationCount * 180 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <RefreshCw size={14} fontWeight="light" />
            </motion.div>
            <span>Change video</span>
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-y-2 font-medium max-w-[65ch]">
        <Link
          to="/"
          className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 pr-4"
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
