import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react";

import Page from "./components/page";
import ErrorView from "./components/error-view";

import type { LinksFunction } from "@remix-run/node";
import stylesheet from "~/global.css?url";

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

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
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
