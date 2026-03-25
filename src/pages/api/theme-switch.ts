import type { APIRoute } from "astro";

const THEME_COOKIE_NAME = "en_theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5 years

// Validate redirect URL to prevent open redirect attacks
function getSafeRedirect(redirectTo: string | null): string {
  if (!redirectTo) return "/";
  // Only allow relative paths starting with /
  if (!redirectTo.startsWith("/")) return "/";
  // Reject protocol-relative URLs (//evil.com)
  if (redirectTo.startsWith("//")) return "/";
  // Reject URLs with protocol
  if (redirectTo.includes("://")) return "/";
  return redirectTo;
}

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const theme = formData.get("theme") as string;
  const redirectTo = formData.get("redirectTo") as string | null;

  // Validate theme
  if (!["light", "dark", "system"].includes(theme)) {
    return new Response("Invalid theme", { status: 400 });
  }

  // Build cookie
  const cookieValue =
    theme === "system"
      ? `${THEME_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax` // Delete cookie for system
      : `${THEME_COOKIE_NAME}=${theme}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;

  if (redirectTo) {
    const safeRedirect = getSafeRedirect(redirectTo);
    return new Response(null, {
      status: 302,
      headers: {
        Location: safeRedirect,
        "Set-Cookie": cookieValue,
      },
    });
  }

  return new Response(JSON.stringify({ success: true, theme }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieValue,
    },
  });
};
