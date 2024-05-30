import { json } from '@remix-run/cloudflare'
import { getPosts } from '~/.server/posts'
import type { LoaderFunctionArgs } from '@remix-run/cloudflare'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { origin } = new URL(request.url)
  console.log(origin)

  let posts = await getPosts()
  posts = posts.slice(0, 5)
  posts = posts.map((post) => {
    post.url = `${origin}/${post.slug}`
    return post
  })

  console.log(posts)

  return json(posts, {
    status: 200,
    headers: {
      // 'cache-control': 'public, immutable, no-transform, max-age=86400',
    },
  })
}
