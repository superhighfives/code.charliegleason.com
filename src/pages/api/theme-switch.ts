import type { APIRoute } from "astro";

const THEME_COOKIE_NAME = "en_theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5 years

export const POST: APIRoute = async ({ request, redirect }) => {
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
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
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
