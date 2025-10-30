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

// Mock HTMLMediaElement (video/audio) to prevent 500 errors in tests
beforeAll(() => {
  // Mock the play method
  window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => {
    return Promise.resolve();
  });

  // Mock the pause method
  window.HTMLMediaElement.prototype.pause = vi.fn();

  // Mock the load method to prevent actual network requests
  window.HTMLMediaElement.prototype.load = vi.fn().mockImplementation(
    function (this: HTMLMediaElement) {
      // Simulate successful load by triggering loadeddata event
      setTimeout(() => {
        const event = new Event("loadeddata");
        this.dispatchEvent(event);
      }, 0);
    },
  );
});
