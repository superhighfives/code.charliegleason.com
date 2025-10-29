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
    text: children?.toString(),
  });

  return (
    <a
      ref={ref}
      onMouseOver={replay}
      onFocus={replay}
      href={href}
      className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
    >
      {children}
    </a>
  );
}
