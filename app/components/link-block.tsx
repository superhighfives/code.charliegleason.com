import { ExternalLink } from "lucide-react";

export default function LinkBlock({
  title,
  caption,
  href,
  action = "View",
  description,
}: {
  title: string;
  caption?: string | null;
  href: string;
  action?: string;
  description?: string;
}) {
  return (
    <a
      href={href}
      className="@container flex flex-col group hover:bg-gray-50 dark:hover:bg-gray-900 focus:bg-gray-50 dark:focus:bg-gray-900 relative before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-transparent hover:before:bg-indigo-500 focus:before:bg-indigo-500 px-4 py-3 gap-2 outline-none"
      rel="noreferrer"
      target={action === "Open" ? "_blank" : "_self"}
    >
      <div className="flex justify-between leading-6">
        <div
          className={`flex w-0 flex-1 flex-col @md:flex-row items-start @md:justify-between flex-wrap @lg:flex-nowrap gap-x-2 ${description ? "gap-y-2" : "gap-y-0"}`}
        >
          <span className="font-medium dark:text-gray-200 leading-5 text-pretty">
            {title}
          </span>
          {caption ? (
            <span className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500 text-xs font-sans border px-2 rounded-full border-gray-200 dark:border-gray-700">
              {caption}
            </span>
          ) : null}
        </div>
        <div className="ml-4 shrink-0">
          <span className="mt-1 font-medium text-indigo-600 group-hover:text-indigo-700 group-focus:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300 dark:group-focus:text-indigo-300 flex gap-2 items-center">
            <span className="@max-lg:hidden text-xs">{action}</span>
            {action === "Open" ? (
              <ExternalLink size={16} />
            ) : (
              <span className="leading-none -mt-px">❯</span>
            )}
          </span>
        </div>
      </div>
      {description ? (
        <div className="text-xs leading-5">
          <div className="overflow-hidden line-clamp-2 text-gray-400 dark:text-gray-500">
            {description}
          </div>
        </div>
      ) : null}
    </a>
  );
}
