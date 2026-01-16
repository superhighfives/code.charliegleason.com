import { useRef } from "react";
import { Link, useNavigation } from "react-router";
import { MAX_WIDTH_CLASS } from "~/config/constants";
import type { Post, VisualConfig } from "~/mdx/types";
import { toUserIndex } from "~/utils/video-index";

export default function NavBlock({
  post,
  index,
  visual,
  caption,
  className,
  hero,
  oldArticle,
}: {
  post: Post;
  index: number;
  visual?: VisualConfig;
  caption?: string | null;
  className?: string;
  hero?: boolean;
  oldArticle?: boolean;
}) {
  const { title, description, url, slug, tags, excerpt } = post;
  const navigation = useNavigation();

  // Viewport intersection state (starts false to match SSR)
  const elementRef = useRef<HTMLAnchorElement>(null);

  // Check if this specific nav-block is being navigated to
  const targetPath = `${url}/${toUserIndex(index)}`;
  const isNavigating =
    navigation.state === "loading" &&
    (navigation.location?.pathname === targetPath ||
      navigation.location?.pathname === url);

  return (
    <Link
      ref={elementRef}
      to={targetPath}
      viewTransition
      prefetch="intent"
      style={
        {
          "--background": visual?.colors?.[index]?.background || "inherit",
          "--text": visual?.colors?.[index]?.text || "inherit",
        } as React.CSSProperties
      }
      className={`nav-block ${hero ? "justify-center" : "justify-between sm:flex-col"} flex-col-reverse @container text-[var(--text)] bg-[var(--background)] overflow-hidden flex group rounded-md relative ring-transparent ring-offset-1 dark:ring-offset-gray-950 hover:ring-[var(--background)] hover:ring-3 focus-visible:ring-[var(--background)] focus-visible:ring-3 outline-none transition-opacity duration-300 ${className}`}
    >
      {isNavigating && (
        <div className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-md">
          <div className="w-10 h-10 border-3 border-[var(--text)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className={`flex flex-col p-4 flex-1 min-h-0 justify-between`}>
        <div className="space-y-2 sm:space-y-4 flex-shrink-0">
          <div className="flex justify-between relative z-10">
            <div
              className={`${MAX_WIDTH_CLASS} flex w-0 flex-1 flex-col items-start flex-wrap gap-x-2 ${description ? "gap-y-2" : "gap-y-0"}`}
            >
              <div className="text-xs relative whitespace-nowrap w-full z-10 flex gap-2 items-center overflow-hidden [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]">
                {caption ? (
                  <span
                    className={`font-semibold px-2 rounded-full ${oldArticle ? "border border-[var(--text)]/30 text-[var(--text)]" : "bg-[var(--text)] text-[var(--background)]"}`}
                  >
                    {caption}
                  </span>
                ) : null}
                {tags?.map((tag) => (
                  <span
                    key={tag}
                    className="font-semibold px-1.5 border rounded-full border-current/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div
                className={`font-heading text-pretty space-x-2 flex flex-col items-start font-semibold ${hero ? "text-3xl sm:text-4xl" : "text-3xl sm:text-3xl sm:leading-8"}`}
              >
                {title}
              </div>
            </div>
          </div>
          {description ? (
            <div className="relative z-10">
              <div
                className={`overflow-hidden ${hero ? "sm:text-lg" : "text-sm"} max-w-lg text-current/80 font-mono font-semibold`}
              >
                {description}
              </div>
            </div>
          ) : null}
        </div>
        {hero && excerpt ? (
          <div className="flex-1 min-h-0 relative overflow-hidden mt-4">
            <div className="absolute inset-0 flex pointer-events-none mask-b-from-80% mask-b-to-100%">
              <div
                className={`${MAX_WIDTH_CLASS} text-base text-current/50 leading-relaxed whitespace-pre-wrap h-fit`}
              >
                {excerpt}
              </div>
            </div>
          </div>
        ) : null}
        {hero ? (
          <div className="md:pt-8">
            <span className="absolute bottom-0 rounded-t-sm self-start px-4 py-2 bg-[var(--text)]/90 text-[var(--background)] font-semibold max-md:hidden">
              Read more
            </span>
          </div>
        ) : null}
      </div>
      <div
        className={`${hero ? "sm:-mb-48" : "sm:mb-0"} -mb-8 flex items-center justify-center relative w-full aspect-square shrink-0 overflow-hidden rounded-md`}
      >
        <img
          src={`/posts/${slug}/${index}.png`}
          alt={title}
          className={`${hero ? "mask-b-from-40% mask-b-to-80%" : "max-sm:mask-b-to-100% max-sm:mask-b-from-80% sm:mask-t-from-95% sm:mask-t-to-100%"}`}
        />
      </div>
    </Link>
  );
}
