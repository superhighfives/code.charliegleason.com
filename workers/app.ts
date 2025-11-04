import { createRequestHandler } from "react-router";
import { KudosObject } from "./kudos-object";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    assets: Fetcher;
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

/**
 * Handle visual asset requests (videos and images) from R2 with Range request support
 * This enables proper video seeking in Chrome which requires HTTP 206 Partial Content responses
 */
async function handleVisualAsset(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Extract the asset path (remove leading slash)
  const assetPath = pathname.slice(1);

  // Get the Range header if present
  const rangeHeader = request.headers.get("range");

  try {
    let object: R2ObjectBody | R2Object | null;

    if (rangeHeader) {
      // Parse the range header (e.g., "bytes=0-1023")
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (!rangeMatch) {
        return new Response("Invalid Range header", { status: 400 });
      }

      const start = Number.parseInt(rangeMatch[1], 10);
      const end = rangeMatch[2]
        ? Number.parseInt(rangeMatch[2], 10)
        : undefined;

      // Fetch from R2 with Range support
      object = await env.VISUAL_ASSETS.get(assetPath, {
        range:
          end !== undefined
            ? { offset: start, length: end - start + 1 }
            : { offset: start },
      });

      if (!object) {
        return new Response("Not Found", { status: 404 });
      }

      // R2 returns R2ObjectBody for range requests
      const objectBody = object as R2ObjectBody;
      const size = objectBody.size;
      const contentLength = end !== undefined ? end - start + 1 : size - start;
      const contentRange = `bytes ${start}-${end ?? size - 1}/${size}`;

      return new Response(objectBody.body, {
        status: 206,
        headers: {
          "Content-Type":
            objectBody.httpMetadata?.contentType || getContentType(pathname),
          "Content-Length": contentLength.toString(),
          "Content-Range": contentRange,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
          ETag: objectBody.httpEtag,
        },
      });
    }

    // No Range header - return full object
    object = await env.VISUAL_ASSETS.get(assetPath);

    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    const objectBody = object as R2ObjectBody;

    return new Response(objectBody.body, {
      status: 200,
      headers: {
        "Content-Type":
          objectBody.httpMetadata?.contentType || getContentType(pathname),
        "Content-Length": objectBody.size.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: objectBody.httpEtag,
      },
    });
  } catch (error) {
    console.error("Error fetching visual asset:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(pathname: string): string {
  if (pathname.endsWith(".mp4")) return "video/mp4";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg"))
    return "image/jpeg";
  if (pathname.endsWith(".gif")) return "image/gif";
  if (pathname.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Intercept visual asset requests (videos and images in /posts/)
    if (url.pathname.match(/^\/posts\/.*\.(mp4|png|jpe?g|gif|webp)$/)) {
      return handleVisualAsset(request, env);
    }

    return requestHandler(request, {
      cloudflare: { env, ctx },
      assets: env.ASSETS,
    });
  },
} satisfies ExportedHandler<Env>;

export { KudosObject };

if (import.meta.hot) {
  import.meta.hot.accept();
}
