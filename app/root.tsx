import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import stylesheet from "~/global.css?url";
import ErrorView from "./components/error-view";
import Page from "./components/page";
import { ThemeContext } from "./theme-context";
import { useTheme } from "react-router-theme";
export { loader, action } from "react-router-theme";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap",
  },
  {
    rel: "icon",
    href: "/favicon.png",
    type: "image/png",
  },
];

const defaultTheme = "system";

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData() as { theme: string };
  const fetcher = useFetcher();
  const [theme, setTheme] = useTheme(loaderData, fetcher, defaultTheme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <html data-theme={theme} lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="font-mono text-sm bg-white dark:bg-gray-950">
          {children}
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </ThemeContext.Provider>
  );
}

export function ErrorBoundary() {
  return (
    <Page>
      <ErrorView />
    </Page>
  );
}

export default function App() {
  return (
    <Page>
      <Outlet />
    </Page>
  );
}
