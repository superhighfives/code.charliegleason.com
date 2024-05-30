import { json } from '@remix-run/cloudflare'
import { getPosts } from '~/.server/posts'

export const loader = async ({ limit = 5 }: { limit: number }) => {
  let posts = await getPosts()

  if (limit >= 0) {
    posts = posts.slice(0, limit)
  }

  return json(posts, {
    status: 200,
    headers: {
      // 'cache-control': 'public, immutable, no-transform, max-age=86400',
    },
  })
}
