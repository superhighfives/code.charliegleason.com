import { Link, NavLink, useLocation } from "react-router";
import { useScramble } from "use-scramble";
import { scrambleOptions } from "./utils/scramble";

function navLinkClass({ isActive }: { isActive: boolean }) {
  let className = "border-b-2 font-semibold link-primary focus-ring-primary";
  className += isActive
    ? " text-indigo-500 dark:text-indigo-300 border-indigo-500 dark:border-indigo-300"
    : " border-indigo-600/20 dark:border-indigo-400/30 hover:border-current hover:border-indigo-600/20 hover:dark:border-indigo-400/30 focus-visible:border-current focus-visible:border-indigo-600/20 focus-visible:dark:border-indigo-400/30";
  return className;
}

function MenuItem({ to, children }: { to: string; children: string }) {
  const { ref, replay } = useScramble({
    ...scrambleOptions,
    text: children.toString(),
  });
  const location = useLocation();

  // Check if we're already on this page
  const isCurrentPage =
    location.pathname === to || (to === "/" && location.pathname === "/");

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If already on this page, just scroll to top without view transition
    if (isCurrentPage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <NavLink
      to={to}
      viewTransition
      prefetch="intent"
      className={navLinkClass}
      ref={ref}
      onMouseEnter={replay}
      onFocus={replay}
      onClick={handleClick}
    >
      {children}
    </NavLink>
  );
}

export function Frame({
  children,
  themeSwitch,
}: {
  children: React.ReactNode;
  themeSwitch?: React.ReactNode;
}) {
  return (
    <div className="grid grid-rows-layout gap-8 min-h-dvh p-4 sm:p-8 [padding-bottom:calc(env(safe-area-inset-bottom)+2.5rem)] sm:[padding-bottom:calc(env(safe-area-inset-bottom)+6rem)] text-indigo-600 dark:text-indigo-400 overflow-x-hidden">
      <div className="content-end">{children}</div>
      <div
        className="z-50 fixed inset-x-0 bottom-0 bg-gray-50 dark:bg-gray-900 drop-shadow-2xl font-mono"
        style={{ viewTransitionName: "navigation" }}
      >
        <div className="flex justify-between border-t dark:border-gray-800 px-8 pt-4 pb-4 sm:pb-12">
          <div className="flex gap-6">
            <Link
              to="/"
              viewTransition
              prefetch="intent"
              className="flex gap-1 leading-tight select-none focus-ring-primary"
            >
              <span>{"❯"}</span>
              <span className="animate-blink step">█</span>
            </Link>
            <MenuItem to="/">Home</MenuItem>
            <MenuItem to="/about">About</MenuItem>
          </div>
          <div className="flex gap-6">{themeSwitch}</div>
        </div>
      </div>
    </div>
  );
}
