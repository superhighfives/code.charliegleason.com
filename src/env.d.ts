/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  VISUAL_ASSETS: R2Bucket;
  KUDOS_DO: DurableObjectNamespace;
}

// Astro v6: cloudflare:workers module provides env access
declare module "cloudflare:workers" {
  export const env: CloudflareEnv;
}
