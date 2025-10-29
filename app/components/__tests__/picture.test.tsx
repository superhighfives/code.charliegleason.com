import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock theme hook - must be before imports
vi.mock("~/routes/resources/theme-switch");

import Picture from "../picture";
import { useTheme } from "~/routes/resources/theme-switch";

describe("Picture", () => {
  const defaultProps = {
    src: "/images/test-image.png",
    themed: false,
    alt: "Test image description",
  };

  beforeEach(() => {
    vi.mocked(useTheme).mockReturnValue("light");
  });

  it("should render picture element", () => {
    render(<Picture {...defaultProps} />);

    const picture = screen.getByAltText("Test image description").closest("picture");
    expect(picture).toBeInTheDocument();
  });

  it("should render image with correct src", () => {
    render(<Picture {...defaultProps} />);

    const img = screen.getByAltText("Test image description");
    expect(img).toHaveAttribute("src", "/images/test-image.png");
  });

  it("should render image with correct alt text", () => {
    render(<Picture {...defaultProps} />);

    const img = screen.getByAltText("Test image description");
    expect(img).toBeInTheDocument();
  });

  it("should not render source element when themed is false", () => {
    const { container } = render(<Picture {...defaultProps} />);

    const source = container.querySelector("source");
    expect(source).not.toBeInTheDocument();
  });

  it("should not render source element in light theme even if themed is true", () => {
    vi.mocked(useTheme).mockReturnValue("light");

    const { container } = render(<Picture {...defaultProps} themed={true} />);

    const source = container.querySelector("source");
    expect(source).not.toBeInTheDocument();
  });

  it("should render source element with dark image in dark theme when themed is true", () => {
    vi.mocked(useTheme).mockReturnValue("dark");

    const { container } = render(<Picture {...defaultProps} themed={true} />);

    const source = container.querySelector("source");
    expect(source).toBeInTheDocument();
    expect(source).toHaveAttribute("srcSet", "/images/test-image-dark.png");
  });

  it("should generate dark image path correctly", () => {
    vi.mocked(useTheme).mockReturnValue("dark");

    const { container } = render(
      <Picture src="/path/to/image.jpg" themed={true} alt="Test" />,
    );

    const source = container.querySelector("source");
    expect(source).toHaveAttribute("srcSet", "/path/to/image-dark.jpg");
  });

  it("should handle multiple extensions correctly", () => {
    vi.mocked(useTheme).mockReturnValue("dark");

    const { container } = render(
      <Picture src="/images/test.complex.image.png" themed={true} alt="Test" />,
    );

    const source = container.querySelector("source");
    // Should replace all dots with -dark before extension
    expect(source).toHaveAttribute(
      "srcSet",
      "/images/test-dark.complex-dark.image-dark.png",
    );
  });

  it("should have correct styling classes", () => {
    const { container } = render(<Picture {...defaultProps} />);

    const picture = container.querySelector("picture");
    expect(picture).toHaveClass("overflow-hidden");
    expect(picture).toHaveClass("rounded");
    expect(picture).toHaveClass("shadow-sm");
    expect(picture).toHaveClass("w-full");
  });

  it("should render img with w-full class", () => {
    render(<Picture {...defaultProps} />);

    const img = screen.getByAltText("Test image description");
    expect(img).toHaveClass("w-full");
  });

  it("should handle themed images correctly across theme changes", () => {
    vi.mocked(useTheme).mockReturnValue("light");

    const { container, rerender } = render(
      <Picture {...defaultProps} themed={true} />,
    );

    // Light theme - no source
    expect(container.querySelector("source")).not.toBeInTheDocument();

    // Switch to dark theme
    vi.mocked(useTheme).mockReturnValue("dark");
    rerender(<Picture {...defaultProps} themed={true} />);

    // Dark theme - source should exist
    expect(container.querySelector("source")).toBeInTheDocument();
  });

  it("should handle src without extension", () => {
    vi.mocked(useTheme).mockReturnValue("dark");

    render(<Picture src="/images/test" themed={true} alt="Test" />);

    const img = screen.getByAltText("Test");
    expect(img).toHaveAttribute("src", "/images/test");
  });
});
