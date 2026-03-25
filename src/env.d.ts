/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

// Augment the Cloudflare.Env interface with our bindings
// This is used by cloudflare:workers module's env export
declare namespace Cloudflare {
  interface Env {
    VISUAL_ASSETS: R2Bucket;
    KUDOS_DO: DurableObjectNamespace;
  }
}
