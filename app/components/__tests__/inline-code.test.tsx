import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InlineCode from "../inline-code";

describe("InlineCode", () => {
  it("should render code element", () => {
    const { container } = render(<InlineCode>const x = 42;</InlineCode>);

    const code = container.querySelector("code");
    expect(code).toBeInTheDocument();
  });

  it("should render children text", () => {
    render(<InlineCode>console.log('test')</InlineCode>);

    expect(screen.getByText("console.log('test')")).toBeInTheDocument();
  });

  it("should have correct styling classes", () => {
    const { container } = render(<InlineCode>test</InlineCode>);

    const code = container.querySelector("code");
    expect(code).toHaveClass("not-prose");
    expect(code).toHaveClass("px-0.5");
    expect(code).toHaveClass("text-green-600");
    expect(code).toHaveClass("dark:text-green-300");
    expect(code).toHaveClass("rounded-xs");
    expect(code).toHaveClass("bg-green-100");
    expect(code).toHaveClass("dark:bg-gray-800");
  });

  it("should have ring styling", () => {
    const { container } = render(<InlineCode>test</InlineCode>);

    const code = container.querySelector("code");
    expect(code).toHaveClass("ring-2");
    expect(code).toHaveClass("ring-green-100");
    expect(code).toHaveClass("dark:ring-gray-800");
  });

  it("should have proper font styling", () => {
    const { container } = render(<InlineCode>test</InlineCode>);

    const code = container.querySelector("code");
    expect(code).toHaveClass("font-normal");
    expect(code).toHaveClass("text-sm");
  });

  it("should handle word breaking", () => {
    const { container } = render(<InlineCode>test</InlineCode>);

    const code = container.querySelector("code");
    expect(code?.className).toContain("[word-break:break-word]");
  });

  it("should remove pseudo-element content", () => {
    const { container } = render(<InlineCode>test</InlineCode>);

    const code = container.querySelector("code");
    expect(code?.className).toContain("before:content-none");
    expect(code?.className).toContain("after:content-none");
  });

  it("should render multiple words", () => {
    render(<InlineCode>npm install react</InlineCode>);

    expect(screen.getByText("npm install react")).toBeInTheDocument();
  });

  it("should render special characters", () => {
    render(<InlineCode>{"<Component />"}</InlineCode>);

    expect(screen.getByText("<Component />")).toBeInTheDocument();
  });

  it("should handle empty children", () => {
    const { container } = render(<InlineCode>{""}</InlineCode>);

    const code = container.querySelector("code");
    expect(code).toBeInTheDocument();
    expect(code?.textContent).toBe("");
  });

  it("should render numbers", () => {
    render(<InlineCode>42</InlineCode>);

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("should render with React node children", () => {
    render(
      <InlineCode>
        <span>nested</span>
      </InlineCode>,
    );

    expect(screen.getByText("nested")).toBeInTheDocument();
  });

  it("should handle long code strings", () => {
    const longCode =
      "import { something } from '@very/long/package/name/that/might/wrap'";
    render(<InlineCode>{longCode}</InlineCode>);

    expect(screen.getByText(longCode)).toBeInTheDocument();
  });
});
