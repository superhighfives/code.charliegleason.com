import { Hand } from "lucide-react";
import { Link } from "react-router";

export function About() {
  return (
    <div className="flex flex-wrap sm:flex-nowrap gap-6 dark:text-white">
      <div className="sm:border border-indigo-500 text-indigo-500 sm:h-full flex sm:items-center sm:justify-center sm:w-92 rounded">
        <Hand size="48" className="rotate-45" />
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="border-b border-indigo-500 pb-2 font-semibold">
          Hello, I'm Charlie.
        </h2>
        <p className="leading-relaxed text-gray-600 dark:text-gray-400">
          I'm a designer, developer, creative coder, and sometimes musician. I
          write about design and development.{" "}
          <Link
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            to="/about"
          >
            <span>More about me</span> ❯
          </Link>
        </p>
      </div>
    </div>
  );
}
