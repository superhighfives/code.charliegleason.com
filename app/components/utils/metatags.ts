import type { PostFrontmatter } from "~/mdx/types";

// Square loops produced by scripts/generate-videos.ts, served from R2
const OG_VIDEO_SIZE = 640;

function baseUrl() {
  return import.meta.env.PROD
    ? "https://code.charliegleason.com"
    : "http://localhost:8080";
}

function generateImage(slug: string, index?: number) {
  return `${baseUrl()}/${slug}${index ? `/${index}` : ""}.png`;
}

// Takes the user-facing index (1-based), matching generateImage
function generateVideo(slug: string, index: number) {
  return `${baseUrl()}/posts/${slug}/${index - 1}.mp4`;
}

export default function tags(attributes?: PostFrontmatter, index?: number) {
  const { title, description, slug, visual } = attributes || {};
  const metaTitle = `${title ? `${title} ` : ""}❯ ~/code.charliegleason.com`;
  const metaDescription = description
    ? `${description}`
    : "Tutorials, code snippets, and resources for design and front end development";
  const metaImage = visual
    ? slug && generateImage(slug, index)
    : "/social-default.png";

  // Only emit og:video when we know which visual the og:image shows,
  // so link previews don't pair an image with a different video
  const metaVideo =
    visual?.video && slug && index ? generateVideo(slug, index) : undefined;

  return [
    { title: metaTitle },
    {
      name: "title",
      content: metaTitle,
    },
    {
      name: "description",
      content: metaDescription,
    },
    {
      property: "og:title",
      content: title,
    },
    {
      property: "og:description",
      content: metaDescription,
    },
    {
      property: "og:image",
      content: metaImage,
    },
    ...(metaVideo
      ? [
          { property: "og:video", content: metaVideo },
          { property: "og:video:secure_url", content: metaVideo },
          { property: "og:video:type", content: "video/mp4" },
          { property: "og:video:width", content: String(OG_VIDEO_SIZE) },
          { property: "og:video:height", content: String(OG_VIDEO_SIZE) },
        ]
      : []),
    {
      property: "og:type",
      content: "website",
    },
  ];
}
