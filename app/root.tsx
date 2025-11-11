import { getSandpackCssText } from "@codesandbox/sandpack-react";
import { createContext, useContext } from "react";
import {
  Links,
  Meta,
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
import { Frame } from "./components/frame";
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
    href: "/fonts/Inter-Regular.woff2",
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    href: "/fonts/Inter-SemiBold.woff2",
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
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

function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <UserFingerprintContext.Provider value={data.fingerprint}>
      <Frame
        themeSwitch={
          <ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
        }
      >
        <Outlet />
      </Frame>
    </UserFingerprintContext.Provider>
  );
}

export default App;

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <GeneralErrorBoundary error={error} />;
}
