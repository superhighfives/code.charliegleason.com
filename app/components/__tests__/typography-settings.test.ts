import { describe, expect, it } from "vitest";
import {
  BODY_FONTS,
  DEFAULT_TYPOGRAPHY_SETTINGS,
  DISPLAY_FONTS,
  getGoogleFontUrl,
  getTypographyCssVariables,
  parseTypographySettings,
} from "../typography-settings";

describe("parseTypographySettings", () => {
  it("returns defaults when no settings are stored", () => {
    expect(parseTypographySettings(null)).toEqual(DEFAULT_TYPOGRAPHY_SETTINGS);
  });

  it("accepts valid versioned settings", () => {
    const stored = { ...DEFAULT_TYPOGRAPHY_SETTINGS, bodySize: 20 };

    expect(parseTypographySettings(JSON.stringify(stored))).toEqual(stored);
  });

  it.each([
    "not json",
    JSON.stringify({ ...DEFAULT_TYPOGRAPHY_SETTINGS, displayFont: "unknown" }),
    JSON.stringify({ ...DEFAULT_TYPOGRAPHY_SETTINGS, bodyFont: "unknown" }),
    JSON.stringify({ ...DEFAULT_TYPOGRAPHY_SETTINGS, bodySize: 99 }),
    JSON.stringify({ ...DEFAULT_TYPOGRAPHY_SETTINGS, lineHeight: 0 }),
    JSON.stringify({ ...DEFAULT_TYPOGRAPHY_SETTINGS, version: 999 }),
  ])("resets invalid settings: %s", (stored) => {
    expect(parseTypographySettings(stored)).toEqual(
      DEFAULT_TYPOGRAPHY_SETTINGS,
    );
  });
});

describe("typography CSS variables", () => {
  it("maps settings to scoped CSS values", () => {
    expect(getTypographyCssVariables(DEFAULT_TYPOGRAPHY_SETTINGS)).toEqual({
      "--post-body-font": BODY_FONTS[0].family,
      "--post-body-leading": "1.65",
      "--post-body-size": "19px",
      "--post-body-tracking": "-0.01em",
      "--post-display-font": DISPLAY_FONTS[0].family,
      "--post-heading-scale": "1.3",
      "--post-measure": "68ch",
    });
  });
});

describe("Google Font URLs", () => {
  it("skips remote loading for the system font", () => {
    expect(getGoogleFontUrl(BODY_FONTS[0])).toBeNull();
  });

  it("builds a stylesheet URL from an allowlisted font", () => {
    expect(getGoogleFontUrl(DISPLAY_FONTS[0])).toBe(
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:wght@400&display=swap",
    );
  });

  it("requests every configured font weight", () => {
    expect(getGoogleFontUrl(DISPLAY_FONTS[1])).toBe(
      "https://fonts.googleapis.com/css2?family=Newsreader:wght@400;600&display=swap",
    );
  });
});
