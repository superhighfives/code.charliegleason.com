import { getFormProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { invariantResponse } from "@epic-web/invariant";
import { Laptop, Moon, Sun } from "lucide-react";
import { data, redirect, useFetcher, useFetchers } from "react-router";
import { ServerOnly } from "remix-utils/server-only";
import { z } from "zod/v4";
import { useHints, useOptionalHints } from "~/utils/client-hints";
import { useOptionalRequestInfo, useRequestInfo } from "~/utils/request-info";
import { setTheme, type Theme } from "~/utils/theme.server";
import type { Route } from "./+types/theme-switch.ts";

const ThemeFormSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  // this is useful for progressive enhancement
  redirectTo: z.string().optional(),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: ThemeFormSchema,
  });

  invariantResponse(submission.status === "success", "Invalid theme received");

  const { theme, redirectTo } = submission.value;

  const responseInit = {
    headers: { "set-cookie": setTheme(theme) },
  };
  if (redirectTo) {
    return redirect(redirectTo, responseInit);
  } else {
    return data({ result: submission.reply() }, responseInit);
  }
}

export function ThemeSwitch({
  userPreference,
}: {
  userPreference?: Theme | null;
}) {
  const fetcher = useFetcher<typeof action>();
  const requestInfo = useRequestInfo();

  const [form] = useForm({
    id: "theme-switch",
    lastResult: fetcher.data?.result,
  });

  // Get optimistic mode directly from this fetcher instance
  let optimisticMode: "system" | "light" | "dark" | undefined;
  if (fetcher.formData) {
    const submission = parseWithZod(fetcher.formData, {
      schema: ThemeFormSchema,
    });
    if (submission.status === "success") {
      optimisticMode = submission.value.theme;
    }
  }

  const mode = optimisticMode ?? userPreference ?? "system";
  const nextMode =
    mode === "system" ? "light" : mode === "light" ? "dark" : "system";
  const modeLabel = {
    light: <Sun />,
    dark: <Moon />,
    system: <Laptop />,
  };

  return (
    <fetcher.Form method="POST" {...getFormProps(form)} action="/theme-switch">
      <ServerOnly>
        {() => (
          <input type="hidden" name="redirectTo" value={requestInfo.path} />
        )}
      </ServerOnly>
      <input type="hidden" name="theme" value={nextMode} />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex size-5 cursor-pointer items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
        >
          {modeLabel[mode]}
        </button>
      </div>
    </fetcher.Form>
  );
}

/**
 * If the user's changing their theme mode preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticThemeMode() {
  const fetchers = useFetchers();
  const themeFetcher = fetchers.find((f) => f.formAction === "/theme-switch");

  if (themeFetcher?.formData) {
    const submission = parseWithZod(themeFetcher.formData, {
      schema: ThemeFormSchema,
    });

    if (submission.status === "success") {
      return submission.value.theme;
    }
  }
}

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
  const hints = useHints();
  const requestInfo = useRequestInfo();
  const optimisticMode = useOptimisticThemeMode();
  if (optimisticMode) {
    return optimisticMode === "system" ? hints.theme : optimisticMode;
  }
  return requestInfo.userPrefs.theme ?? hints.theme;
}

export function useOptionalTheme() {
  const optionalHints = useOptionalHints();
  const optionalRequestInfo = useOptionalRequestInfo();
  const optimisticMode = useOptimisticThemeMode();
  if (optimisticMode) {
    return optimisticMode === "system" ? optionalHints?.theme : optimisticMode;
  }
  return optionalRequestInfo?.userPrefs.theme ?? optionalHints?.theme;
}
