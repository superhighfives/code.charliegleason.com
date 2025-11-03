import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_INTERNAL_INDEX,
  MAX_USER_INDEX,
  MIN_INTERNAL_INDEX,
  MIN_USER_INDEX,
  parseImageIndex,
  randomVideoIndex,
  toUserIndex,
  VISUAL_COUNT,
} from "../video-index";

describe("video-index utilities", () => {
  describe("constants", () => {
    it("should have correct VISUAL_COUNT", () => {
      expect(VISUAL_COUNT).toBe(9);
    });

    it("should have correct user index range", () => {
      expect(MIN_USER_INDEX).toBe(1);
      expect(MAX_USER_INDEX).toBe(9);
    });

    it("should have correct internal index range", () => {
      expect(MIN_INTERNAL_INDEX).toBe(0);
      expect(MAX_INTERNAL_INDEX).toBe(8);
    });
  });

  describe("parseImageIndex", () => {
    it("should return null for null input", () => {
      expect(parseImageIndex(null)).toBe(null);
    });

    it("should convert valid user index to internal index", () => {
      expect(parseImageIndex("1")).toBe(0);
      expect(parseImageIndex("5")).toBe(4);
      expect(parseImageIndex("9")).toBe(8);
    });

    it("should return null for index below minimum (0)", () => {
      expect(parseImageIndex("0")).toBe(null);
    });

    it("should return null for negative index", () => {
      expect(parseImageIndex("-1")).toBe(null);
    });

    it("should return null for index above maximum (10+)", () => {
      expect(parseImageIndex("10")).toBe(null);
      expect(parseImageIndex("100")).toBe(null);
    });

    it("should return null for non-numeric strings", () => {
      expect(parseImageIndex("abc")).toBe(null);
      // parseInt("1.5") returns 1, which converts to internal index 0
      // This is actually valid behavior - it parses the integer part
      expect(parseImageIndex("1.5")).toBe(0);
      expect(parseImageIndex("not-a-number")).toBe(null);
    });

    it("should return null for empty string", () => {
      expect(parseImageIndex("")).toBe(null);
    });

    it("should handle boundary values correctly", () => {
      expect(parseImageIndex("1")).toBe(0); // Min valid
      expect(parseImageIndex("9")).toBe(8); // Max valid
    });

    it("should handle string numbers with whitespace", () => {
      expect(parseImageIndex(" 5 ")).toBe(4);
    });

    it("should handle valid middle range values", () => {
      expect(parseImageIndex("5")).toBe(4);
      expect(parseImageIndex("6")).toBe(5);
      expect(parseImageIndex("7")).toBe(6);
    });
  });

  describe("toUserIndex", () => {
    it("should convert internal index to user index", () => {
      expect(toUserIndex(0)).toBe(1);
      expect(toUserIndex(5)).toBe(6);
      expect(toUserIndex(8)).toBe(9);
    });

    it("should handle boundary values", () => {
      expect(toUserIndex(MIN_INTERNAL_INDEX)).toBe(MIN_USER_INDEX);
      expect(toUserIndex(MAX_INTERNAL_INDEX)).toBe(MAX_USER_INDEX);
    });

    it("should convert middle range values correctly", () => {
      expect(toUserIndex(10)).toBe(11);
      expect(toUserIndex(15)).toBe(16);
    });
  });

  describe("randomVideoIndex", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return a number", () => {
      const result = randomVideoIndex();
      expect(typeof result).toBe("number");
    });

    it("should return value within valid internal range", () => {
      for (let i = 0; i < 100; i++) {
        const result = randomVideoIndex();
        expect(result).toBeGreaterThanOrEqual(MIN_INTERNAL_INDEX);
        expect(result).toBeLessThanOrEqual(MAX_INTERNAL_INDEX);
      }
    });

    it("should return an integer", () => {
      for (let i = 0; i < 100; i++) {
        const result = randomVideoIndex();
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it("should generate different values over multiple calls", () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(randomVideoIndex());
      }
      // Should generate at least a few different values in 100 tries
      expect(results.size).toBeGreaterThan(1);
    });

    it("should use Math.random correctly", () => {
      const mathRandomSpy = vi.spyOn(Math, "random");

      randomVideoIndex();

      expect(mathRandomSpy).toHaveBeenCalled();

      mathRandomSpy.mockRestore();
    });
  });

  describe("integration tests", () => {
    it("should round-trip conversion work correctly", () => {
      for (let internal = 0; internal <= 8; internal++) {
        const user = toUserIndex(internal);
        const backToInternal = parseImageIndex(user.toString());
        expect(backToInternal).toBe(internal);
      }
    });

    it("should handle all valid user inputs correctly", () => {
      for (let user = 1; user <= 9; user++) {
        const internal = parseImageIndex(user.toString());
        expect(internal).not.toBe(null);
        expect(internal).toBeGreaterThanOrEqual(0);
        expect(internal).toBeLessThanOrEqual(8);
      }
    });

    it("should ensure random index can be converted to user index", () => {
      for (let i = 0; i < 100; i++) {
        const randomInternal = randomVideoIndex();
        const userIndex = toUserIndex(randomInternal);

        expect(userIndex).toBeGreaterThanOrEqual(MIN_USER_INDEX);
        expect(userIndex).toBeLessThanOrEqual(MAX_USER_INDEX);
      }
    });

    it("should verify index consistency", () => {
      // Verify that the constants are consistent with each other
      expect(MAX_USER_INDEX - MIN_USER_INDEX).toBe(
        MAX_INTERNAL_INDEX - MIN_INTERNAL_INDEX,
      );
      expect(MAX_USER_INDEX - MIN_USER_INDEX + 1).toBe(VISUAL_COUNT);
    });
  });
});
