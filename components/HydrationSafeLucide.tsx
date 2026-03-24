'use client'

import { useEffect, useState } from 'react'

type LucideIcon = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

/**
 * Evita errores de hidratación cuando el servidor y el cliente resuelven
 * lucide-react distinto (p. ej. orden de nodos SVG en el bundle).
 * Hasta montar, renderiza un placeholder con las mismas clases de tamaño.
 */
export function HydrationSafeLucide({
  icon: Icon,
  className,
  'aria-hidden': ariaHidden = true,
}: {
  icon: LucideIcon
  className?: string
  'aria-hidden'?: boolean
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <span className={`inline-block shrink-0 ${className ?? ''}`} aria-hidden />
  }
  return <Icon className={className} aria-hidden={ariaHidden} />
}
