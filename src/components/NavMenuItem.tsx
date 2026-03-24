import { useEffect, useState } from "react";
import { useScramble } from "use-scramble";
import { scrambleOptions } from "~/utils/scramble";

interface NavMenuItemProps {
  href: string;
  label: string;
  isActive: boolean;
}

export default function NavMenuItem({
  href,
  label,
  isActive,
}: NavMenuItemProps) {
  const [mounted, setMounted] = useState(false);
  const { ref, replay } = useScramble({
    ...scrambleOptions,
    text: label,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If already on this page, scroll to top instead of navigating
    if (isActive) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const baseClass = "border-b-2 font-semibold link-primary focus-ring-primary";
  const activeClass =
    "text-indigo-500 dark:text-indigo-300 border-indigo-500 dark:border-indigo-300";
  const inactiveClass =
    "border-indigo-600/20 dark:border-indigo-400/30 hover:border-current hover:border-indigo-600/20 hover:dark:border-indigo-400/30 focus-visible:border-current focus-visible:border-indigo-600/20 focus-visible:dark:border-indigo-400/30";

  // SSR fallback - show static link
  if (!mounted) {
    return (
      <a
        href={href}
        className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
      >
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      ref={ref}
      className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
      onMouseEnter={replay}
      onFocus={replay}
      onClick={handleClick}
    >
      {label}
    </a>
  );
}
