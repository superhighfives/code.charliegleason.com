export default function tags({ title }: { title?: string }) {
  const metaTitle = `${title ? `${title} ` : null}❯ ~/code.charliegleason.com`
  const metaDescription =
    'Tutorials, code snippets, and resources for design and front end development'

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
      content: '/social-default.png',
    },
    {
      property: 'og:type',
      content: 'website',
    },
  ]
}
