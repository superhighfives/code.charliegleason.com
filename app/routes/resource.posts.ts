import { json } from '@remix-run/cloudflare'
import { getPosts } from '~/.server/posts'

export const loader = async () => {
  const posts = await getPosts()

  return json(posts, {
    status: 200,
    headers: {
      // 'cache-control': 'public, immutable, no-transform, max-age=86400',
    },
  })
}
