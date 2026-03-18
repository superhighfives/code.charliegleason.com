import type { ReactNode } from "react";
import { useScramble } from "use-scramble";
import { scrambleOptions } from "~/utils/scramble";

// Helper to extract text from ReactNode children
function getTextContent(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return children.toString();
  }
  if (Array.isArray(children)) {
    return children.map(getTextContent).join("");
  }
  if (children && typeof children === "object" && "props" in children) {
    return getTextContent(
      (children as { props?: { children?: ReactNode } }).props?.children,
    );
  }
  return "";
}

export default function LinkInline({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const text = getTextContent(children);

  const { ref, replay } = useScramble({
    ...scrambleOptions,
    text,
  });

  return (
    <a
      ref={ref}
      href={href}
      onMouseEnter={replay}
      onFocus={replay}
      className="link-primary focus-ring-primary decoration-clone"
    >
      {children}
    </a>
  );
}
