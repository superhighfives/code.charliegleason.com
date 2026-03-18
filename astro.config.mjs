// @ts-check

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
    // Fix React hooks SSR errors by preventing multiple React copies
    ssr: {
      noExternal: ["use-scramble", "framer-motion"],
    },
    optimizeDeps: {
      exclude: ["use-scramble"],
      include: [
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
