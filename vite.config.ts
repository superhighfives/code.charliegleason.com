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

export default defineConfig({
  plugins: [
    wasmEdgeModule(),
    remixCloudflareDevProxy(),
    mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      rehypePlugins: [rehypePrettyCode],
    }),
    remix(),
    tsconfigPaths(),
  ],
})

// @ts-check
import * as path from 'path'
import * as fs from 'fs'

/**
 * Vite plugin to import `.wasm` file as a `WebAssembly.Module`
 * @param {Object} options
 * @param {"cloudflare"|"vercel"} [options.target]
 * @returns {import("vite").Plugin}
 */
export function wasmEdgeModule() {
  const postfix = '.wasm?module'
  let isDev = false

  return {
    name: 'vite:wasm-helper',
    enforce: 'pre',
    configResolved(config) {
      isDev = config.command === 'serve'
    },
    config(config, env) {
      return { build: { rollupOptions: { external: /.+\.wasm?url$/i } } }
    },
    renderChunk(code, chunk, opts) {
      if (isDev) return
      if (!/.*_WASM.*/g.test(code)) return

      let final = code.replaceAll(
        /(const\s+(\w+))(.*_WASM.*)/g,
        (s, assetId) => {
          return s.replace(
            /const\s+(\w+)_(WASM)\s*=\s*"(.*)"/,
            'import $1_WASM from ".$3"'
          )
        }
      )

      final = final.replaceAll(
        /const { default:(\n|.)*?(;)/gm,
        (s, assetId) => {
          return s.replace(
            /const\s{\sdefault:\s(\w+) } = await import\(\n\s+\/\*\s@vite-ignore\s\*\/\n\s+`\${(\w+)}(\n|.)*?(;)/,
            'const $1 = $2'
          )
        }
      )

      return { code: final }
    },
    load(id, opts) {
      if (!id.endsWith(postfix)) {
        return
      }

      const filePath = id.slice(0, -1 * '?module'.length)

      if (isDev) {
        return `
            import fs from "fs"
    
            const wasmModule = new WebAssembly.Module(fs.readFileSync("${filePath}"));
            export default wasmModule;
            `
      }

      const assetId = this.emitFile({
        type: 'asset',
        name: path.basename(filePath),
        source: fs.readFileSync(filePath),
      })

      return `
          import init from "__WASM_ASSET__${assetId}.wasm"
          export default init
          `
    },
  }
}
