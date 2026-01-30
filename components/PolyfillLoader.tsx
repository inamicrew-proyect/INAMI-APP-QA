'use client'

import { useEffect } from 'react'
import '@/lib/polyfills'

/**
 * Componente que carga los polyfills en el cliente
 * Se ejecuta solo una vez cuando el componente se monta
 */
export default function PolyfillLoader() {
  useEffect(() => {
    // Los polyfills se cargan automáticamente al importar el módulo
    // Este componente solo asegura que se ejecuten en el cliente
  }, [])

  return null
}

