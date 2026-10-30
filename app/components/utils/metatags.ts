import type { PostFrontmatter } from "~/mdx/types";

// Animated social cards produced by scripts/generate-og-videos.ts, served
// from R2. Same dimensions as the og:image card they animate.
const OG_VIDEO_WIDTH = 1200;
const OG_VIDEO_HEIGHT = 630;

function defaultOrigin() {
  return import.meta.env.PROD
    ? "https://code.charliegleason.com"
    : "http://localhost:8080";
}

function generateImage(origin: string, slug: string, index?: number) {
  return `${origin}/${slug}${index ? `/${index}` : ""}.png`;
}

// Takes the user-facing index (1-based), matching generateImage
function generateVideo(origin: string, slug: string, index: number) {
  return `${origin}/posts/${slug}/og/${index - 1}.mp4`;
}

export default function tags(
  attributes?: PostFrontmatter,
  index?: number,
  // Lets staging point previews at its own assets
  origin: string = defaultOrigin(),
) {
  const { title, description, slug, visual } = attributes || {};
  const metaTitle = `${title ? `${title} ` : ""}❯ ~/code.charliegleason.com`;
  const metaDescription = description
    ? `${description}`
    : "Tutorials, code snippets, and resources for design and front end development";
  const metaImage = visual
    ? slug && generateImage(origin, slug, index)
    : "/social-default.png";

  // Only emit og:video when we know which visual the og:image shows,
  // so link previews don't pair an image with a different video
  const metaVideo =
    visual?.video && slug && index
      ? generateVideo(origin, slug, index)
      : undefined;

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
          { property: "og:video:width", content: String(OG_VIDEO_WIDTH) },
          { property: "og:video:height", content: String(OG_VIDEO_HEIGHT) },
        ]
      : []),
    {
      property: "og:type",
      // Discord only plays og:video inline when the page is typed as a video
      content: metaVideo ? "video.other" : "website",
    },
  ];
}
