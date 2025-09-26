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
      className="flex flex-col group hover:bg-gray-50 dark:hover:bg-gray-900 relative before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-transparent hover:before:bg-indigo-500 px-4 py-3 gap-1"
      rel="noreferrer"
      target={action === "Open" ? "_blank" : "_self"}
    >
      <div className="flex items-center justify-between leading-6">
        <div className="flex w-0 flex-1 items-center">
          <div className="flex min-w-0 flex-1 gap-4 items-center">
            <span className="truncate font-medium dark:text-gray-200">
              {title}
            </span>
            {caption ? (
              <span className="shrink-0 text-gray-400 dark:text-gray-500 text-xs">
                {caption}
              </span>
            ) : null}
          </div>
        </div>
        <div className="ml-4 shrink-0">
          <span className="font-medium text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300 flex gap-2 items-center">
            <span className="max-sm:hidden">{action}</span>
            <span className="items-center gap-2">
              {action === "Open" ? <ExternalLink size={16} /> : <span>❯</span>}
            </span>
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
