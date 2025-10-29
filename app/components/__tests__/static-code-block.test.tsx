import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Code } from "../static-code-block";

describe("Static Code Block (Code)", () => {
  const highlightedHtml = `<pre><code class="language-javascript"><span class="token keyword">const</span> <span class="token variable">x</span> <span class="token operator">=</span> <span class="token number">42</span><span class="token punctuation">;</span></code></pre>`;

  it("should render code block container", () => {
    const { container } = render(<Code highlightedHtml={highlightedHtml} />);

    const codeContainer = container.querySelector(".py-4");
    expect(codeContainer).toBeInTheDocument();
  });

  it("should render highlighted HTML", () => {
    const { container } = render(<Code highlightedHtml={highlightedHtml} />);

    expect(container.querySelector("pre")).toBeInTheDocument();
    expect(container.querySelector("code")).toBeInTheDocument();
  });

  it("should have correct padding class", () => {
    const { container } = render(<Code highlightedHtml={highlightedHtml} />);

    const codeContainer = container.firstChild as HTMLElement;
    expect(codeContainer).toHaveClass("py-4");
  });

  it("should render with dangerouslySetInnerHTML", () => {
    const { container } = render(<Code highlightedHtml={highlightedHtml} />);

    // Verify the HTML is rendered correctly
    expect(container.querySelector(".token.keyword")).toBeInTheDocument();
    expect(container.querySelector(".token.variable")).toBeInTheDocument();
    expect(container.querySelector(".token.number")).toBeInTheDocument();
  });

  it("should handle simple code without syntax highlighting", () => {
    const simpleHtml = "<pre><code>console.log('hello');</code></pre>";

    const { container } = render(<Code highlightedHtml={simpleHtml} />);

    expect(container.querySelector("pre")).toBeInTheDocument();
    expect(container.querySelector("code")).toBeInTheDocument();
  });

  it("should handle multiline code", () => {
    const multilineHtml = `<pre><code>line 1
line 2
line 3</code></pre>`;

    const { container } = render(<Code highlightedHtml={multilineHtml} />);

    expect(container.querySelector("code")?.textContent).toContain("line 1");
    expect(container.querySelector("code")?.textContent).toContain("line 2");
    expect(container.querySelector("code")?.textContent).toContain("line 3");
  });

  it("should handle empty HTML string", () => {
    const { container } = render(<Code highlightedHtml="" />);

    const codeContainer = container.firstChild as HTMLElement;
    expect(codeContainer).toBeInTheDocument();
    expect(codeContainer).toHaveClass("py-4");
  });

  it("should handle complex highlighted code with multiple token types", () => {
    const complexHtml = `<pre><code class="language-typescript"><span class="token keyword">import</span> <span class="token punctuation">{</span> useState <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'react'</span><span class="token punctuation">;</span></code></pre>`;

    const { container } = render(<Code highlightedHtml={complexHtml} />);

    expect(container.querySelector(".token.keyword")).toBeInTheDocument();
    expect(container.querySelector(".token.string")).toBeInTheDocument();
    expect(container.querySelector(".token.punctuation")).toBeInTheDocument();
  });

  it("should preserve all HTML structure from shiki", () => {
    const { container } = render(<Code highlightedHtml={highlightedHtml} />);

    // Check that the structure is preserved
    const pre = container.querySelector("pre");
    const code = container.querySelector("code");
    const tokens = container.querySelectorAll(".token");

    expect(pre).toBeInTheDocument();
    expect(code).toBeInTheDocument();
    expect(tokens.length).toBeGreaterThan(0);
  });

  it("should handle code with language class", () => {
    const htmlWithLanguage = `<pre><code class="language-python">print("Hello World")</code></pre>`;

    const { container } = render(<Code highlightedHtml={htmlWithLanguage} />);

    const code = container.querySelector("code");
    expect(code).toHaveClass("language-python");
  });
});
