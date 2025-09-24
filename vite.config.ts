import {
	vitePlugin as remix,
	cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import { rehypeGithubAlerts } from "rehype-github-alerts";
import { rehypePrettyCode } from "rehype-pretty-code";
import rehypeMdxCodeProps from "rehype-mdx-code-props";
import wasmModuleWorkers from "vite-plugin-wasm-module-workers";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [
		wasmModuleWorkers(),
		remixCloudflareDevProxy(),
		mdx({
			remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
			rehypePlugins: [
				[
					rehypePrettyCode,
					{
						theme: {
							dark: "ayu-dark",
							light: "min-light",
						},
					},
				],
				rehypeGithubAlerts,
				rehypeMdxCodeProps as any,
			],
			providerImportSource: "@mdx-js/react",
		}),
		remix(),
		tsconfigPaths(),
		tailwindcss(),
	],
});
