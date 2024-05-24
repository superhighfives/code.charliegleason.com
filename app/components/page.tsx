import { NavLink as Link } from '@remix-run/react'

const navLinkClass = ({ isActive }: { isActive: boolean }) => {
  let className = 'border-b-2 border-indigo-600/30'
  if (isActive) className = 'border-b-2 border-indigo-600'
  return className
}

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-rows-layout gap-8 min-h-dvh p-8 pb-[5.5rem]">
      <div className="content-end">{children}</div>
      <div className="flex gap-6 border-t dark:border-gray-800 px-8 pt-4 pb-12 fixed inset-x-0 bottom-0 bg-gray-50 dark:bg-gray-900 drop-shadow-2xl dark:text-gray-100">
        <div className="flex gap-1 leading-tight text-indigo-600 dark:text-indigo-500 select-none">
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
