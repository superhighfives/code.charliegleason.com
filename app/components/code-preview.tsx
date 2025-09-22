import type React from 'react'

interface CodePreviewProps {
  children: React.ReactNode
  height?: string | number
  width?: string | number
  className?: string
  title?: string
}

export default function CodePreview({
  children,
  height = '300px',
  width = '100%',
  className = '',
  title,
}: CodePreviewProps) {
  const style = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: typeof width === 'number' ? `${width}px` : width,
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </span>
        </div>
      )}
      <div className="flex items-center justify-center p-4" style={style}>
        {children}
      </div>
    </div>
  )
}
