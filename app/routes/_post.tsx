import { Outlet, useMatches, Link } from '@remix-run/react'
import { Frontmatter } from '~/.server/posts'
import Metadata from '~/components/metadata'
import Metalinks from '~/components/metalinks'
import type { MetaData as MetaDataType } from '~/components/metadata'
import { parseISO, format, differenceInMonths } from 'date-fns'

export default function Post() {
  const params = useMatches().at(-1)
  const { title, data, links } = params?.handle as Frontmatter

  const metadata: MetaDataType[] =
    (data &&
      Object.entries(data).map(([key, value]) => {
        return { key, value }
      })) ||
    []

  const metalinks =
    links &&
    Object.entries(links).map(([key, value]) => {
      return { key, value }
    })

  const rawDate = /(?:|)(\d{4}-\d{2}-\d{2})/.exec(params!.id)
  let oldArticle = false
  if (rawDate) {
    const dateObject = parseISO(rawDate[0])
    metadata.unshift({
      key: 'Last Updated',
      value: format(dateObject, 'dd/MM/yyyy'),
    })

    if (differenceInMonths(Date.now(), dateObject) >= 3) oldArticle = true
  }

  return (
    <div className="grid gap-y-4">
      <div className="flex gap-4 font-medium">
        <Link
          to="/"
          className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          ❯ cd ~/code
          <span className="hidden sm:inline">.charliegleason.com</span>
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <h1 className="text-gray-900 dark:text-gray-100">{title}</h1>
      </div>
      <Metadata data={metadata} />
      {oldArticle ? (
        <p className="rounded-md overflow-hidden border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 sm:px-4 py-3 max-w-[65ch]">
          This has not been updated in the last three months, so this
          information miiiiiight be out of date. Here be dragons, etc.
        </p>
      ) : null}
      <div className="prose prose-headings:text-sm prose-sm dark:prose-invert prose-a:text-indigo-600 hover:prose-a:text-indigo-500 dark:prose-a:text-indigo-400 dark:hover:prose-a:text-indigo-300 prose-a:no-underline py-3 sm:px-4 border border-transparent">
        <Outlet />
      </div>
      <Metalinks links={metalinks} />
    </div>
  )
}
