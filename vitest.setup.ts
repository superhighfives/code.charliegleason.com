import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, expect, vi } from "vitest";

// Extend Vitest matchers with jest-dom
expect.extend({});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Suppress expected AbortError messages from fetch cleanup
beforeAll(() => {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    // Filter out AbortError messages from happy-dom fetch cleanup
    const message = args[0]?.toString() || "";
    if (message.includes("AbortError") || message.includes("Fetch.onError")) {
      return;
    }
    originalConsoleError(...args);
  };
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
