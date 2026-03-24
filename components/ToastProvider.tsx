'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

type Toast = {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<Toast>
      const toast: Toast = {
        id: crypto.randomUUID(),
        type: detail.type || 'info',
        title: detail.title,
        message: detail.message || '',
        duration: detail.duration ?? 4000,
      }
      setToasts((prev) => [...prev, toast])
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => dismiss(toast.id), toast.duration)
      }
    }
    window.addEventListener('app:toast', handler as EventListener)
    return () => window.removeEventListener('app:toast', handler as EventListener)
  }, [dismiss])

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200'
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200'
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
    }
  }

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'error':
        return <XCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  return (
    <div className="fixed z-[9999] top-4 right-4 space-y-3 w-[90vw] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg backdrop-blur ${getStyles(
            t.type
          )}`}
          role="status"
          aria-live="polite"
        >
          <div className="mt-0.5">{getIcon(t.type)}</div>
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-sm font-semibold leading-tight">{t.title}</p>}
            <p className="text-sm">{t.message}</p>
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Cerrar notificación"
            className="shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

