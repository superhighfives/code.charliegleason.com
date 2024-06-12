import { Link } from '@remix-run/react'
import { Hand } from 'lucide-react'

export default function About() {
  return (
    <div className="flex gap-4 dark:text-white col-span-full">
      <div className="sm:w-60 sm:border border-indigo-500 text-indigo-500 sm:h-full flex flex-col sm:flex:row sm:items-center sm:justify-center aspect-square rounded">
        <Hand size="48" className="rotate-45" />
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="border-b border-indigo-500 pb-2 font-bold">
          Hello, I'm Charlie.
        </h2>
        <p className="leading-relaxed text-gray-600 dark:text-gray-400">
          I'm a designer, developer, creative coder, and sometimes musician. I
          write about design and development.{' '}
          <Link
            className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            to="/about"
          >
            More about me.
          </Link>
        </p>
      </div>
    </div>
  )
}
