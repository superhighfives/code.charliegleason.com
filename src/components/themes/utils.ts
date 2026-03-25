/**
 * Theme transformation utilities.
 */

import type { ThemeDefinition } from "./definitions";
import type { SandpackTheme } from "./types";

/**
 * Transforms a ThemeDefinition into Sandpack's theme format
 */
export function toSandpack(theme: ThemeDefinition): SandpackTheme {
  return {
    colors: {
      surface1: theme.ui.surface1,
      surface2: theme.ui.surface2,
      surface3: theme.ui.surface3,
      clickable: theme.ui.clickable,
      base: theme.ui.base,
      disabled: theme.ui.disabled,
      hover: theme.ui.hover,
      accent: theme.ui.accent,
      error: theme.ui.error,
      errorSurface: theme.ui.errorSurface,
    },
    syntax: {
      plain: theme.syntax.plain,
      comment: {
        color: theme.syntax.comment,
        fontStyle: "italic",
      },
      keyword: theme.syntax.keyword,
      tag: theme.syntax.tag,
      punctuation: theme.syntax.punctuation,
      definition: theme.syntax.definition,
      property: theme.syntax.property,
      static: theme.syntax.static,
      string: theme.syntax.string,
    },
    font: {
      body: theme.font.body,
      mono: theme.font.mono,
      size: theme.font.size,
      lineHeight: theme.font.lineHeight,
    },
  };
}
