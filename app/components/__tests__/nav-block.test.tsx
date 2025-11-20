import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import NavBlock from "../nav-block";

// Mock video index utilities
vi.mock("~/utils/video-index", () => ({
  toUserIndex: vi.fn((internal: number) => internal + 1),
}));

// Mock the theme module to avoid React Router dependencies
vi.mock("~/routes/resources/theme-switch", () => ({
  useTheme: () => "light",
  useOptionalTheme: () => "light",
}));

describe("NavBlock", () => {
  const defaultPost = {
    title: "Test Post Title",
    url: "/test-post",
    description: "This is a test description",
    slug: "test-post",
    path: "/posts/test-post.mdx",
    tags: [] as string[],
    frontmatter: {
      title: "Test Post Title",
      description: "This is a test description",
    },
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render with basic props", () => {
    render(
      <BrowserRouter>
        <NavBlock post={defaultPost} index={5} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    expect(screen.getByText("This is a test description")).toBeInTheDocument();
  });

  it("should render without optional description", () => {
    const postWithoutDescription = { ...defaultPost, description: undefined };
    render(
      <BrowserRouter>
        <NavBlock post={postWithoutDescription} index={5} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    expect(
      screen.queryByText("This is a test description"),
    ).not.toBeInTheDocument();
  });

  it("should render image with correct src", () => {
    const { container } = render(
      <BrowserRouter>
        <NavBlock post={defaultPost} index={5} />
      </BrowserRouter>,
    );

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("/posts/test-post/5.png");
  });

  it("should render link with correct href including video index", () => {
    render(
      <BrowserRouter>
        <NavBlock post={defaultPost} index={5} />
      </BrowserRouter>,
    );

    const link = screen.getByRole("link");
    // Should include video index (video 5 + 1 = 6 in user-facing format)
    expect(link).toHaveAttribute("href", "/test-post/6");
  });

  it("should have hover effect classes on link", () => {
    render(
      <BrowserRouter>
        <NavBlock post={defaultPost} index={5} />
      </BrowserRouter>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveClass("group");
  });

  it("should render all content within link element", () => {
    render(
      <BrowserRouter>
        <NavBlock post={defaultPost} index={5} />
      </BrowserRouter>,
    );

    const link = screen.getByRole("link");
    expect(link).toContainElement(screen.getByText("Test Post Title"));
    expect(link).toContainElement(
      screen.getByText("This is a test description"),
    );
  });

  it("should render with tags when provided", () => {
    const postWithTags = {
      ...defaultPost,
      tags: ["react", "typescript"],
    };
    render(
      <BrowserRouter>
        <NavBlock post={postWithTags} index={5} />
      </BrowserRouter>,
    );

    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });

  it("should not render tags section when tags are empty", () => {
    const { container } = render(
      <BrowserRouter>
        <NavBlock post={defaultPost} index={5} />
      </BrowserRouter>,
    );

    // Tags container should not be present
    expect(container.querySelector(".flex-wrap.gap-2")).not.toBeInTheDocument();
  });

  it("should apply className", () => {
    render(
      <BrowserRouter>
        <NavBlock post={defaultPost} index={5} className="puppies" />
      </BrowserRouter>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveClass("puppies");
  });

  it("should apply background and text color from visual colors", () => {
    const visual = {
      prompt: "test",
      image: { url: "test", version: "test" },
      video: { url: "test", version: "test" },
      colors: [
        { text: "#000000", background: "#ffffff" },
        { text: "#111111", background: "#eeeeee" },
        { text: "#222222", background: "#dddddd" },
        { text: "#333333", background: "#cccccc" },
        { text: "#444444", background: "#bbbbbb" },
        { text: "#555555", background: "#aaaaaa" },
      ],
    };
    render(
      <BrowserRouter>
        <NavBlock post={defaultPost} index={5} visual={visual} />
      </BrowserRouter>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveStyle({
      "--background": "#aaaaaa",
      "--text": "#555555",
    });
  });
});
