import { useEffect, useState } from "react";
import {
  BODY_FONTS,
  DEFAULT_TYPOGRAPHY_SETTINGS,
  DISPLAY_FONTS,
  getGoogleFontUrl,
  getTypographyCssVariables,
  parseTypographySettings,
  TYPOGRAPHY_RANGES,
  TYPOGRAPHY_STORAGE_KEY,
  type TypographyFont,
  type TypographySettings,
} from "./typography-settings";

const CSS_VARIABLES = Object.keys(
  getTypographyCssVariables(DEFAULT_TYPOGRAPHY_SETTINGS),
);

function loadGoogleFont(font: TypographyFont) {
  const href = getGoogleFontUrl(font);
  if (
    !href ||
    document.head.querySelector(`[data-typography-font="${font.id}"]`)
  ) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.typographyFont = font.id;
  document.head.appendChild(link);
}

type NumericSetting =
  | "headingScale"
  | "bodySize"
  | "lineHeight"
  | "letterSpacing"
  | "measure";

export function TypographyPlayground({
  target,
}: {
  target: HTMLElement | null;
}) {
  const [settings, setSettings] = useState<TypographySettings>(
    DEFAULT_TYPOGRAPHY_SETTINGS,
  );
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      setSettings(
        parseTypographySettings(localStorage.getItem(TYPOGRAPHY_STORAGE_KEY)),
      );
    } catch {
      setSettings(DEFAULT_TYPOGRAPHY_SETTINGS);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!target) return;

    for (const [property, value] of Object.entries(
      getTypographyCssVariables(settings),
    )) {
      target.style.setProperty(property, value);
    }
  }, [settings, target]);

  useEffect(() => {
    if (!storageReady) return;

    try {
      localStorage.setItem(TYPOGRAPHY_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // The playground still works when browser storage is unavailable.
    }
  }, [settings, storageReady]);

  useEffect(() => {
    if (!target) return;

    return () => {
      for (const property of CSS_VARIABLES) {
        target.style.removeProperty(property);
      }
    };
  }, [target]);

  useEffect(() => {
    const displayFont = DISPLAY_FONTS.find(
      (font) => font.id === settings.displayFont,
    );
    const bodyFont = BODY_FONTS.find((font) => font.id === settings.bodyFont);
    if (displayFont) loadGoogleFont(displayFont);
    if (bodyFont) loadGoogleFont(bodyFont);
  }, [settings.displayFont, settings.bodyFont]);

  const updateNumber = (key: NumericSetting, value: string) => {
    setSettings((current) => ({ ...current, [key]: Number(value) }));
  };

  const controlClassName =
    "w-full accent-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";
  const selectClassName =
    "w-full rounded-sm border border-gray-700 bg-gray-900 px-2 py-1.5 text-gray-100 focus-ring-primary";

  return (
    <aside
      aria-label="Typography playground"
      className="fixed top-4 right-4 left-4 sm:left-auto z-50 w-auto sm:w-72 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-md border border-gray-700 bg-gray-950 text-xs text-gray-300 shadow-2xl font-mono"
    >
      <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2.5">
        <strong className="text-gray-100">Typography lab</strong>
        <span className="text-2xs tracking-widest text-orange-400">
          DEV ONLY
        </span>
        <button
          type="button"
          aria-expanded={!settings.collapsed}
          className="ml-auto cursor-pointer text-indigo-300 focus-ring-primary"
          onClick={() =>
            setSettings((current) => ({
              ...current,
              collapsed: !current.collapsed,
            }))
          }
        >
          {settings.collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!settings.collapsed ? (
        <div className="grid gap-4 p-3">
          <fieldset className="grid gap-3">
            <legend className="mb-2 text-2xs tracking-widest text-gray-400 uppercase">
              Display
            </legend>
            <label className="grid gap-1" htmlFor="typography-display-font">
              Heading font
              <select
                id="typography-display-font"
                className={selectClassName}
                value={settings.displayFont}
                onChange={(event) => {
                  const font = DISPLAY_FONTS.find(
                    (option) => option.id === event.currentTarget.value,
                  );
                  if (font) {
                    setSettings((current) => ({
                      ...current,
                      displayFont: font.id,
                    }));
                  }
                }}
              >
                {DISPLAY_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1" htmlFor="typography-heading-scale">
              <span className="flex justify-between">
                <span>Heading scale</span>
                <output>{settings.headingScale.toFixed(2)}</output>
              </span>
              <input
                id="typography-heading-scale"
                className={controlClassName}
                type="range"
                {...TYPOGRAPHY_RANGES.headingScale}
                value={settings.headingScale}
                onChange={(event) =>
                  updateNumber("headingScale", event.currentTarget.value)
                }
              />
            </label>
          </fieldset>

          <fieldset className="grid gap-3 border-t border-gray-800 pt-4">
            <legend className="mb-2 text-2xs tracking-widest text-gray-400 uppercase">
              Reading
            </legend>
            <label className="grid gap-1" htmlFor="typography-body-font">
              Body font
              <select
                id="typography-body-font"
                className={selectClassName}
                value={settings.bodyFont}
                onChange={(event) => {
                  const font = BODY_FONTS.find(
                    (option) => option.id === event.currentTarget.value,
                  );
                  if (font) {
                    setSettings((current) => ({
                      ...current,
                      bodyFont: font.id,
                    }));
                  }
                }}
              >
                {BODY_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1" htmlFor="typography-body-size">
              <span className="flex justify-between">
                <span>Body size</span>
                <output>{settings.bodySize}px</output>
              </span>
              <input
                id="typography-body-size"
                className={controlClassName}
                type="range"
                {...TYPOGRAPHY_RANGES.bodySize}
                value={settings.bodySize}
                onChange={(event) =>
                  updateNumber("bodySize", event.currentTarget.value)
                }
              />
            </label>

            <label className="grid gap-1" htmlFor="typography-line-height">
              <span className="flex justify-between">
                <span>Line height</span>
                <output>{settings.lineHeight.toFixed(2)}</output>
              </span>
              <input
                id="typography-line-height"
                className={controlClassName}
                type="range"
                {...TYPOGRAPHY_RANGES.lineHeight}
                value={settings.lineHeight}
                onChange={(event) =>
                  updateNumber("lineHeight", event.currentTarget.value)
                }
              />
            </label>

            <label className="grid gap-1" htmlFor="typography-letter-spacing">
              <span className="flex justify-between">
                <span>Letter spacing</span>
                <output>{settings.letterSpacing.toFixed(3)}em</output>
              </span>
              <input
                id="typography-letter-spacing"
                className={controlClassName}
                type="range"
                {...TYPOGRAPHY_RANGES.letterSpacing}
                value={settings.letterSpacing}
                onChange={(event) =>
                  updateNumber("letterSpacing", event.currentTarget.value)
                }
              />
            </label>

            <label className="grid gap-1" htmlFor="typography-measure">
              <span className="flex justify-between">
                <span>Reading width</span>
                <output>{settings.measure}ch</output>
              </span>
              <input
                id="typography-measure"
                className={controlClassName}
                type="range"
                {...TYPOGRAPHY_RANGES.measure}
                value={settings.measure}
                onChange={(event) =>
                  updateNumber("measure", event.currentTarget.value)
                }
              />
            </label>
          </fieldset>

          <button
            type="button"
            className="w-fit cursor-pointer text-indigo-300 focus-ring-primary"
            onClick={() => setSettings(DEFAULT_TYPOGRAPHY_SETTINGS)}
          >
            Reset
          </button>
        </div>
      ) : null}
    </aside>
  );
}
