import { describe, expect, it, vi, beforeEach } from "vitest";
import { loader } from "../post";
import type { Route } from "../+types/post";

// Mock dependencies
vi.mock("~/mdx/mdx-runtime", () => ({
  loadMdxRuntime: vi.fn(),
}));

vi.mock("~/mdx/custom-mdx-parser", () => ({
  customMdxParse: vi.fn(() => ({ children: [] })),
}));

vi.mock("~/utils/shiki.server", () => ({
  highlightCode: vi.fn(() => Promise.resolve("<highlighted>code</highlighted>")),
}));

vi.mock("~/utils/kudos.server", () => ({
  getKudosCount: vi.fn(() => Promise.resolve(10)),
  getKudosCookie: vi.fn(() => 5),
}));

vi.mock("~/utils/video-index", () => ({
  parseImageIndex: vi.fn((val: string | null) => {
    if (val === null) return null;
    const num = Number.parseInt(val, 10);
    if (Number.isNaN(num) || num < 1 || num > 21) return null;
    return num - 1; // Convert user index to internal
  }),
  randomVideoIndex: vi.fn(() => 10),
}));

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
      const mockRequest = new Request("http://localhost:3000/test-post/15", {
        headers: { Cookie: "visual-index-test-post=5" },
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: { index: "15" },
      } as unknown as Route.LoaderArgs);

      // URL param 15 converts to internal index 14 (15 - 1)
      expect(result.randomVideo).toBe(14);
    });

    it("should use cookie when navigating from index (referrer ends with /)", async () => {
      // Create a mock request with headers that work around forbidden header restrictions
      const mockRequest = new Request("http://localhost:3000/test-post");

      // Spy on headers.get to return our test values
      const originalGet = mockRequest.headers.get.bind(mockRequest.headers);
      vi.spyOn(mockRequest.headers, "get").mockImplementation((name: string) => {
        if (name === "Cookie") return "visual-index-test-post=7";
        if (name === "Referer") return "http://localhost:3000/";
        return originalGet(name);
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should use cookie value (7)
      expect(result.randomVideo).toBe(7);
    });

    it("should use cookie when navigation cookie is set (from index)", async () => {
      const mockRequest = new Request("http://localhost:3000/test-post");
      vi.spyOn(mockRequest.headers, "get").mockImplementation((name: string) => {
        if (name === "Cookie") return "visual-index-test-post=7; nav-from-index-test-post=1";
        return null;
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should use cookie value (7) because nav cookie is present
      expect(result.randomVideo).toBe(7);
    });

    it("should generate random when refreshing (no matching referrer)", async () => {
      const { randomVideoIndex } = await import("~/utils/video-index");

      const mockRequest = new Request("http://localhost:3000/test-post");
      vi.spyOn(mockRequest.headers, "get").mockImplementation((name: string) => {
        if (name === "Cookie") return "visual-index-test-post=7";
        if (name === "Referer") return "http://localhost:3000/test-post";
        return null;
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should call randomVideoIndex and use its value (10)
      expect(randomVideoIndex).toHaveBeenCalled();
      expect(result.randomVideo).toBe(10);
    });

    it("should generate random when no cookie exists and no URL param", async () => {
      const { randomVideoIndex } = await import("~/utils/video-index");

      const mockRequest = new Request("http://localhost:3000/test-post", {
        headers: {},
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should call randomVideoIndex and use its value (10)
      expect(randomVideoIndex).toHaveBeenCalled();
      expect(result.randomVideo).toBe(10);
    });

    it("should NOT use cookie when referrer is not index", async () => {
      const { randomVideoIndex } = await import("~/utils/video-index");

      const mockRequest = new Request("http://localhost:3000/test-post");
      vi.spyOn(mockRequest.headers, "get").mockImplementation((name: string) => {
        if (name === "Cookie") return "visual-index-test-post=7";
        if (name === "Referer") return "http://localhost:3000/other-page";
        return null;
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should generate random, not use cookie
      expect(randomVideoIndex).toHaveBeenCalled();
      expect(result.randomVideo).toBe(10);
    });

    it("should handle invalid URL param by generating random", async () => {
      const { randomVideoIndex, parseImageIndex } = await import("~/utils/video-index");
      vi.mocked(parseImageIndex).mockReturnValueOnce(null); // Invalid param

      const mockRequest = new Request("http://localhost:3000/test-post/999", {
        headers: {},
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: { index: "999" },
      } as unknown as Route.LoaderArgs);

      // Should call randomVideoIndex when param is invalid
      expect(randomVideoIndex).toHaveBeenCalled();
      expect(result.randomVideo).toBe(10);
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

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should return undefined when no visual
      expect(result.randomVideo).toBeUndefined();
    });
  });

  describe("referrer detection", () => {
    it("should detect index referrer with trailing slash", async () => {
      const mockRequest = new Request("http://localhost:3000/test-post");
      vi.spyOn(mockRequest.headers, "get").mockImplementation((name: string) => {
        if (name === "Cookie") return "visual-index-test-post=5";
        if (name === "Referer") return "http://localhost:3000/";
        return null;
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should use cookie (5) because referrer is index
      expect(result.randomVideo).toBe(5);
    });

    it("should detect index referrer without path", async () => {
      const mockRequest = new Request("http://localhost:3000/test-post");
      vi.spyOn(mockRequest.headers, "get").mockImplementation((name: string) => {
        if (name === "Cookie") return "visual-index-test-post=5";
        if (name === "Referer") return "http://localhost:3000";
        return null;
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should use cookie (5) because referrer is index
      expect(result.randomVideo).toBe(5);
    });

    it("should handle missing referrer header", async () => {
      const { randomVideoIndex } = await import("~/utils/video-index");

      const mockRequest = new Request("http://localhost:3000/test-post");
      vi.spyOn(mockRequest.headers, "get").mockImplementation((name: string) => {
        if (name === "Cookie") return "visual-index-test-post=5";
        // No Referer header - return null
        return null;
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      // Should generate random (not use cookie) when no referrer
      expect(randomVideoIndex).toHaveBeenCalled();
      expect(result.randomVideo).toBe(10);
    });
  });

  describe("loader data structure", () => {
    it("should return all required fields", async () => {
      const mockRequest = new Request("http://localhost:3000/test-post", {
        headers: {},
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
        params: {},
      } as unknown as Route.LoaderArgs);

      expect(result).toHaveProperty("__raw");
      expect(result).toHaveProperty("attributes");
      expect(result).toHaveProperty("highlightedBlocks");
      expect(result).toHaveProperty("kudosTotal");
      expect(result).toHaveProperty("kudosYou");
      expect(result).toHaveProperty("randomVideo");
    });
  });
});
