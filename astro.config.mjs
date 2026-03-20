// @ts-check

import path from "node:path";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://code.charliegleason.com",
  output: "server",
  adapter: cloudflare({
    imageService: "cloudflare",
  }),
  integrations: [mdx(), react()],
  vite: {
    plugins: [/** @type {any} */ (tailwindcss())],
    resolve: {
      alias: {
        "~": path.resolve("./src"),
      },
      // Ensure a single React instance across all SSR deps (prevents hooks errors
      // when packages like use-scramble bundle their own CJS copy of React)
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha",
      },
    },
  },
});
