import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";

// Validate redirect URL to prevent open redirect attacks
function getSafeRedirect(redirectTo: string | null): string | null {
  if (!redirectTo) return null;
  if (!redirectTo.startsWith("/")) return null;
  if (redirectTo.startsWith("//")) return null;
  if (redirectTo.includes("://")) return null;
  return redirectTo;
}

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

export const POST: APIRoute = async ({ request, cookies }) => {
  const contentType = request.headers.get("content-type") || "";
  const isFormData = contentType.includes("application/x-www-form-urlencoded");

  let slug: string | null = null;
  let fingerprint: string | null = null;
  let redirectTo: string | null = null;

  if (isFormData) {
    const formData = await request.formData();
    slug = formData.get("slug") as string | null;
    redirectTo = formData.get("redirectTo") as string | null;
    // For form submissions, generate fingerprint from IP + cookie
    const clientId = cookies.get("kudos_client_id")?.value;
    const ip = request.headers.get("cf-connecting-ip") || "";
    fingerprint = clientId ? `${clientId}:${ip}` : ip;
  } else {
    try {
      const body = (await request.json()) as {
        slug?: string;
        fingerprint?: string;
      };
      slug = body.slug ?? null;
      fingerprint = body.fingerprint ?? null;
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_json" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  if (!slug || !fingerprint) {
    if (redirectTo) {
      const safeRedirect = getSafeRedirect(redirectTo);
      if (safeRedirect) {
        return new Response(null, {
          status: 302,
          headers: { Location: safeRedirect },
        });
      }
    }
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

    const headers = new Headers();

    // Set kudos count cookie
    if (result.ok && result.you !== undefined) {
      headers.append(
        "Set-Cookie",
        `kudos_${slug}=${result.you}; path=/; max-age=31536000; samesite=lax`,
      );
    }

    // For form submissions, redirect back
    if (isFormData && redirectTo) {
      const safeRedirect = getSafeRedirect(redirectTo);
      if (safeRedirect) {
        headers.set("Location", safeRedirect);
        return new Response(null, { status: 302, headers });
      }
    }

    // For JSON requests, return JSON
    headers.set("Content-Type", "application/json");
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

    if (isFormData && redirectTo) {
      const safeRedirect = getSafeRedirect(redirectTo);
      if (safeRedirect) {
        return new Response(null, {
          status: 302,
          headers: { Location: safeRedirect },
        });
      }
    }

    return new Response(
      JSON.stringify({ ok: false, error: "internal_error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
