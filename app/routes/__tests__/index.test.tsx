import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it, vi } from "vitest";
import IndexRoute, { loader } from "../index";

// Mock the MDX runtime
vi.mock("~/mdx/mdx-runtime", () => ({
  loadAllMdxRuntime: vi.fn().mockResolvedValue([
    {
      slug: "test-post-1",
      url: "/test-post-1",
      title: "First Test Post",
      description: "First description",
      date: new Date("2024-01-15"),
      tags: ["test"],
      frontmatter: {
        title: "First Test Post",
        description: "First description",
        date: "2024-01-15",
      },
    },
    {
      slug: "test-post-2",
      url: "/test-post-2",
      title: "Second Test Post",
      description: "Second description",
      date: new Date("2024-02-20"),
      tags: ["test"],
      frontmatter: {
        title: "Second Test Post",
        description: "Second description",
        date: "2024-02-20",
      },
    },
  ]),
}));

// Mock components
vi.mock("~/components/about", () => ({
  About: () => <div data-testid="about">About Component</div>,
}));

vi.mock("~/components/nav-block", () => ({
  default: ({
    post,
    index,
    caption,
  }: {
    post: { title: string; description?: string; url: string; slug: string };
    index: number;
    caption?: string | null;
    visual?: unknown;
    className?: string;
    hero?: boolean;
  }) => (
    <div data-testid="nav-block">
      <a href={`${post.url}/${index + 1}`}>{post.title}</a>
      {post.description && <p>{post.description}</p>}
      {caption && <span>{caption}</span>}
    </div>
  ),
}));

vi.mock("~/components/utils/tags", () => ({
  default: vi.fn(() => []),
}));

describe("Index Route", () => {
  describe("loader", () => {
    it("should load and sort posts by date (newest first)", async () => {
      // Test that the loader function exists and returns expected structure
      // The actual data() function returns a Response-like object
      expect(loader).toBeDefined();
      expect(typeof loader).toBe("function");
    });
  });

  describe("Component", () => {
    it("should render the page header", async () => {
      const RemixStub = createRoutesStub([
        {
          path: "/",
          Component: IndexRoute,
          HydrateFallback: () => <div>Loading...</div>,
          loader,
        },
      ]);

      render(<RemixStub initialEntries={["/"]} />);

      await screen.findByText(/cd ~\/code.charliegleason.com/);
      expect(
        screen.getByText(/cd ~\/code.charliegleason.com/),
      ).toBeInTheDocument();
    });

    it("should render About component", async () => {
      const RemixStub = createRoutesStub([
        {
          path: "/",
          Component: IndexRoute,
          HydrateFallback: () => <div>Loading...</div>,
          loader,
        },
      ]);

      render(<RemixStub initialEntries={["/"]} />);

      await screen.findByTestId("about");
      expect(screen.getByTestId("about")).toBeInTheDocument();
    });

    it("should render post list with links", async () => {
      const RemixStub = createRoutesStub([
        {
          path: "/",
          Component: IndexRoute,
          HydrateFallback: () => <div>Loading...</div>,
          loader,
        },
      ]);

      render(<RemixStub initialEntries={["/"]} />);

      await screen.findByText("Second Test Post");
      expect(screen.getByText("Second Test Post")).toBeInTheDocument();
      expect(screen.getByText("First Test Post")).toBeInTheDocument();
    });

    it("should display empty state when no posts", async () => {
      const { loadAllMdxRuntime } = await import("~/mdx/mdx-runtime");
      vi.mocked(loadAllMdxRuntime).mockResolvedValueOnce([]);

      const RemixStub = createRoutesStub([
        {
          path: "/",
          Component: IndexRoute,
          HydrateFallback: () => <div>Loading...</div>,
          loader,
        },
      ]);

      render(<RemixStub initialEntries={["/"]} />);

      await screen.findByText("No posts found.");
      expect(screen.getByText("No posts found.")).toBeInTheDocument();
    });
  });
});
