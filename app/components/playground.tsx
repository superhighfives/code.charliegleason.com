import { themes } from "prism-react-renderer";
import { Fragment } from "react/jsx-runtime";
import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";
import { useMediaQuery } from "usehooks-ts";

interface PlaygroundProps {
  code: string;
  scope?: Record<string, unknown>;
  className?: string;
}

export default function Playground({
  code,
  scope = {},
  className,
}: PlaygroundProps) {
  const theme = useMediaQuery("(prefers-color-scheme: dark)")
    ? themes.ultramin
    : themes.nightOwl;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className || ""}`}>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
          Preview
        </div>
        <div className="h-full">
          <LiveProvider code={code} scope={scope}>
            <LivePreview Component={Fragment} />
            <LiveError className="text-red-600 dark:text-red-400 text-sm mt-2" />
          </LiveProvider>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
          Code
        </div>
        <div className="overflow-x-auto">
          <LiveProvider code={code} scope={scope}>
            <LiveEditor
              theme={theme}
              disabled={true}
              className="min-h-[200px] bg-white dark:bg-gray-950"
            />
          </LiveProvider>
        </div>
      </div>
    </div>
  );
}
