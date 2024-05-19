import { ServerBuild } from '@remix-run/node'
import { parseISO } from 'date-fns'

export type Frontmatter = {
  title: string
  description: string
  published: string // YYYY-MM-DD
  featured: boolean
  data: []
  links: []
}

export type PostMeta = {
  slug: string
  date: string
  frontmatter: Frontmatter
}

const IGNORE_LIST = new Set(['about'])

export const getPosts = async (): Promise<PostMeta[]> => {
  const modules = import.meta.glob<{ frontmatter: Frontmatter }>(
    '../routes/_post.*.mdx',
    { eager: true }
  )
  const build = await import('virtual:remix/server-build')
  const posts = Object.entries(modules)
    .map(([file, post]) => {
      const id = file.replace('../', '').replace(/\.mdx$/, '')

      const date = /(?:|)(\d{4}-\d{2}-\d{2})/.exec(id)

      const slug = build.routes[id].path
      if (slug === undefined) throw new Error(`No route for ${id}`)

      return {
        slug,
        date: date && parseISO(date[0]),
        frontmatter: post.frontmatter,
      }
    })
    .filter((post) => !IGNORE_LIST.has(post.slug))

  return sortBy(posts, (post) => post.frontmatter.published, 'desc')
}

function sortBy<T>(
  arr: T[],
  key: (item: T) => any,
  dir: 'asc' | 'desc' = 'asc'
) {
  return arr.sort((a, b) => {
    const res = compare(key(a), key(b))
    return dir === 'asc' ? res : -res
  })
}

function compare<T>(a: T, b: T): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
