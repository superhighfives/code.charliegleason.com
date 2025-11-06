import { Skull } from "lucide-react";
import { isRouteErrorResponse } from "react-router";
import { Frame } from "./frame";

export default function GeneralErrorBoundary({ error }: { error: unknown }) {
  return (
    <Frame>
      <div className="grid gap-y-4 relative">
        <h1 className="text-gray-400 dark:text-gray-500">
          ❯ cd ~/code.charliegleason.com
        </h1>
        <div className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950 flex gap-3 max-w-xl">
          <Skull size={20} className="shrink-0" />
          <h2>
            {isRouteErrorResponse(error)
              ? `${error.status}: ${error.statusText}`
              : error instanceof Error
                ? error.message
                : "Unknown Error"}
          </h2>
        </div>
      </div>
    </Frame>
  );
}
