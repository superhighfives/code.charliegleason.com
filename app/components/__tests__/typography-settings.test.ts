import { describe, expect, it } from "vitest";
import {
  BODY_FONTS,
  DEFAULT_TYPOGRAPHY_SETTINGS,
  DISPLAY_FONTS,
  getGoogleFontUrl,
  getTypographyCssVariables,
  parseTypographySettings,
} from "../typography-settings";

const displayFont = (id: string) => {
  const font = DISPLAY_FONTS.find((option) => option.id === id);
  if (!font) throw new Error(`Unknown display font: ${id}`);
  return font;
};

const bodyFont = (id: string) => {
  const font = BODY_FONTS.find((option) => option.id === id);
  if (!font) throw new Error(`Unknown body font: ${id}`);
  return font;
};

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
    // A measure stored back when the control was in `ch`, not `px`.
    JSON.stringify({ ...DEFAULT_TYPOGRAPHY_SETTINGS, measure: 68 }),
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
      "--post-body-font": bodyFont("figtree").family,
      "--post-body-leading": "1.8",
      "--post-body-size": "16px",
      "--post-body-tracking": "0em",
      "--post-display-font": displayFont("polysans").family,
      "--post-heading-scale": "1.3",
      "--post-measure": "740px",
    });
  });
});

describe("Google Font URLs", () => {
  it("skips remote loading for the system font", () => {
    expect(getGoogleFontUrl(bodyFont("system"))).toBeNull();
  });

  it("skips remote loading for locally hosted fonts", () => {
    expect(getGoogleFontUrl(displayFont("polysans"))).toBeNull();
  });

  it("builds a stylesheet URL from an allowlisted font", () => {
    expect(getGoogleFontUrl(displayFont("instrument-serif"))).toBe(
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:wght@400&display=swap",
    );
  });

  it("requests every configured font weight", () => {
    expect(getGoogleFontUrl(displayFont("newsreader"))).toBe(
      "https://fonts.googleapis.com/css2?family=Newsreader:wght@400;600&display=swap",
    );
  });
});
