import { isRouteErrorResponse, useRouteError } from '@remix-run/react'
import { Skull } from 'lucide-react'

export default function ErrorView() {
  const error = useRouteError()
  return (
    <div className="grid sm:grid-cols-2 gap-4 max-w-[65ch] content-end h-full">
      <h1 className="text-gray-400 dark:text-gray-500 col-span-full">
        ❯ cd ~/code.charliegleason.com
      </h1>
      <div className="text-gray-900 dark:text-gray-100 sm:col-span-2 bg-white dark:bg-gray-950 flex gap-3">
        <Skull size={20} className="shrink-0" />
        <h2>
          {isRouteErrorResponse(error)
            ? `${error.status}: ${error.statusText}`
            : error instanceof Error
              ? error.message
              : 'Unknown Error'}
        </h2>
      </div>
    </div>
  )
}
