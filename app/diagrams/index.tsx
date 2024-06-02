import type { ReactNode } from 'react'
import { useState, useEffect, createContext } from 'react'
type Theme = 'light' | 'dark'
import { useMediaQuery } from 'usehooks-ts'

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
    <div className="my-8 space-y-4 [&>svg]:max-w-full [&>svg]:max-h-full">
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
      <div className="text-balance">
        <figcaption className="leading-relaxed mb-2 border-b dark:border-gray-600 inline">
          {alt}
        </figcaption>
      </div>
    </div>
  )
}
