import mdx from "@mdx-js/rollup";
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import tailwindcss from "@tailwindcss/vite";
import { rehypeGithubAlerts } from "rehype-github-alerts";
import rehypeMdxCodeProps from "rehype-mdx-code-props";
import { rehypePrettyCode } from "rehype-pretty-code";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import wasmModuleWorkers from "vite-plugin-wasm-module-workers";
import tsconfigPaths from "vite-tsconfig-paths";

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
