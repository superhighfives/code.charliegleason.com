import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from '@remix-run/dev'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { rehypePrettyCode } from 'rehype-pretty-code'
import wasmModuleWorkers from 'vite-plugin-wasm-module-workers'

export default defineConfig({
  plugins: [
    wasmModuleWorkers(),
    remixCloudflareDevProxy(),
    mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      rehypePlugins: [
        [
          rehypePrettyCode,
          {
            theme: 'ayu-dark',
            keepBackground: false,
            grid: false,
          },
        ],
      ],
    }),
    remix(),
    tsconfigPaths(),
  ],
})
