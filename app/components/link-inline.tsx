import { useScramble } from "use-scramble";
import { scrambleOptions } from "./utils/scramble";

export default function LinkInline({
  href,
  children,
}: {
  href: string;
  children: string | number;
}) {
  const { ref, replay } = useScramble({
    ...scrambleOptions,
    text: children.toString(),
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
