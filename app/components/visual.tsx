import { ChevronUp } from "lucide-react";
import { cloneElement, isValidElement, type ReactNode } from "react";

export default function Visual({
  children,
  caption,
  type,
}: {
  children: ReactNode;
  caption: string;
  type: "diagram" | "image";
}) {
  return (
    <figure className="my-10 space-y-6 [&>svg]:max-w-full [&>svg]:h-auto">
      {isValidElement(children)
        ? cloneElement(children, { alt: caption })
        : children}
      {type === "diagram" ? (
        <figcaption className="text-balance flex gap-4">
          <ChevronUp className="px-1.5 py-1.5 shrink-0 h-full box-content border rounded dark:border-gray-600" />
          <div>
            <span className="leading-relaxed border-b dark:border-gray-700 inline -ml-4 pl-4">
              {caption}
            </span>
          </div>
        </figcaption>
      ) : (
        <figcaption className="text-center leading-relaxed text-balance mb-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
