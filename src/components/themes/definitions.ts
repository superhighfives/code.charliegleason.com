/**
 * Core theme definitions for latte (light) and mocha (dark) themes.
 * These definitions serve as the single source of truth for all theme colors.
 */

export interface ThemeDefinition {
  ui: {
    surface1: string;
    surface2: string;
    surface3: string;
    base: string;
    disabled: string;
    clickable: string;
    hover: string;
    accent: string;
    error: string;
    errorSurface: string;
  };
  syntax: {
    plain: string;
    comment: string;
    keyword: string;
    tag: string;
    punctuation: string;
    definition: string;
    property: string;
    static: string;
    string: string;
  };
  font: {
    body: string;
    mono: string;
    size: string;
    lineHeight: string;
  };
}

export const latte: ThemeDefinition = {
  ui: {
    surface1: "#f8f9fb",
    surface2: "#EBEDF0",
    surface3: "#f7f7f7",
    base: "#4c4f69",
    disabled: "#9ca0b0",
    clickable: "#1e66f5",
    hover: "#8839ef",
    accent: "#8839ef",
    error: "#d20f39",
    errorSurface: "#e6e9ef",
  },
  syntax: {
    plain: "#4c4f69",
    comment: "#7c7f93",
    keyword: "#8839ef",
    tag: "#1e66f5",
    punctuation: "#179299",
    definition: "#ea76cb",
    property: "#df8e1d",
    static: "#fe640b",
    string: "#40c223",
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    mono: '"JetBrains Mono", "ui-monospace", "SFMono-Regular", "Roboto Mono", "Courier New", "monospace"',
    size: "14px",
    lineHeight: "1.7142857",
  },
};

export const mocha: ThemeDefinition = {
  ui: {
    surface1: "#011627",
    surface2: "#243b4c",
    surface3: "#112331",
    base: "#cdd6f4",
    disabled: "#6c7086",
    clickable: "#89b4fa",
    hover: "#cba6f7",
    accent: "#cba6f7",
    error: "#f38ba8",
    errorSurface: "#181825",
  },
  syntax: {
    plain: "#cdd6f4",
    comment: "#9399b2",
    keyword: "#cba6f7",
    tag: "#89b4fa",
    punctuation: "#94E2D5",
    definition: "#89B4FA",
    property: "#f9e2af",
    static: "#fab387",
    string: "#95efb7",
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    mono: '"JetBrains Mono", "ui-monospace", "SFMono-Regular", "Roboto Mono", "Courier New", "monospace"',
    size: "14px",
    lineHeight: "1.7142857",
  },
};
