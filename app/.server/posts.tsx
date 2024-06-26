// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ServerBuild } from '@remix-run/node'
import { parseISO } from 'date-fns'

export type Frontmatter = {
  title: string
  description: string
  published: string
  featured: boolean
  draft: boolean
  data: []
  links: []
}

export type PostMeta = {
  slug: string
  url?: string
  date?: Date
  frontmatter: Frontmatter
}

const IGNORE_LIST = new Set(['about'])

export const getPosts = async (
  post: { slug: string } | null = null
): Promise<PostMeta[]> => {
  const modules = import.meta.glob<{ frontmatter: Frontmatter }>(
    '../routes/_post.*.mdx',
    { eager: true }
  )

  // eslint-disable-next-line import/no-unresolved
  const build = await import('virtual:remix/server-build')
  const posts = Object.entries(modules).map(([file, post]) => {
    const id = file.replace('../', '').replace(/\.mdx$/, '')

    const slug = build.routes[id].path
    if (slug === undefined) throw new Error(`No route for ${id}`)

    const output: { slug: string; frontmatter: Frontmatter; date?: Date } = {
      slug,
      frontmatter: post.frontmatter,
    }

    const date = /(?:|)(\d{4}-\d{2}-\d{2})/.exec(id)
    if (date) {
      output.date = parseISO(date[0])
    }

    return output
  })

  if (post) {
    return posts.filter((p) => p.slug === post.slug)
  } else {
    return sortBy(
      posts
        .filter(
          (post) => post.slug !== undefined && !IGNORE_LIST.has(post.slug)
        )
        .filter((post) => !post.frontmatter.draft),
      (post) => post.date,
      'desc'
    )
  }
}

function sortBy<T>(
  arr: T[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
