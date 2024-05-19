import { Link } from '@remix-run/react'

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-rows-layout min-h-dvh p-8 leading-7">
      <div>{children}</div>
      <div className="flex gap-4">
        <div className="flex gap-1">
          <span>{'❯'}</span>
          <span className="animate-blink step">█</span>
        </div>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </div>
    </div>
  )
}
