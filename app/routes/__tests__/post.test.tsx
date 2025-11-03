import { beforeEach, describe, expect, it, vi } from "vitest";
import { VISUAL_COUNT } from "~/config/constants";
import type { Route } from "../+types/post";
import { loader } from "../post";

// Mock dependencies
vi.mock("~/mdx/mdx-runtime", () => ({
  loadMdxRuntime: vi.fn(),
}));

vi.mock("~/mdx/custom-mdx-parser", () => ({
  customMdxParse: vi.fn(() => ({ children: [] })),
}));

vi.mock("~/utils/shiki.server", () => ({
  highlightCode: vi.fn(() =>
    Promise.resolve("<highlighted>code</highlighted>"),
  ),
}));

vi.mock("~/utils/kudos.server", () => ({
  getKudosCount: vi.fn(() => Promise.resolve(10)),
  getKudosCookie: vi.fn(() => 5),
}));

vi.mock("~/utils/video-index", async () => {
  const { VISUAL_COUNT } =
    await vi.importActual<typeof import("~/config/constants")>(
      "~/config/constants",
    );
  return {
    VISUAL_COUNT,
    parseImageIndex: vi.fn((val: string | null) => {
      if (val === null) return null;
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1 || num > VISUAL_COUNT) return null;
      return num - 1; // Convert user index to internal
    }),
    randomVideoIndex: vi.fn(() => Math.floor(VISUAL_COUNT / 2)),
  };
});

describe("Post Route Loader", () => {
  const mockContext = {
    cloudflare: {
      env: {},
    },
  };

  const mockFrontmatter = {
    title: "Test Post",
    slug: "test-post",
    visual: {
      prompt: "A test image",
      image: { url: "https://replicate.com/test/model", version: "1.0.0" },
      video: { url: "https://replicate.com/test/video", version: "1.0.0" },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default mock for loadMdxRuntime
    const { loadMdxRuntime } = await import("~/mdx/mdx-runtime");
    vi.mocked(loadMdxRuntime).mockResolvedValue({
      content: "# Test Content",
      frontmatter: mockFrontmatter,
    });
  });

  describe("video index priority logic", () => {
    it("should use URL param when provided (share link)", async () => {
      const mockRequest = new Request("http://localhost:3000/test-post/7", {
        headers: { Cookie: "visual-index-test-post=5" },
      });

      const response = await loader({
        request: mockRequest,
        context: mockContext,
        params: { index: "7" },
      } as unknown as Route.LoaderArgs);

      // URL param 7 converts to internal index 6 (7 - 1)
      expect(response.data.randomVideo).toBe(6);
    });

    it("should use cookie when present and delete it", async () => {
      const mockRequest = new Request("http://localhost:3000/test-post");
      vi.spyOn(mockRequest.headers, "get").mockImplementation(
        (name: string) => {
          if (name === "Cookie") return "visual-index-test-post=7";
          return null;
        },
      );

      const response = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should use cookie value (7) and delete the cookie
      expect(response.data.randomVideo).toBe(7);

      // Check that Set-Cookie header was sent to delete the cookie
      expect(response.init?.headers).toBeDefined();
      const headers = response.init?.headers as Headers;
      const setCookie = headers.get("Set-Cookie");
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain("visual-index-test-post=");
      expect(setCookie).toContain("max-age=0");
    });

    it("should generate random when no cookie exists and no URL param", async () => {
      const { randomVideoIndex } = await import("~/utils/video-index");

      const mockRequest = new Request("http://localhost:3000/test-post", {
        headers: {},
      });

      const response = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should call randomVideoIndex and use its value (Math.floor(VISUAL_COUNT / 2) = 4)
      expect(randomVideoIndex).toHaveBeenCalled();
      expect(response.data.randomVideo).toBe(Math.floor(VISUAL_COUNT / 2));
    });

    it("should prefer cookie over random generation when cookie exists", async () => {
      const { randomVideoIndex } = await import("~/utils/video-index");

      const mockRequest = new Request("http://localhost:3000/test-post");
      vi.spyOn(mockRequest.headers, "get").mockImplementation(
        (name: string) => {
          if (name === "Cookie") return "visual-index-test-post=7";
          return null;
        },
      );

      const response = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should use cookie, not call random
      expect(randomVideoIndex).not.toHaveBeenCalled();
      expect(response.data.randomVideo).toBe(7);
    });

    it("should handle invalid URL param by generating random", async () => {
      const { randomVideoIndex, parseImageIndex } = await import(
        "~/utils/video-index"
      );
      vi.mocked(parseImageIndex).mockReturnValueOnce(null); // Invalid param

      const mockRequest = new Request("http://localhost:3000/test-post/999", {
        headers: {},
      });

      const response = await loader({
        request: mockRequest,
        context: mockContext,
        params: { index: "999" },
      } as unknown as Route.LoaderArgs);

      // Should call randomVideoIndex when param is invalid (Math.floor(VISUAL_COUNT / 2) = 4)
      expect(randomVideoIndex).toHaveBeenCalled();
      expect(response.data.randomVideo).toBe(Math.floor(VISUAL_COUNT / 2));
    });

    it("should return undefined randomVideo when no visual config", async () => {
      const { loadMdxRuntime } = await import("~/mdx/mdx-runtime");
      vi.mocked(loadMdxRuntime).mockResolvedValueOnce({
        content: "# Test Content",
        frontmatter: {
          title: "Test Post",
          slug: "test-post",
          // No visual property
        },
      });

      const mockRequest = new Request("http://localhost:3000/test-post", {
        headers: {},
      });

      const response = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should return undefined when no visual
      expect(response.data.randomVideo).toBeUndefined();
    });
  });

  describe("loader data structure", () => {
    it("should return all required fields", async () => {
      const mockRequest = new Request("http://localhost:3000/test-post", {
        headers: {},
      });

      const response = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      expect(response.data).toHaveProperty("__raw");
      expect(response.data).toHaveProperty("attributes");
      expect(response.data).toHaveProperty("highlightedBlocks");
      expect(response.data).toHaveProperty("kudosTotal");
      expect(response.data).toHaveProperty("kudosYou");
      expect(response.data).toHaveProperty("randomVideo");
    });
  });
});
