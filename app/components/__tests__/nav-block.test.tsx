import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NavBlock from "../nav-block";

// Mock framer-motion to avoid animation complexity in tests
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  motion: {
    video: ({
      children,
      initial,
      animate,
      exit,
      transition,
      onAnimationComplete,
      ...props
      // biome-ignore lint/suspicious/noExplicitAny: test environment
    }: any) => <video {...props}>{children}</video>,
  },
}));

// Mock video index utilities
vi.mock("~/utils/video-index", () => ({
  randomVideoIndexExcluding: vi.fn((current: number) => (current + 1) % 21),
  toUserIndex: vi.fn((internal: number) => internal + 1),
  preloadVideo: vi.fn(
    (slug: string, index: number) => `preload-${slug}-${index}`,
  ),
  cleanupPreloadedVideo: vi.fn(),
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
    // biome-ignore lint/suspicious/noDocumentCookie: test environment
    document.cookie =
      "visual-index-test-post=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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

  it("should render link with correct href including video index", () => {
    render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");
    // Should include video index (initialVideo 5 + 1 = 6 in user-facing format)
    expect(link).toHaveAttribute("href", "/test-post/6");
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

  it("should change video on mouse leave", async () => {
    const { container } = render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");

    // Get initial video src
    const initialVideo = container.querySelector("video") as HTMLVideoElement;
    expect(initialVideo.src).toContain("/posts/test-post/5.mp4");

    // First enter to set the hasEnteredRef and preload next video
    fireEvent.mouseEnter(link);

    // Then leave to trigger video change (from 5 to 6, based on mock)
    fireEvent.mouseLeave(link);

    await waitFor(() => {
      // Video should have changed (mock returns current + 1, so 5 becomes 6)
      const updatedVideo = container.querySelector("video") as HTMLVideoElement;
      expect(updatedVideo.src).toContain("/posts/test-post/6.mp4");
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

  it("should update href when video changes", async () => {
    render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");

    // Initial href should include initial video (5 + 1 = 6)
    expect(link).toHaveAttribute("href", "/test-post/6");

    // Hover to trigger video change
    fireEvent.mouseEnter(link);
    fireEvent.mouseLeave(link);

    await waitFor(() => {
      // After hover cycle, video changes to 6, so href should be /test-post/7
      expect(link).toHaveAttribute("href", "/test-post/7");
    });
  });

  it("should render all content within link element", () => {
    render(<NavBlock {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toContainElement(screen.getByText("Test Post Title"));
    expect(link).toContainElement(
      screen.getByText("This is a test description"),
    );
    expect(link).toContainElement(screen.getByText("View"));
  });
});
