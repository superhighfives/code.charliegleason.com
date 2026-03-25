// Parses import statements from code strings, extracting package names and
// optional version comments (e.g. `// ^1.2.3`). Returns the dependency map
// and a cleaned version of the code with version comments removed.
export function extractDependencies(code: string): {
  dependencies: Record<string, string>;
  cleanedCode: string;
} {
  const importRegex =
    /import\s+.*?\s+from\s+['"]([^'"]+)['"](?:\s*\/\/\s*(.+))?/g;
  const dependencies: Record<string, string> = {};
  let cleanedCode = code;
  let match = importRegex.exec(code);

  while (match !== null) {
    const packageName = match[1];
    const version = match[2]?.trim();
    if (!packageName.startsWith(".") && !packageName.startsWith("/")) {
      dependencies[packageName] = version || "latest";
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
