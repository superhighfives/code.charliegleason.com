import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response(JSON.stringify({ total: 0 }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const id = env.KUDOS_DO.idFromName(`kudos:${slug}`);
    const stub = env.KUDOS_DO.get(id);

    const response = await stub.fetch(new URL("/count", url.origin));
    const result: { total?: number } = await response.json();

    return new Response(JSON.stringify({ total: result.total ?? 0, slug }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Kudos GET error:", error);
    return new Response(JSON.stringify({ total: 0, slug }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  let body: { slug?: string; fingerprint?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { slug, fingerprint } = body;

  if (!slug || !fingerprint) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing_fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const ip = request.headers.get("cf-connecting-ip") || "";

  try {
    const id = env.KUDOS_DO.idFromName(`kudos:${slug}`);
    const stub = env.KUDOS_DO.get(id);

    const url = new URL(request.url);
    const response = await stub.fetch(new URL("/increment", url.origin), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint, ip }),
    });

    const result: {
      ok?: boolean;
      total?: number;
      you?: number;
      reason?: string;
    } = await response.json();

    const headers = new Headers({ "Content-Type": "application/json" });
    if (result.ok && result.you !== undefined) {
      headers.append(
        "Set-Cookie",
        `kudos_${slug}=${result.you}; path=/; max-age=31536000; samesite=lax`,
      );
    }

    return new Response(
      JSON.stringify({
        ok: result.ok,
        total: result.total,
        you: result.you,
        reason: result.reason,
        slug,
      }),
      { status: response.status, headers },
    );
  } catch (error) {
    console.error("Kudos POST error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "internal_error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
