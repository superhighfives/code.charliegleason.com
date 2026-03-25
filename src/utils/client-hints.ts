/**
 * Client hints utilities for detecting user preferences (color scheme)
 * that are only known by the browser but needed by the server.
 */
import { getHintUtils } from "@epic-web/client-hints";
import { clientHint as colorSchemeHint } from "@epic-web/client-hints/color-scheme";

const hintsUtils = getHintUtils({
  theme: colorSchemeHint,
});

export const { getHints } = hintsUtils;

/**
 * Returns the inline script that checks client hints and sets cookies.
 * If hints change, it reloads the page so the server can read them.
 */
export function getClientHintCheckScript(): string {
  return hintsUtils.getClientHintCheckScript();
}
