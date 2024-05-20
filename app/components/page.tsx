import { NavLink as Link } from '@remix-run/react'

const navLinkClass = ({ isActive }: { isActive: boolean }) => {
  let className = ''
  if (isActive) className += ' text-indigo-600'
  return className
}

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-rows-layout gap-8 min-h-dvh p-8 pb-16">
      <div>{children}</div>
      <div className="flex gap-6 border-t px-8 py-4 fixed inset-x-0 bottom-0 bg-stone-50 drop-shadow-2xl">
        <div className="flex gap-1 leading-tight text-indigo-600 select-none">
          <span>{'❯'}</span>
          <span className="animate-blink step">█</span>
        </div>
        <Link to="/" className={navLinkClass}>
          Home
        </Link>
        <Link to="/about" className={navLinkClass}>
          About
        </Link>
      </div>
    </div>
  )
}
