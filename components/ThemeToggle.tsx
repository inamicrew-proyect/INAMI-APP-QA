'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <div className="w-[120px] h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
          <span className="text-sm text-yellow-500 dark:text-yellow-400">Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Oscuro</span>
        </>
      )}
    </button>
  )
}

