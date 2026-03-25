import { type ReactNode, useEffect, useState } from "react";
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

// Inner component that uses hooks - only rendered client-side
function LinkInlineClient({
  href,
  children,
  text,
}: {
  href: string;
  children: ReactNode;
  text: string;
}) {
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

// SSR-safe wrapper
export default function LinkInline({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const text = getTextContent(children);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSR fallback - plain link without scramble
  if (!mounted) {
    return (
      <a
        href={href}
        className="link-primary focus-ring-primary decoration-clone"
      >
        {children}
      </a>
    );
  }

  return (
    <LinkInlineClient href={href} text={text}>
      {children}
    </LinkInlineClient>
  );
}
