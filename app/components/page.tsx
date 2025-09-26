import { useContext } from "react";
import { ThemeContext } from "~/theme-context";

const navLinkClass = ({ isActive }: { isActive: boolean }) => {
  let className =
    "border-b-2 font-medium hover:text-indigo-500 hover:dark:text-indigo-300";
  className += isActive
    ? " text-indigo-500 dark:text-indigo-300 border-indigo-500 dark:border-indigo-300"
    : " border-indigo-600/20 dark:border-indigo-400/30 hover:border-current hover:border-indigo-600/20 hover:dark:border-indigo-400/30";
  return className;
};

const ThemeChangeButton = ({
  themeName,
  setTheme,
}: {
  themeName: string;
  setTheme: (theme: string) => void;
}) => {
  return (
    <button
      type="button"
      className="p-2 rounded bg-foreground text-background"
      onClick={() => setTheme(themeName)}
    >
      {themeName}
    </button>
  );
};

function ToggleTheme() {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <div className="h-full w-full flex flex-col justify-center items-center bg-background text-foreground">
      <p className="text-5xl">current theme: {theme}</p>
      <div className="m-4 flex gap-2">
        <ThemeChangeButton themeName="light" setTheme={setTheme} />
        <ThemeChangeButton themeName="dark" setTheme={setTheme} />
        <ThemeChangeButton themeName="system" setTheme={setTheme} />
      </div>
    </div>
  );
}

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-rows-layout gap-8 min-h-dvh p-8 pb-28 text-indigo-600 dark:text-indigo-400 overflow-x-hidden">
      <div className="content-end">{children}</div>
      <div className="flex justify-between border-t dark:border-gray-800 px-8 pt-4 pb-12 fixed inset-x-0 bottom-0 bg-gray-50 dark:bg-gray-900 drop-shadow-2xl">
        <div className="flex gap-6">
          <Link to="/" className="flex gap-1 leading-tight select-none">
            <span>{"❯"}</span>
            <span className="animate-blink step">█</span>
          </Link>
          <Link to="/" className={navLinkClass}>
            Home
          </Link>
          <Link to="/about" className={navLinkClass}>
            About
          </Link>
        </div>
        <div className="flex gap-6">
          <ToggleTheme />
        </div>
      </div>
    </div>
  );
}
