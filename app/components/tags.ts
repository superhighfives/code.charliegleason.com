function generateImage(title: string, description?: string) {
  let url = `/resource/og?title=${title}`
  if (description) url += `&description=${description}`
  return url
}

export default function tags({
  title,
  description,
  image = false,
}: {
  title?: string
  description?: string
  image?: boolean
}) {
  const metaTitle = `${title ? `${title} ` : null}❯ ~/code.charliegleason.com`
  const metaDescription = description
    ? `${description}`
    : 'Tutorials, code snippets, and resources for design and front end development'
  const metaImage = image
    ? generateImage(title, description)
    : '/social-default.png'

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
