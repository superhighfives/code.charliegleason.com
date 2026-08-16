import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../typography-settings", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../typography-settings")>();
  return {
    ...actual,
    getGoogleFontUrl: (font: Parameters<typeof actual.getGoogleFontUrl>[0]) =>
      actual.getGoogleFontUrl(font) ? "data:text/css," : null,
  };
});

import { TypographyPlayground } from "../typography-playground";
import {
  DEFAULT_TYPOGRAPHY_SETTINGS,
  TYPOGRAPHY_STORAGE_KEY,
} from "../typography-settings";

describe("TypographyPlayground", () => {
  let target: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    document.head
      .querySelectorAll("link[data-typography-font]")
      .forEach((link) => {
        link.remove();
      });
    target = document.createElement("article");
    document.body.appendChild(target);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    target.remove();
  });

  it("applies the default settings to its target", async () => {
    render(<TypographyPlayground target={target} />);

    expect(
      screen.getByRole("complementary", { name: "Typography playground" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(target.style.getPropertyValue("--post-body-size")).toBe("19px");
    });
    expect(screen.getByLabelText("Body font")).toHaveValue("system");
    expect(screen.getByText("19px")).toBeInTheDocument();
  });

  it("restores valid settings from local storage", async () => {
    localStorage.setItem(
      TYPOGRAPHY_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_TYPOGRAPHY_SETTINGS, bodySize: 20 }),
    );

    render(<TypographyPlayground target={target} />);

    await waitFor(() => {
      expect(target.style.getPropertyValue("--post-body-size")).toBe("20px");
    });
  });

  it("falls back to defaults when local storage is unavailable", async () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(() =>
      render(<TypographyPlayground target={target} />),
    ).not.toThrow();
    await waitFor(() => {
      expect(target.style.getPropertyValue("--post-body-size")).toBe("19px");
    });
  });

  it("loads selected Google fonts once", async () => {
    const user = userEvent.setup();
    render(<TypographyPlayground target={target} />);

    await user.selectOptions(screen.getByLabelText("Body font"), "figtree");
    expect(target.style.getPropertyValue("--post-body-font")).toContain(
      "Figtree",
    );
    expect(
      document.head.querySelectorAll('link[data-typography-font="figtree"]'),
    ).toHaveLength(1);

    await user.selectOptions(screen.getByLabelText("Body font"), "system");
    await user.selectOptions(screen.getByLabelText("Body font"), "figtree");
    expect(
      document.head.querySelectorAll('link[data-typography-font="figtree"]'),
    ).toHaveLength(1);
  });

  it("does not request a stylesheet for the system font", () => {
    render(<TypographyPlayground target={target} />);

    expect(
      document.head.querySelector('link[data-typography-font="system"]'),
    ).not.toBeInTheDocument();
  });

  it("updates range values and persists settings", async () => {
    render(<TypographyPlayground target={target} />);

    fireEvent.change(screen.getByRole("slider", { name: /Body size/ }), {
      target: { value: "21" },
    });

    await waitFor(() => {
      expect(target.style.getPropertyValue("--post-body-size")).toBe("21px");
    });
    expect(screen.getByText("21px")).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem(TYPOGRAPHY_STORAGE_KEY) ?? "{}"),
    ).toMatchObject({ bodySize: 21 });
  });

  it("persists controls before a target is available", async () => {
    render(<TypographyPlayground target={null} />);

    fireEvent.change(screen.getByRole("slider", { name: /Body size/ }), {
      target: { value: "21" },
    });

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem(TYPOGRAPHY_STORAGE_KEY) ?? "{}"),
      ).toMatchObject({ bodySize: 21 });
    });
  });

  it("resets every control to its default", async () => {
    const user = userEvent.setup();
    render(<TypographyPlayground target={target} />);
    fireEvent.change(screen.getByRole("slider", { name: /Body size/ }), {
      target: { value: "21" },
    });

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByRole("slider", { name: /Body size/ })).toHaveValue("19");
    expect(target.style.getPropertyValue("--post-body-size")).toBe("19px");
  });

  it("collapses without hiding its header", async () => {
    const user = userEvent.setup();
    render(<TypographyPlayground target={target} />);

    await user.click(screen.getByRole("button", { name: "Collapse" }));

    expect(screen.queryByLabelText("Body font")).not.toBeInTheDocument();
    expect(screen.getByText("Typography lab")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
