'use client'

import { useEffect } from 'react'

export default function AlertInterceptor() {
  useEffect(() => {
    const originalAlert = window.alert
    window.alert = (message?: any) => {
      const detail = {
        type: 'info',
        title: 'Información',
        message: String(message ?? ''),
        duration: 4000,
      }
      window.dispatchEvent(new CustomEvent('app:toast', { detail }))
      // No bloquear con el alert nativo
    }
    return () => {
      window.alert = originalAlert
    }
  }, [])

  return null
}

