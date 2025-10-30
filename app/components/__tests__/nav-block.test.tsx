import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import NavBlock from "../nav-block";

// Mock framer-motion to avoid animation complexity in tests
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  motion: {
    video: ({ children, initial, animate, exit, transition, onAnimationComplete, ...props }: any) => <video {...props}>{children}</video>,
  },
}));

// Mock video index utilities
vi.mock("~/utils/video-index", () => ({
  randomVideoIndexExcluding: vi.fn((current: number) => (current + 1) % 21),
}));

describe("NavBlock", () => {
  const defaultProps = {
    title: "Test Post Title",
    caption: "2 days ago",
    href: "/test-post",
    description: "This is a test description",
    slug: "test-post",
    initialVideo: 5,
  };

  beforeEach(() => {
    // Mock video element methods
    window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();

    // Clear cookies before each test
    document.cookie = "visual-index-test-post=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render with basic props", () => {
    render(<NavBlock {...defaultProps} />);

    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    expect(screen.getByText("2 days ago")).toBeInTheDocument();
    expect(screen.getByText("This is a test description")).toBeInTheDocument();
  });

  it("should render without optional caption", () => {
    render(<NavBlock {...defaultProps} caption={null} />);

    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    expect(screen.queryByText("2 days ago")).not.toBeInTheDocument();
  });

  it("should render without optional description", () => {
    const { title, caption, href, slug, initialVideo } = defaultProps;
    render(
      <NavBlock
        title={title}
        caption={caption}
        href={href}
        slug={slug}
        initialVideo={initialVideo}
      />,
    );

    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    expect(
      screen.queryByText("This is a test description"),
    ).not.toBeInTheDocument();
  });

  it("should render video with correct src", () => {
    const { container } = render(<NavBlock {...defaultProps} />);

    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video.src).toContain("/posts/test-post/5.mp4");
  });

  it("should render link with correct href", () => {
    render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/test-post");
  });

  it("should display View action text", () => {
    render(<NavBlock {...defaultProps} />);

    expect(screen.getByText("View")).toBeInTheDocument();
  });

  it("should apply grayscale filter initially", () => {
    const { container } = render(<NavBlock {...defaultProps} />);

    const video = container.querySelector("video");
    expect(video).toHaveStyle({ filter: "grayscale(100%)" });
  });

  it("should handle mouse enter event", () => {
    const { container } = render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");
    fireEvent.mouseEnter(link);

    // Video should have filter changed (handled by animation)
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
  });

  it("should handle mouse move event", () => {
    const { container } = render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");
    fireEvent.mouseMove(link);

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
  });

  it("should set cookie on mouse leave", async () => {
    const { container } = render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");

    // First enter to set the hasEnteredRef
    fireEvent.mouseEnter(link);

    // Then leave to trigger cookie setting
    fireEvent.mouseLeave(link);

    await waitFor(() => {
      // Check that a cookie was set (the value will be random 0-20)
      expect(document.cookie).toContain("visual-index-test-post=");
    });
  });

  it("should display video element with correct attributes", () => {
    const { container } = render(<NavBlock {...defaultProps} />);

    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("muted");
    expect(video).toHaveAttribute("playsInline");
  });

  it("should have hover effect classes on link", () => {
    render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("group");
    expect(link).toHaveClass("hover:bg-gray-50");
  });

  it("should set navigation cookie on click", () => {
    render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");
    fireEvent.click(link);

    // Should set the nav-from-index cookie
    expect(document.cookie).toContain("nav-from-index-test-post=1");
  });

  it("should render all content within link element", () => {
    render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toContainElement(screen.getByText("Test Post Title"));
    expect(link).toContainElement(screen.getByText("This is a test description"));
    expect(link).toContainElement(screen.getByText("View"));
  });
});
