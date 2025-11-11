import { useRef } from "react";
import type { Post, VisualConfig } from "~/mdx/types";
import { toUserIndex } from "~/utils/video-index";

export default function NavBlock({
  post,
  index,
  visual,
  caption,
  className,
  hero,
}: {
  post: Post;
  index: number;
  visual?: VisualConfig;
  caption?: string | null;
  className?: string;
  hero?: boolean;
}) {
  const { title, description, url, slug, tags } = post;

  // Viewport intersection state (starts false to match SSR)
  const elementRef = useRef<HTMLAnchorElement>(null);

  return (
    <a
      ref={elementRef}
      href={`${url}/${toUserIndex(index)}`}
      style={
        {
          "--background": visual?.colors?.[index]?.background || "inherit",
          "--text": visual?.colors?.[index]?.text || "inherit",
        } as React.CSSProperties
      }
      className={`@container text-[var(--text)] bg-[var(--background)] overflow-hidden flex flex-col group justify-between rounded-md relative ring-transparent ring-offset-4 dark:ring-offset-gray-950 hover:ring-[var(--background)] hover:ring-2 focus:ring-2 gap-2 outline-none ${className}`}
      rel="noreferrer"
    >
      <div
        className={`flex flex-col gap-4 px-4 py-3 ${hero ? "flex-0" : "h-auto"}`}
      >
        <div className="space-y-2">
          <div className="flex justify-between relative z-10">
            <div
              className={`max-w-lg flex w-0 flex-1 flex-col items-start flex-wrap gap-x-2 ${description ? "gap-y-2" : "gap-y-0"}`}
            >
              {caption ? (
                <span className="text-xs font-sans bg-[var(--text)] text-[var(--background)] px-2 py-0.5 rounded-full">
                  {caption}
                </span>
              ) : null}
              <span className="text-pretty space-x-2 flex flex-col items-start font-semibold text-lg sm:text-2xl">
                {title}
              </span>
            </div>
          </div>
          {description ? (
            <div className="relative z-10">
              <div className="overflow-hidden text-sm max-w-lg text-current/80 font-mono font-semibold">
                {description}
              </div>
            </div>
          ) : null}
        </div>
        {tags && tags.length > 0 ? (
          <div className="relative z-10 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-block shrink-0 text-xs font-sans border px-1 rounded-full border-current"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div
        className={`flex items-center justify-center relative w-full aspect-square shrink-0 overflow-hidden rounded-md`}
      >
        <img
          src={`/posts/${slug}/${index}.png`}
          alt={title}
          className={`${hero ? "mask-b-from-95% mask-b-to-100%" : "mask-t-from-95% mask-t-to-100%"}`}
        />
      </div>
    </a>
  );
}
