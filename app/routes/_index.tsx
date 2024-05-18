import type { MetaFunction } from '@remix-run/cloudflare'
import { useLoaderData, Link } from '@remix-run/react'
import { json } from '@remix-run/cloudflare'
import { getPosts } from '~/.server/posts'
import type { PostMeta } from '~/.server/posts'

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    {
      name: 'description',
      content: 'Welcome to Remix! Using Vite and Cloudflare!',
    },
  ]
}

export const loader = async () => json(await getPosts())

export default function Index() {
  const posts = useLoaderData<typeof loader>()
  console.log(posts)

  return (
    <div>
      {posts.map(({ slug, frontmatter }: PostMeta) => (
        <Link to={slug} key={slug}>
          <h1>{frontmatter.title}</h1>
        </Link>
      ))}
    </div>
  )
}
