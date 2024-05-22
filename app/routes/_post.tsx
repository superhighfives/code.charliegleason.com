import { Outlet, useMatches, Link } from '@remix-run/react'
import { Frontmatter } from '~/.server/posts'
import Metadata from '~/components/metadata'
import Metalinks from '~/components/metalinks'
import type { MetaData as MetaDataType } from '~/components/metadata'
import { parseISO, format } from 'date-fns'

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
  if (rawDate) {
    metadata.unshift({
      key: 'Last Updated',
      value: format(parseISO(rawDate[0]), 'dd/MM/yyyy'),
    })
  }

  const date = metadata.find((obj) => {
    return obj.key === 'Last Updated'
  })
  console.log(date?.value)

  return (
    <div className="grid gap-y-4">
      <div className="flex gap-4">
        <Link
          to="/"
          className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-500 dark:hover:text-indigo-400"
        >
          ❯ cd ~/code
          <span className="hidden sm:inline">.charliegleason.com</span>
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <h1 className="dark:text-gray-100">{title}</h1>
      </div>
      <Metadata data={metadata} />
      <div className="prose prose-headings:text-sm prose-sm dark:prose-invert py-3 px-4">
        <Outlet />
      </div>
      <Metalinks links={metalinks} />
    </div>
  )
}
