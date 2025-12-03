import manifest from "virtual:mdx-manifest";
import type { MdxFile, MdxRuntimeData, Post } from "./types";

/**
 * Strip markdown formatting from text
 */
function stripMarkdown(text: string): string {
  return (
    text
      // Remove links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove bold **text** or __text__ -> text
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      // Remove italic *text* or _text_ -> text
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // Remove inline code `code` -> code
      .replace(/`([^`]+)`/g, "$1")
      // Remove strikethrough ~~text~~ -> text
      .replace(/~~(.*?)~~/g, "$1")
  );
}

/**
 * Extract the first couple of paragraphs from MDX content
 * Skips frontmatter, code blocks, and component tags
 */
function extractExcerpt(content: string, paragraphCount = 4): string {
  // Remove frontmatter if present
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, "");

  // Split by double newlines to get paragraphs
  const lines = withoutFrontmatter.split("\n");
  const paragraphs: string[] = [];
  let currentParagraph = "";
  let inCodeBlock = false;
  let inComponent = false;

  for (const line of lines) {
    // Track code blocks
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip code blocks
    if (inCodeBlock) continue;

    // Track JSX components (simple detection)
    if (line.trim().startsWith("<") && !line.trim().startsWith("</")) {
      inComponent = true;
    }
    if (line.trim().startsWith("</") || line.trim().endsWith("/>")) {
      inComponent = false;
      continue;
    }

    // Skip component content
    if (inComponent) continue;

    // Skip empty lines and headings
    if (!line.trim() || line.trim().startsWith("#")) {
      if (currentParagraph.trim()) {
        paragraphs.push(stripMarkdown(currentParagraph.trim()));
        currentParagraph = "";
      }
      continue;
    }

    // Build paragraph
    currentParagraph += (currentParagraph ? " " : "") + line.trim();
  }

  // Add final paragraph if exists
  if (currentParagraph.trim()) {
    paragraphs.push(stripMarkdown(currentParagraph.trim()));
  }

  // Return first N paragraphs
  return paragraphs.slice(0, paragraphCount).join("\n\n");
}

export async function getRuntimeMdxManifest(): Promise<{ files: MdxFile[] }> {
  return manifest;
}

export async function loadMdxRuntime(
  requestUrl: string,
): Promise<MdxRuntimeData> {
  const url = new URL(requestUrl);
  let pathname = url.pathname;

  // Strip image index from pathname if present (e.g., /hello-world/15 -> /hello-world)
  // Image indices are numbers 1-21
  pathname = pathname.replace(/\/\d+$/, "");

  const { files } = await getRuntimeMdxManifest();
  const mdxFile = files.find(
    (file) => file.url === pathname || file.url === pathname.replace(/\/$/, ""),
  );

  if (!mdxFile) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    content: mdxFile.rawContent,
    frontmatter: mdxFile.attributes,
  };
}

export async function loadAllMdxRuntime(
  filterByPaths?: string[],
): Promise<Post[]> {
  const { files } = await getRuntimeMdxManifest();

  let filteredFiles = files;

  if (filterByPaths && filterByPaths.length > 0) {
    filteredFiles = files.filter((file) =>
      filterByPaths.some((path) => file.url.startsWith(`/${path}/`)),
    );
  }

  return filteredFiles.map((file): Post => {
    const { attributes } = file;
    const date = attributes.date ? new Date(attributes.date) : undefined;

    return {
      path: file.path,
      slug: file.slug,
      url: file.url,
      title: attributes.title || "Untitled",
      description: attributes.description,
      date,
      tags: attributes.tags,
      frontmatter: attributes,
      excerpt: extractExcerpt(file.rawContent),
    };
  });
}

export function getMdxRoutesRuntime() {
  // Return a synchronous function that returns routes based on build-time manifest
  // This will be used by the routes.ts file
  return []; // We'll need to handle this differently
}
