import { Outlet } from '@remix-run/react'

export default function Post() {
  return (
    <div className="prose">
      <Outlet />
    </div>
  )
}
