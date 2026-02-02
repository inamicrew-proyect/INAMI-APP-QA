'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  // No renderizar hasta que el componente esté montado en el cliente
  if (typeof window === 'undefined' || !mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" suppressHydrationWarning></div>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
      title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Oscuro</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
          <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Claro</span>
        </>
      )}
    </button>
  )
}

