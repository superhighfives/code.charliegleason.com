import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  routeDiscovery: { mode: "initial" },
  future: {
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
