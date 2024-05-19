import { Outlet, useMatches, Link } from '@remix-run/react'
import { Frontmatter } from '~/.server/posts'
import Metadata from '~/components/metadata'
import type { MetaData as MetaDataType } from '~/components/metadata'
import { parseISO, format } from 'date-fns'

export default function Post() {
  const params = useMatches().at(-1)
  const { title, data, links } = params?.handle as Frontmatter

  const metadata: MetaDataType[] =
    data &&
    Object.entries(data).map(([key, value]) => {
      return { key, value }
    })

  const metalinks =
    links &&
    Object.entries(links).map(([key, value]) => {
      return { key, value }
    })

  const rawDate = /(?:|)(\d{4}-\d{2}-\d{2})/.exec(params!.id)
  if (rawDate) {
    metadata.unshift({
      key: 'Date',
      value: format(parseISO(rawDate[0]), 'dd/MM/yyyy'),
    })
  }

  return (
    <div className="grid gap-y-4">
      <div className="flex gap-4">
        <Link to="/" className="text-indigo-600 group-hover:text-indigo-500">
          ❮ Back
        </Link>
        <h1>{title}</h1>
      </div>
      <Metadata data={metadata} links={metalinks} />
      <div className="prose prose-headings:text-sm prose-sm">
        <Outlet />
      </div>
    </div>
  )
}
