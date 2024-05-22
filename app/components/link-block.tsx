import { ExternalLink } from 'lucide-react'

export default function LinkBlock({
  title,
  caption,
  href,
  action = 'View',
}: {
  title: string
  caption?: string | null
  href: string
  action?: string
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between px-4 py-3 leading-6 group hover:bg-gray-50 dark:hover:bg-gray-900"
      rel="noreferrer"
      target={action === 'Open' ? '_blank' : '_self'}
    >
      <div className="flex w-0 flex-1 items-center">
        <div className="flex min-w-0 flex-1 gap-4">
          <span className="truncate font-medium dark:text-gray-200">
            {title}
          </span>
          {caption ? (
            <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">
              {caption}
            </span>
          ) : null}
        </div>
      </div>
      <div className="ml-4 flex-shrink-0">
        <span className="font-medium text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-500 dark:group-hover:text-indigo-400 flex gap-2 items-center">
          <span className="max-sm:hidden">{action}</span>
          <span className="items-center gap-2">
            {action === 'Open' ? <ExternalLink size={16} /> : <span>❯</span>}
          </span>
        </span>
      </div>
    </a>
  )
}
