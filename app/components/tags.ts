function generateImage(title: string) {
  const url = new URL(
    `${import.meta.env.PROD ? 'https://code.charliegleason.com' : 'http://localhost:5173'}/resource/og`
  )
  url.searchParams.set('title', title)
  return url.toString()
}

export default function tags({
  title,
  description,
  image = false,
}: {
  title?: string
  description?: string
  image?: boolean
} = {}) {
  const metaTitle = `${title ? `${title} ` : ''}❯ ~/code.charliegleason.com`
  const metaDescription = description
    ? `${description}`
    : 'Tutorials, code snippets, and resources for design and front end development'
  const metaImage = image
    ? title && generateImage(title)
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
