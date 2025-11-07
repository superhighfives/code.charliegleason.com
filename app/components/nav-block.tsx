import { useRef } from "react";
import type { VisualConfig } from "~/mdx/types";
import { toUserIndex } from "~/utils/video-index";

export default function NavBlock({
  title,
  href,
  description,
  slug,
  video,
  index = 0,
  tags,
  visual,
}: {
  title: string;
  caption?: string | null;
  href: string;
  description?: string;
  slug: string;
  video: number;
  index?: number;
  tags?: string[];
  visual?: VisualConfig;
}) {
  // Viewport intersection state (starts false to match SSR)
  const elementRef = useRef<HTMLAnchorElement>(null);

  const firstItem = index === 0;

  return (
    <a
      ref={elementRef}
      href={`${href}/${toUserIndex(video)}`}
      style={{
        backgroundColor: visual?.colors?.[video]?.background || "inherit",
        color: visual?.colors?.[video]?.text || "inherit",
      }}
      className={`overflow-hidden flex flex-col group lg:border border border-gray-200 dark:border-gray-900 rounded-md hover:bg-gray-50 focus:bg-gray-50 dark:hover:bg-gray-900 dark:focus:bg-gray-900 relative before:content-[''] before:rounded-r-sm before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-transparent hover:before:bg-indigo-500 focus:before:bg-indigo-500 before:z-10 gap-2 outline-none focus-visible:ring-0 ${firstItem ? "lg:col-span-2 lg:row-span-2" : ""}`}
      rel="noreferrer"
    >
      <div className="@container flex flex-col gap-4 px-4 py-3 flex-1">
        <div className="space-y-2">
          <div className="flex justify-between relative z-10">
            <div
              className={`max-w-lg flex w-0 flex-1 flex-col items-start @md:justify-between flex-wrap @lg:flex-nowrap gap-x-2 ${description ? "gap-y-2" : "gap-y-0"}`}
            >
              <span className="text-pretty space-x-2 flex flex-col items-start xs:inline">
                <span className="pb-2 xs:pb-0 inline-block xs:inline font-semibold text-lg sm:text-base">
                  {title}
                </span>
              </span>
            </div>
          </div>
          {description ? (
            <div className="relative z-10">
              <div className="overflow-hidden text-sm max-w-lg text-current/80">
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
                className="inline-block shrink-0 text-xs font-sans border px-2 py-0.5 rounded-full border-current/30"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="relative w-full aspect-square shrink-0 overflow-hidden rounded-md xs:ml-[3px]">
        <img
          src={`/posts/${slug}/${video}.png`}
          alt={title}
          className="size-full object-cover"
        />
      </div>
    </a>
  );
}
