import { Link, NavLink } from "react-router";
import { useScramble } from "use-scramble";
import { scrambleOptions } from "./utils/scramble";

function navLinkClass({ isActive }: { isActive: boolean }) {
  let className =
    "border-b-2 font-semibold hover:text-indigo-500 hover:dark:text-indigo-300 focus-visible:text-indigo-500 focus-visible:dark:text-indigo-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 focus-visible:rounded-sm";
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
  return (
    <NavLink
      to={to}
      className={navLinkClass}
      ref={ref}
      onMouseEnter={replay}
      onFocus={replay}
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
    <div className="grid grid-rows-layout gap-8 min-h-dvh p-4 sm:p-8 [padding-bottom:calc(env(safe-area-inset-bottom)+4.5rem)] sm:[padding-bottom:calc(env(safe-area-inset-bottom)+8rem)] text-indigo-600 dark:text-indigo-400 overflow-x-hidden">
      <div className="content-end">{children}</div>
      <div className="z-50 fixed inset-x-0 bottom-0 bg-gray-50 dark:bg-gray-900 drop-shadow-2xl font-mono">
        <div className="flex justify-between border-t dark:border-gray-800 px-8 pt-4 pb-4 sm:pb-12">
          <div className="flex gap-6">
            <Link
              to="/"
              className="flex gap-1 leading-tight select-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
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
