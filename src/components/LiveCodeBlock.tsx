import {
  getSandpackCssText,
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { useEffect, useState } from "react";
import LiveEditorBadge from "./LiveEditorBadge";
import { sandpackLatte, sandpackMocha } from "./themes";

interface LiveCodeBlockProps {
  code: string;
  theme?: "light" | "dark";
}

const css = `body {
font-family: sans-serif;
-webkit-font-smoothing: auto;
-moz-font-smoothing: auto;
-moz-osx-font-smoothing: grayscale;
font-smoothing: auto;
text-rendering: optimizeLegibility;
font-smooth: always;
-webkit-tap-highlight-color: transparent;
-webkit-touch-callout: none;
background-color: #000;
}

html,
body,
#root {
height: 100%;
}

h1 {
font-size: 1.5rem;
}`;

function extractDependencies(code: string): {
  dependencies: Record<string, string>;
  cleanedCode: string;
} {
  // Match import statements with optional version comment
  // Example: import { MeshGradient } from '@paper-design/shaders-react' // ^0.0.55
  const importRegex =
    /import\s+.*?\s+from\s+['"]([^'"]+)['"](?:\s*\/\/\s*(.+))?/g;
  const dependencies: Record<string, string> = {};
  let cleanedCode = code;
  let match = importRegex.exec(code);

  while (match !== null) {
    const packageName = match[1];
    const version = match[2]?.trim();
    // Only include external packages (not relative imports)
    if (!packageName.startsWith(".") && !packageName.startsWith("/")) {
      dependencies[packageName] = version || "latest";
      // Remove version comment from the code if it exists
      if (version) {
        cleanedCode = cleanedCode.replace(
          match[0],
          match[0].replace(/\s*\/\/\s*.+$/, ""),
        );
      }
    }
    match = importRegex.exec(code);
  }

  return { dependencies, cleanedCode };
}

function SandpackContent({
  onCodeChange,
}: {
  onCodeChange: (code: string) => void;
}) {
  const { sandpack } = useSandpack();

  useEffect(() => {
    const currentCode = sandpack.files["/App.tsx"];
    const code =
      typeof currentCode === "string" ? currentCode : currentCode?.code;
    if (code) {
      onCodeChange(code);
    }
  }, [sandpack.files, onCodeChange]);

  return (
    <SandpackLayout>
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        showOpenNewtab={false}
      >
        <LiveEditorBadge />
      </SandpackPreview>
      <SandpackCodeEditor />
    </SandpackLayout>
  );
}

export default function LiveCodeBlock({ code, theme }: LiveCodeBlockProps) {
  const { dependencies, cleanedCode } = extractDependencies(code);
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    theme || "light",
  );

  // Track the current code state across theme changes
  const [currentCode, setCurrentCode] = useState(cleanedCode);

  // Detect theme from DOM on mount and inject Sandpack CSS
  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setCurrentTheme(isDark ? "dark" : "light");

    // Inject Sandpack CSS into head
    const styleId = "sandpack-css";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = getSandpackCssText();
      document.head.appendChild(style);
    }

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          const isDark = document.documentElement.classList.contains("dark");
          setCurrentTheme(isDark ? "dark" : "light");
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // SSR fallback - show static code block matching Sandpack height
  if (!mounted) {
    return (
      <div className="not-prose code">
        <pre className="py-4 overflow-x-auto h-[300px]">
          <code>{cleanedCode}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="not-prose code">
      <SandpackProvider
        theme={currentTheme === "dark" ? sandpackMocha : sandpackLatte}
        files={{
          "/App.tsx": currentCode,
          "/styles.css": { code: css, hidden: true },
        }}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          classes: {
            "sp-wrapper": "custom-wrapper",
            "sp-layout": "custom-layout",
            "sp-editor": "custom-editor",
            "sp-code-editor": "custom-code-editor",
            "sp-pre-placeholder": "custom-pre-placeholder",
            "sp-preview-frame": "custom-preview-frame",
            "sp-preview": "custom-preview",
          },
        }}
        template="react-ts"
        customSetup={{
          dependencies,
        }}
      >
        <SandpackContent onCodeChange={setCurrentCode} />
      </SandpackProvider>
    </div>
  );
}
