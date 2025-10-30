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
      className="text-indigo-600 hover:text-indigo-500 focus-visible:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 dark:focus-visible:text-indigo-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 rounded-sm"
    >
      {children}
    </a>
  );
}
