import { getSandpackCssText } from "@codesandbox/sandpack-react";
import { createContext, useContext } from "react";
import {
  Link,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import stylesheet from "~/global.css?url";
import { ThemeSwitch, useOptionalTheme } from "~/routes/resources/theme-switch";
import type { Theme } from "~/utils/theme.server";
import { getTheme } from "~/utils/theme.server";
import type { Route } from "./+types/root";
import GeneralErrorBoundary from "./components/error-boundary";
import { ClientHintCheck, getHints } from "./utils/client-hints";
import { ClientIdCheck } from "./utils/fingerprint";
import { getFingerprint } from "./utils/fingerprint.server";
import { getDomainUrl } from "./utils/misc";
import { useNonce } from "./utils/nonce-provider";

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  // Preload critical font weights for instant rendering
  {
    rel: "preload",
    href: "/fonts/JetBrainsMono-Regular.woff2",
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    href: "/fonts/JetBrainsMono-SemiBold.woff2",
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  {
    rel: "icon",
    href: "/favicon.png",
    type: "image/png",
  },
  {
    rel: "alternate",
    type: "application/rss+xml",
    title: "RSS Feed",
    href: "/rss",
  },
];

const UserFingerprintContext = createContext<string>("");

export function useUserFingerprint() {
  return useContext(UserFingerprintContext);
}

export async function loader({ request }: Route.LoaderArgs) {
  const { fingerprint, setCookie } = await getFingerprint(request);

  // Get client ID from cookie if it exists
  const clientId = request.headers
    .get("Cookie")
    ?.match(/client-id=([^;]+)/)?.[1];

  // Combine server fingerprint with client ID
  const fullFingerprint = clientId ? `${clientId}:${fingerprint}` : fingerprint;

  const headers = new Headers();
  if (setCookie) {
    headers.append("Set-Cookie", setCookie);
  }

  const data = {
    requestInfo: {
      hints: getHints(request),
      origin: getDomainUrl(request),
      path: new URL(request.url).pathname,
      userPrefs: {
        theme: getTheme(request),
      },
    },
    sandpackCss: getSandpackCssText(),
    fingerprint: fullFingerprint,
  };

  return headers.has("Set-Cookie") ? Response.json(data, { headers }) : data;
}

function Document({
  children,
  nonce,
  theme = "light",
  sandpackCss,
}: {
  children: React.ReactNode;
  nonce: string;
  theme?: Theme;
  sandpackCss?: string;
}) {
  return (
    <html lang="en" className={theme}>
      <head>
        <ClientHintCheck nonce={nonce} />
        <ClientIdCheck nonce={nonce} />
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="viewport-fit=cover, width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
        {sandpackCss && (
          <style
            // biome-ignore lint/security/noDangerouslySetInnerHtml: sandpack css
            dangerouslySetInnerHTML={{ __html: sandpackCss }}
            id="sandpack"
          />
        )}
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader | null>();
  const nonce = useNonce();
  const theme = useOptionalTheme();
  return (
    <Document nonce={nonce} theme={theme} sandpackCss={data?.sandpackCss}>
      {children}
    </Document>
  );
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  let className =
    "border-b-2 font-semibold hover:text-indigo-500 hover:dark:text-indigo-300 focus-visible:text-indigo-500 focus-visible:dark:text-indigo-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 focus-visible:rounded-sm";
  className += isActive
    ? " text-indigo-500 dark:text-indigo-300 border-indigo-500 dark:border-indigo-300"
    : " border-indigo-600/20 dark:border-indigo-400/30 hover:border-current hover:border-indigo-600/20 hover:dark:border-indigo-400/30 focus-visible:border-current focus-visible:border-indigo-600/20 focus-visible:dark:border-indigo-400/30";
  return className;
}

function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <UserFingerprintContext.Provider value={data.fingerprint}>
      <div className="grid grid-rows-layout gap-8 min-h-dvh p-4 sm:p-8 [padding-bottom:calc(env(safe-area-inset-bottom)+4.5rem)] sm:[padding-bottom:calc(env(safe-area-inset-bottom)+8rem)] text-indigo-600 dark:text-indigo-400 overflow-x-hidden">
        <div className="content-end">
          <Outlet />
        </div>
        <div className="z-50 fixed inset-x-0 bottom-0 bg-gray-50 dark:bg-gray-900 drop-shadow-2xl">
          <div className="flex justify-between border-t dark:border-gray-800 px-8 pt-4 pb-4 sm:pb-12">
            <div className="flex gap-6">
              <Link
                to="/"
                className="flex gap-1 leading-tight select-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
              >
                <span>{"❯"}</span>
                <span className="animate-blink step">█</span>
              </Link>
              <NavLink to="/" className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/about" className={navLinkClass}>
                About
              </NavLink>
            </div>
            <div className="flex gap-6">
              <ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
            </div>
          </div>
        </div>
      </div>
    </UserFingerprintContext.Provider>
  );
}

export default App;

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <GeneralErrorBoundary error={error} />;
}
