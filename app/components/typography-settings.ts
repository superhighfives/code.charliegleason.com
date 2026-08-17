export const DISPLAY_FONTS = [
  {
    id: "polysans",
    label: "PolySans",
    family: '"PolySans", system-ui, sans-serif',
  },
  {
    id: "instrument-serif",
    label: "Instrument Serif",
    family: '"Instrument Serif", Georgia, serif',
    googleFamily: "Instrument Serif",
    weights: [400],
  },
  {
    id: "newsreader",
    label: "Newsreader",
    family: '"Newsreader", Georgia, serif',
    googleFamily: "Newsreader",
    weights: [400, 600],
  },
  {
    id: "fraunces",
    label: "Fraunces",
    family: '"Fraunces", Georgia, serif',
    googleFamily: "Fraunces",
    weights: [400, 600],
  },
  {
    id: "dm-serif-display",
    label: "DM Serif Display",
    family: '"DM Serif Display", Georgia, serif',
    googleFamily: "DM Serif Display",
    weights: [400],
  },
  {
    id: "lora",
    label: "Lora",
    family: '"Lora", Georgia, serif',
    googleFamily: "Lora",
    weights: [400, 600],
  },
] as const;

export const BODY_FONTS = [
  {
    id: "system",
    label: "System sans",
    family:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  {
    id: "source-sans-3",
    label: "Source Sans 3",
    family: '"Source Sans 3", sans-serif',
    googleFamily: "Source Sans 3",
    weights: [400, 600],
  },
  {
    id: "figtree",
    label: "Figtree",
    family: '"Figtree", sans-serif',
    googleFamily: "Figtree",
    weights: [400, 600],
  },
  {
    id: "ibm-plex-sans",
    label: "IBM Plex Sans",
    family: '"IBM Plex Sans", sans-serif',
    googleFamily: "IBM Plex Sans",
    weights: [400, 600],
  },
  {
    id: "geist",
    label: "Geist",
    family: '"Geist", sans-serif',
    googleFamily: "Geist",
    weights: [400, 600],
  },
  {
    id: "atkinson",
    label: "Atkinson Hyperlegible",
    family: '"Atkinson Hyperlegible", sans-serif',
    googleFamily: "Atkinson Hyperlegible",
    weights: [400, 700],
  },
] as const;

export const TYPOGRAPHY_STORAGE_KEY = "code-blog:typography:v1";

export const TYPOGRAPHY_RANGES = {
  headingScale: { min: 1, max: 1.6, step: 0.05 },
  bodySize: { min: 16, max: 22, step: 1 },
  lineHeight: { min: 1.4, max: 1.9, step: 0.05 },
  letterSpacing: { min: -0.03, max: 0.03, step: 0.005 },
  measure: { min: 600, max: 1100, step: 10 },
} as const;

type DisplayFontId = (typeof DISPLAY_FONTS)[number]["id"];
type BodyFontId = (typeof BODY_FONTS)[number]["id"];
export type TypographyFont =
  | (typeof DISPLAY_FONTS)[number]
  | (typeof BODY_FONTS)[number];

export type TypographySettings = {
  version: 1;
  displayFont: DisplayFontId;
  bodyFont: BodyFontId;
  headingScale: number;
  bodySize: number;
  lineHeight: number;
  letterSpacing: number;
  measure: number;
  collapsed: boolean;
};

export const DEFAULT_TYPOGRAPHY_SETTINGS: TypographySettings = {
  version: 1,
  displayFont: "polysans",
  bodyFont: "figtree",
  headingScale: 1.3,
  bodySize: 16,
  lineHeight: 1.8,
  letterSpacing: 0,
  measure: 740,
  collapsed: false,
};

function isInRange(
  value: unknown,
  range: { min: number; max: number },
): value is number {
  return typeof value === "number" && value >= range.min && value <= range.max;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseTypographySettings(
  stored: string | null,
): TypographySettings {
  if (!stored) return DEFAULT_TYPOGRAPHY_SETTINGS;

  try {
    const value: unknown = JSON.parse(stored);
    if (!isRecord(value)) {
      return DEFAULT_TYPOGRAPHY_SETTINGS;
    }

    const settings = value;
    const displayFont = DISPLAY_FONTS.find(
      (font) => font.id === settings.displayFont,
    )?.id;
    const bodyFont = BODY_FONTS.find(
      (font) => font.id === settings.bodyFont,
    )?.id;

    if (
      settings.version !== 1 ||
      !displayFont ||
      !bodyFont ||
      !isInRange(settings.headingScale, TYPOGRAPHY_RANGES.headingScale) ||
      !isInRange(settings.bodySize, TYPOGRAPHY_RANGES.bodySize) ||
      !isInRange(settings.lineHeight, TYPOGRAPHY_RANGES.lineHeight) ||
      !isInRange(settings.letterSpacing, TYPOGRAPHY_RANGES.letterSpacing) ||
      !isInRange(settings.measure, TYPOGRAPHY_RANGES.measure) ||
      typeof settings.collapsed !== "boolean"
    ) {
      return DEFAULT_TYPOGRAPHY_SETTINGS;
    }

    return {
      version: 1,
      displayFont,
      bodyFont,
      headingScale: settings.headingScale,
      bodySize: settings.bodySize,
      lineHeight: settings.lineHeight,
      letterSpacing: settings.letterSpacing,
      measure: settings.measure,
      collapsed: settings.collapsed,
    };
  } catch {
    return DEFAULT_TYPOGRAPHY_SETTINGS;
  }
}

export function getTypographyCssVariables(
  settings: TypographySettings,
): Record<string, string> {
  const displayFont = DISPLAY_FONTS.find(
    (font) => font.id === settings.displayFont,
  );
  const bodyFont = BODY_FONTS.find((font) => font.id === settings.bodyFont);

  return {
    "--post-display-font": displayFont?.family ?? DISPLAY_FONTS[0].family,
    "--post-heading-scale": settings.headingScale.toString(),
    "--post-body-font": bodyFont?.family ?? BODY_FONTS[0].family,
    "--post-body-size": `${settings.bodySize}px`,
    "--post-body-leading": settings.lineHeight.toString(),
    "--post-body-tracking": `${settings.letterSpacing}em`,
    "--post-measure": `${settings.measure}px`,
  };
}

export function getGoogleFontUrl(font: TypographyFont): string | null {
  if (!("googleFamily" in font)) return null;

  const family = font.googleFamily.replaceAll(" ", "+");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${font.weights.join(";")}&display=swap`;
}
