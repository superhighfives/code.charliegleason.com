function generateImage(slug: string) {
  const url = new URL(
    `${import.meta.env.PROD ? "https://code.charliegleason.com" : "http://localhost:5173"}/resource/og`,
  );
  url.searchParams.set("slug", slug);
  return url.toString();
}

export default function tags({
  title,
  description,
  slug,
  image = false,
}: {
  title?: string;
  description?: string;
  slug?: string;
  image?: boolean;
} = {}) {
  const metaTitle = `${title ? `${title} ` : ""}❯ ~/code.charliegleason.com`;
  const metaDescription = description
    ? `${description}`
    : "Tutorials, code snippets, and resources for design and front end development";
  const metaImage = image ? slug && generateImage(slug) : "/social-default.png";

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
    {
      property: "og:type",
      content: "website",
    },
  ];
}
