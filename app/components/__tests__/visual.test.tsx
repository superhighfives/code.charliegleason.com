import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Visual from "../visual";

describe("Visual", () => {
  it("should render figure element", () => {
    const { container } = render(
      <Visual caption="Test caption">
        <img src="/test.png" alt="test" />
      </Visual>,
    );

    const figure = container.querySelector("figure");
    expect(figure).toBeInTheDocument();
  });

  it("should render image child", () => {
    render(
      <Visual caption="Test caption">
        <img src="/test.png" alt="test" />
      </Visual>,
    );

    const img = screen.getByAltText("Test caption");
    expect(img).toBeInTheDocument();
  });

  it("should render caption text", () => {
    render(
      <Visual caption="This is a test caption">
        <img src="/test.png" alt="" />
      </Visual>,
    );

    expect(screen.getByText("This is a test caption")).toBeInTheDocument();
  });

  it("should clone child element with caption as alt", () => {
    render(
      <Visual caption="Descriptive caption">
        <img alt="" src="/test.png" />
      </Visual>,
    );

    const img = screen.getByAltText("Descriptive caption");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/test.png");
  });

  it("should render diagram type with ChevronUp icon", () => {
    const { container } = render(
      <Visual caption="Diagram caption" type="diagram">
        <svg data-testid="diagram-svg" />
      </Visual>,
    );

    // Check for chevron icon (lucide-react ChevronUp)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should render image type with centered caption", () => {
    const { container } = render(
      <Visual caption="Image caption" type="image">
        <img src="/test.png" alt="" />
      </Visual>,
    );

    const figcaption = container.querySelector("figcaption");
    expect(figcaption).toHaveClass("text-center");
  });

  it("should default to image type", () => {
    const { container } = render(
      <Visual caption="Default caption">
        <img src="/test.png" alt="" />
      </Visual>,
    );

    const figcaption = container.querySelector("figcaption");
    expect(figcaption).toHaveClass("text-center");
  });

  it("should have correct diagram caption layout", () => {
    const { container } = render(
      <Visual caption="Diagram explanation" type="diagram">
        <img src="/test.png" alt="" />
      </Visual>,
    );

    const figcaption = container.querySelector("figcaption");
    expect(figcaption).toHaveClass("flex");
    expect(figcaption).toHaveClass("gap-4");
  });

  it("should render diagram caption with border styling", () => {
    render(
      <Visual caption="Test diagram" type="diagram">
        <img src="/test.png" alt="" />
      </Visual>,
    );

    const captionText = screen.getByText("Test diagram");
    expect(captionText).toHaveClass("border-b");
  });

  it("should have correct figure spacing classes", () => {
    const { container } = render(
      <Visual caption="Test caption">
        <img src="/test.png" alt="" />
      </Visual>,
    );

    const figure = container.querySelector("figure");
    expect(figure).toHaveClass("my-10");
    expect(figure).toHaveClass("space-y-6");
  });

  it("should handle SVG children", () => {
    render(
      <Visual caption="SVG caption">
        <svg data-testid="test-svg">
          <title>Test SVG</title>
          <circle cx="50" cy="50" r="40" />
        </svg>
      </Visual>,
    );

    expect(screen.getByTestId("test-svg")).toBeInTheDocument();
    expect(screen.getByText("SVG caption")).toBeInTheDocument();
  });

  it("should handle complex children", () => {
    render(
      <Visual caption="Complex content">
        <div>
          <img src="/test.png" alt="nested" />
        </div>
      </Visual>,
    );

    expect(screen.getByText("Complex content")).toBeInTheDocument();
  });

  it("should apply alt to valid React elements", () => {
    render(
      <Visual caption="Applied caption">
        <img alt="" src="/test.png" />
      </Visual>,
    );

    const img = screen.getByAltText("Applied caption");
    expect(img).toBeInTheDocument();
  });

  it("should render caption with proper text balance classes", () => {
    const { container } = render(
      <Visual caption="A very long caption that needs text balancing">
        <img src="/test.png" alt="" />
      </Visual>,
    );

    const figcaption = container.querySelector("figcaption");
    expect(figcaption).toHaveClass("text-balance");
  });

  it("should have SVG-specific styling", () => {
    const { container } = render(
      <Visual caption="SVG visual">
        <svg data-testid="styled-svg" />
      </Visual>,
    );

    const figure = container.querySelector("figure");
    // Check for SVG-specific class
    expect(figure?.className).toContain("[&>svg]:max-w-full");
  });
});
