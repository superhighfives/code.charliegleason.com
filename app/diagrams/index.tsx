import type { ReactNode } from 'react'
import { useState, useEffect, createContext } from 'react'
type Theme = 'light' | 'dark'

export const ThemeContext = createContext('light')

export default function Diagram({
  children,
  alt,
}: {
  children: ReactNode
  alt: string
}) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      setTheme('dark')
    }
  }, [])

  return (
    <div className="my-8">
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
      <figcaption className="text-center leading-relaxed text-balance flex-shrink px-8 mb-2">
        {theme}: {alt}
      </figcaption>
    </div>
  )
}
