import type { MetaFunction } from '@remix-run/cloudflare'
import { useLoaderData, Link } from '@remix-run/react'
import { json } from '@remix-run/cloudflare'
import { getPosts } from '~/.server/posts'
import { formatDistanceToNow } from 'date-fns'
import LinkBlock from '~/components/link-block'
import tags from '~/components/tags'
import { Hand } from 'lucide-react'

export const meta: MetaFunction = () => tags()

export const loader = async () => json(await getPosts())

export default function Index() {
  const posts = useLoaderData<typeof loader>()

  return (
    <div className="grid sm:grid-cols-2 gap-4 max-w-[65ch] content-end h-full">
      <div className="flex gap-4 dark:text-white col-span-full pb-8">
        <div className="sm:w-60 sm:border border-indigo-500 text-indigo-500 sm:h-full flex flex-col sm:flex:row sm:items-center sm:justify-center aspect-square rounded">
          <Hand size="48" className="rotate-45" />
        </div>
        <div className="flex flex-col gap-2 items-start">
          <h2 className="border-b border-indigo-500 pb-2 font-bold">
            Hello, I'm Charlie.
          </h2>
          <p className="leading-relaxed text-gray-600 dark:text-gray-400">
            I'm a designer, developer, creative coder, and sometimes musician. I
            write about design and development.{' '}
            <Link
              className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              to="/about"
            >
              More about me.
            </Link>
          </p>
        </div>
      </div>
      <h1 className="text-gray-400 dark:text-gray-500 col-span-full">
        ❯ cd ~/code.charliegleason.com
      </h1>
      <div className="text-gray-900 dark:text-gray-100 sm:col-span-2 bg-white dark:bg-gray-950 grid gap-4">
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
