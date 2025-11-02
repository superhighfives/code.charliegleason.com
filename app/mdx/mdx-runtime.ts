import manifest from "virtual:mdx-manifest";
import type { MdxFile, MdxRuntimeData, Post } from "./types";

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
    };
  });
}

export function getMdxRoutesRuntime() {
  // Return a synchronous function that returns routes based on build-time manifest
  // This will be used by the routes.ts file
  return []; // We'll need to handle this differently
}
