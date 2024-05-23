export default function tags({
  title,
  description,
  image,
}: {
  title?: string
  description?: string
  image?: string
}) {
  const metaTitle = `${title ? `${title} ` : null}❯ ~/code.charliegleason.com`
  const metaDescription = description
    ? `${description}`
    : 'Tutorials, code snippets, and resources for design and front end development'
  const metaImage = image ? image : '/social-default.png'

  return [
    { title: metaTitle },
    {
      name: 'title',
      content: metaTitle,
    },
    {
      name: 'description',
      content: metaDescription,
    },
    {
      property: 'og:title',
      content: title,
    },
    {
      property: 'og:description',
      content: metaDescription,
    },
    {
      property: 'og:image',
      content: metaImage,
    },
    {
      property: 'og:type',
      content: 'website',
    },
  ]
}
