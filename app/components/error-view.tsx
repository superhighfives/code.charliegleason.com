import { isRouteErrorResponse, useRouteError } from '@remix-run/react'

export default function ErrorView() {
  const error = useRouteError()
  return (
    <h1>
      {isRouteErrorResponse(error)
        ? `${error.status}: ${error.statusText}`
        : error instanceof Error
          ? error.message
          : 'Unknown Error'}
    </h1>
  )
}
