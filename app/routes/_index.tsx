import type { MetaFunction } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { json } from '@remix-run/cloudflare'
import { getPosts } from '~/.server/posts'
import { formatDistanceToNow } from 'date-fns'
import LinkBlock from '~/components/link-block'
import tags from '~/components/tags'

export const meta: MetaFunction = () => tags()

export const loader = async () => json(await getPosts())

export default function Index() {
  const posts = useLoaderData<typeof loader>()

  return (
    <div className="grid sm:grid-cols-2 gap-4 max-w-[65ch] content-end h-full">
      <h1 className="text-gray-400 dark:text-gray-500 col-span-full">
        ❯ cd ~/code.charliegleason.com
      </h1>
      <div className="text-gray-900 dark:text-gray-100 sm:col-span-2 bg-white dark:bg-gray-950">
        <div className="rounded-md overflow-hidden shadow-sm divide-y divide-gray-100 dark:divide-gray-900 border border-gray-200 dark:border-gray-800">
          {posts.length ? (
            posts.map(({ slug, date, frontmatter }) => {
              const dateCaption = date
                ? `${formatDistanceToNow(date)} ago`
                : null
              return (
                <LinkBlock
                  key={slug}
                  title={frontmatter.title}
                  description={frontmatter.description}
                  caption={dateCaption}
                  href={slug}
                />
              )
            })
          ) : (
            <p className="flex items-center p-4 leading-6 text-gray-400">
              No posts found.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
