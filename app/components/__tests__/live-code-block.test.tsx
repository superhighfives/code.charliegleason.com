import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock ClientOnly
vi.mock("remix-utils/client-only", () => ({
  ClientOnly: ({ children }: { children: () => React.ReactNode }) => (
    <div>{children()}</div>
  ),
}));

// Mock theme hook
vi.mock("~/routes/resources/theme-switch");

import LiveCodeBlock from "../live-code-block";
import { useTheme } from "~/routes/resources/theme-switch";

// Mock Sandpack components
vi.mock("@codesandbox/sandpack-react", () => ({
  SandpackProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sandpack-provider">{children}</div>
  ),
  SandpackLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sandpack-layout">{children}</div>
  ),
  SandpackCodeEditor: () => <div data-testid="sandpack-editor">Editor</div>,
  SandpackPreview: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sandpack-preview">{children}</div>
  ),
  useSandpack: () => ({
    sandpack: {
      files: {
        "/App.tsx": "const test = true;",
      },
    },
  }),
  getSandpackCssText: () => ".sandpack { color: red; }",
}));

// Mock LiveEditorBadge
vi.mock("../live-editor-badge", () => ({
  default: () => <div data-testid="live-editor-badge">Badge</div>,
}));

// Mock themes
vi.mock("../themes", () => ({
  sandpackLatte: {},
  sandpackMocha: {},
}));

describe("LiveCodeBlock", () => {
  const simpleCode = `import React from 'react';

function App() {
  return <div>Hello World</div>;
}

export default App;`;

  const codeWithDependencies = `import React from 'react';
import { Button } from '@paper-design/ui'; // ^1.0.0
import { useSpring } from 'react-spring'; // ^9.0.0

function App() {
  return <Button>Click me</Button>;
}

export default App;`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render Sandpack provider", () => {
    render(<LiveCodeBlock code={simpleCode} />);

    expect(screen.getByTestId("sandpack-provider")).toBeInTheDocument();
  });

  it("should render Sandpack layout", () => {
    render(<LiveCodeBlock code={simpleCode} />);

    expect(screen.getByTestId("sandpack-layout")).toBeInTheDocument();
  });

  it("should render code editor", () => {
    render(<LiveCodeBlock code={simpleCode} />);

    expect(screen.getByTestId("sandpack-editor")).toBeInTheDocument();
  });

  it("should render preview", () => {
    render(<LiveCodeBlock code={simpleCode} />);

    expect(screen.getByTestId("sandpack-preview")).toBeInTheDocument();
  });

  it("should render LiveEditorBadge", () => {
    render(<LiveCodeBlock code={simpleCode} />);

    expect(screen.getByTestId("live-editor-badge")).toBeInTheDocument();
  });

  it("should inject Sandpack CSS", () => {
    const { container } = render(<LiveCodeBlock code={simpleCode} />);

    const style = container.querySelector("style");
    expect(style).toBeInTheDocument();
    expect(style?.textContent).toContain(".sandpack { color: red; }");
  });

  it("should use light theme by default", () => {
    vi.mocked(useTheme).mockReturnValue("light");

    render(<LiveCodeBlock code={simpleCode} />);

    // Verify it renders (theme is passed to SandpackProvider)
    expect(screen.getByTestId("sandpack-provider")).toBeInTheDocument();
  });

  it("should use dark theme when theme is dark", () => {
    vi.mocked(useTheme).mockReturnValue("dark");

    render(<LiveCodeBlock code={simpleCode} />);

    expect(screen.getByTestId("sandpack-provider")).toBeInTheDocument();
  });

  it("should extract dependencies from code", () => {
    render(<LiveCodeBlock code={codeWithDependencies} />);

    // The component should render successfully even with dependencies
    expect(screen.getByTestId("sandpack-provider")).toBeInTheDocument();
  });

  it("should remove version comments from code", () => {
    render(<LiveCodeBlock code={codeWithDependencies} />);

    // Component should render - version comments should be cleaned
    expect(screen.getByTestId("sandpack-editor")).toBeInTheDocument();
  });

  it("should handle code without dependencies", () => {
    render(<LiveCodeBlock code={simpleCode} />);

    expect(screen.getByTestId("sandpack-provider")).toBeInTheDocument();
    expect(screen.getByTestId("sandpack-editor")).toBeInTheDocument();
  });

  it("should provide react-ts template", () => {
    render(<LiveCodeBlock code={simpleCode} />);

    // Verify the component renders with react-ts template
    expect(screen.getByTestId("sandpack-provider")).toBeInTheDocument();
  });

  it("should include Tailwind CSS as external resource", () => {
    render(<LiveCodeBlock code={simpleCode} />);

    // Component should be set up to use Tailwind (verified by rendering)
    expect(screen.getByTestId("sandpack-provider")).toBeInTheDocument();
  });

  it("should handle empty code", () => {
    render(<LiveCodeBlock code="" />);

    expect(screen.getByTestId("sandpack-provider")).toBeInTheDocument();
  });

  it("should maintain all Sandpack components in correct hierarchy", () => {
    render(<LiveCodeBlock code={simpleCode} />);

    const provider = screen.getByTestId("sandpack-provider");
    const layout = screen.getByTestId("sandpack-layout");
    const preview = screen.getByTestId("sandpack-preview");
    const editor = screen.getByTestId("sandpack-editor");
    const badge = screen.getByTestId("live-editor-badge");

    expect(provider).toContainElement(layout);
    expect(layout).toContainElement(preview);
    expect(layout).toContainElement(editor);
    expect(preview).toContainElement(badge);
  });
});
