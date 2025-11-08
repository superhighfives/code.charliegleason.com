import { render, screen } from "@testing-library/react";
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
  const defaultProps = {
    title: "Test Post Title",
    href: "/test-post",
    description: "This is a test description",
    slug: "test-post",
    video: 5,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render with basic props", () => {
    render(<NavBlock {...defaultProps} />);

    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    expect(screen.getByText("This is a test description")).toBeInTheDocument();
  });

  it("should render without optional description", () => {
    const { title, href, slug, video } = defaultProps;
    render(<NavBlock title={title} href={href} slug={slug} video={video} />);

    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    expect(
      screen.queryByText("This is a test description"),
    ).not.toBeInTheDocument();
  });

  it("should render image with correct src", () => {
    const { container } = render(<NavBlock {...defaultProps} />);

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("/posts/test-post/5.png");
  });

  it("should render link with correct href including video index", () => {
    render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");
    // Should include video index (video 5 + 1 = 6 in user-facing format)
    expect(link).toHaveAttribute("href", "/test-post/6");
  });

  it("should have hover effect classes on link", () => {
    render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("group");
    expect(link).toHaveClass("hover:bg-gray-50");
  });

  it("should render all content within link element", () => {
    render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toContainElement(screen.getByText("Test Post Title"));
    expect(link).toContainElement(
      screen.getByText("This is a test description"),
    );
  });

  it("should render with tags when provided", () => {
    const propsWithTags = {
      ...defaultProps,
      tags: ["react", "typescript"],
    };
    render(<NavBlock {...propsWithTags} />);

    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });

  it("should not render tags section when tags are empty", () => {
    const { container } = render(<NavBlock {...defaultProps} />);

    // Tags container should not be present
    expect(container.querySelector(".flex-wrap.gap-2")).not.toBeInTheDocument();
  });

  it("should apply className", () => {
    render(<NavBlock {...defaultProps} className="puppies" />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("puppies");
  });

  it("should apply background and text color from visual colors", () => {
    const propsWithColors = {
      ...defaultProps,
      visual: {
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
      },
    };
    render(<NavBlock {...propsWithColors} />);

    const link = screen.getByRole("link");
    expect(link).toHaveStyle({
      backgroundColor: "#aaaaaa",
      color: "#555555",
    });
  });
});
