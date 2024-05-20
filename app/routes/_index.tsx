import type { MetaFunction } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { json } from '@remix-run/cloudflare'
import { getPosts } from '~/.server/posts'
import type { PostMeta } from '~/.server/posts'
import { formatDistanceToNow } from 'date-fns'

export const meta: MetaFunction = () => {
  return [
    { title: '❯ ~/code.charliegleason.com' },
    {
      name: 'description',
      content:
        'Tutorials, code snippets, and resources for design and front end development',
    },
  ]
}

export const loader = async () => json(await getPosts())

export default function Index() {
  const posts = useLoaderData<typeof loader>()

  return (
    <div className="grid sm:grid-cols-2 gap-4 max-w-[65ch]">
      <h1 className="text-stone-400">❯ ~/code.charliegleason.com</h1>
      <dd className="mt-2 text-gray-900 sm:col-span-2 bg-white">
        <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
          {posts.map(({ slug, date, frontmatter }: PostMeta) => {
            return (
              <a
                key={JSON.stringify(slug)}
                href={slug}
                className="flex items-center justify-between p-4 leading-6 group hover:bg-slate-50"
              >
                <div className="flex w-0 flex-1 items-center">
                  <div className="flex min-w-0 flex-1 gap-2">
                    <span className="truncate font-medium">
                      {frontmatter.title}
                    </span>
                    {date ? (
                      <span className="flex-shrink-0 text-gray-400">
                        {formatDistanceToNow(date)} ago
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className="font-medium text-indigo-600 group-hover:text-indigo-500">
                    Execute
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </dd>
    </div>
  )
}
