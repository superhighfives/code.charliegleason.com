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
      className={`${hero ? "justify-center" : "justify-between sm:flex-col"} flex-col-reverse @container text-[var(--text)] bg-[var(--background)] overflow-hidden flex group rounded-md relative ring-transparent ring-offset-1 dark:ring-offset-gray-950 hover:ring-[var(--background)] hover:ring-3 focus:ring-[var(--background)] focus:ring-3 outline-none ${className}`}
      rel="noreferrer"
    >
      <div
        className={`flex flex-col gap-4 p-4 ${hero ? "flex-0" : "h-auto flex-1 justify-between"}`}
      >
        <div className="space-y-2">
          <div className="flex justify-between relative z-10">
            <div
              className={`max-w-2xl flex w-0 flex-1 flex-col items-start flex-wrap gap-x-2 ${description ? "gap-y-2" : "gap-y-0"}`}
            >
              <div className="text-xs relative whitespace-nowrap w-full z-10 flex gap-2 items-center overflow-hidden [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]">
                {caption ? (
                  <span
                    className={`px-1.5 rounded-full ${oldArticle ? "border border-[var(--text)]/30 text-[var(--text)]" : "bg-[var(--text)] text-[var(--background)]"}`}
                  >
                    {caption}
                  </span>
                ) : null}
                {tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 border rounded-full border-current/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div
                className={`text-pretty space-x-2 flex flex-col items-start font-semibold ${hero ? "text-2xl sm:text-4xl" : "text-lg sm:text-2xl"}`}
              >
                {title}
              </div>
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
      </div>
      <div
        className={`${hero ? "sm:-mb-24" : "sm:mb-0"} -mb-8 flex items-center justify-center relative w-full aspect-square shrink-0 overflow-hidden rounded-md`}
      >
        <img
          src={`/posts/${slug}/${index}.png`}
          alt={title}
          className={`${hero ? "mask-b-from-75% mask-b-to-95%" : "mask-t-from-95% mask-t-to-100%"}`}
        />
      </div>
    </a>
  );
}
