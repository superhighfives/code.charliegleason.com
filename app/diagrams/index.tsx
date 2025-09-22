import type { ReactNode } from 'react'
import { useState, useEffect, createContext } from 'react'
type Theme = 'light' | 'dark'
import { useMediaQuery } from 'usehooks-ts'
import { ChevronUp } from 'lucide-react'

export const ThemeContext = createContext('light')

export const colors = {
  dark: {
    high: '#fff',
    mid: '#818CF8',
    low: '#6366F1',
    solid: '#fff',
  },
  light: {
    high: '#040711',
    mid: '#4338CA',
    low: '#6366F1',
    solid: '#fff',
  },
}

export default function Diagram({
  children,
  alt,
}: {
  children: ReactNode
  alt: string
}) {
  const [theme, setTheme] = useState<Theme>('light')
  const matches = useMediaQuery('(prefers-color-scheme: dark)')
  useEffect(() => setTheme(matches ? 'dark' : 'light'), [matches])

  return (
    <figure className="my-10 space-y-6 [&>svg]:max-w-full [&>svg]:h-auto">
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
      <figcaption className="text-balance flex gap-4">
        <ChevronUp className="px-1.5 py-1.5 shrink-0 h-full box-content border rounded dark:border-gray-600" />
        <div>
          <span className="leading-relaxed border-b dark:border-gray-700 inline -ml-4 pl-4">
            {alt}
          </span>
        </div>
      </figcaption>
    </figure>
  )
}
