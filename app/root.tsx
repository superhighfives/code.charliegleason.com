import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  useRouteError,
  isRouteErrorResponse,
} from '@remix-run/react'

import type { LinksFunction } from '@remix-run/node'
import stylesheet from '~/global.css?url'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="font-mono">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid justify-between min-h-dvh p-8">
      <div>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </div>
      {children}
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  return (
    <Page>
      <h1>
        {isRouteErrorResponse(error)
          ? `${error.status}: ${error.statusText}`
          : error instanceof Error
            ? error.message
            : 'Unknown Error'}
      </h1>
    </Page>
  )
}

export default function App() {
  return (
    <Page>
      <Outlet />
    </Page>
  )
}
