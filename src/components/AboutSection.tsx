import { useScramble } from "use-scramble";
import { scrambleOptions } from "~/utils/scramble";

// Hand icon (lucide)
const HandIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="rotate-45"
  >
    <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
    <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

export default function AboutSection() {
  const { ref, replay } = useScramble({
    ...scrambleOptions,
    text: "More about me",
  });

  return (
    <div className="flex flex-wrap sm:flex-nowrap gap-6 dark:text-white max-w-4xl font-mono">
      <div className="sm:border border-indigo-500 text-indigo-500 sm:h-full flex sm:items-center sm:justify-center sm:w-92 rounded aspect-square">
        <HandIcon />
      </div>
      <div className="flex flex-col gap-2 items-start justify-end">
        <h2 className="font-heading text-3xl border-b border-indigo-500 pb-2 font-semibold">
          Hello, I'm Charlie.
        </h2>
        <p className="leading-relaxed text-gray-600 dark:text-gray-400">
          I'm a designer, developer, creative coder, and sometimes musician. I
          write about design and development.{" "}
          <a
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            href="/about"
            onMouseEnter={replay}
            onFocus={replay}
          >
            <span ref={ref}>More about me</span> ❯
          </a>
        </p>
      </div>
    </div>
  );
}
