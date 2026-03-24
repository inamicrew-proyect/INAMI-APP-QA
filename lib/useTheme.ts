'use client'

import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    queueMicrotask(() => {
      setMounted(true)

      try {
        const savedTheme = (localStorage.getItem('theme') as Theme) || 'light'
        setTheme(savedTheme)

        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      } catch (error) {
        console.error('Error loading theme:', error)
        setTheme('light')
        document.documentElement.classList.remove('dark')
      }
    })
  }, [])

  const toggleTheme = () => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return
    
    try {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
      
      // Guardar en localStorage
    localStorage.setItem('theme', newTheme)
      
      // Aplicar o remover clase dark
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch (error) {
      console.error('Error toggling theme:', error)
    }
  }

  return {
    theme,
    toggleTheme,
    mounted
  }
}
