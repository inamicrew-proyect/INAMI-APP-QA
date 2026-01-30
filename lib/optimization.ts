// Optimización del sistema INAMI
import { lazy } from 'react'

// Lazy loading de componentes pesados
export const LazyFormularioMedico = lazy(() => import('@/app/dashboard/atenciones/formularios/medicos/historia-clinica/page'))
export const LazyFormularioPsicologico = lazy(() => import('@/app/dashboard/atenciones/formularios/psicologia/pmspl/entrevista-inicial-adolescente/page'))
export const LazyFormularioPedagogico = lazy(() => import('@/app/dashboard/atenciones/formularios/pedagogia/informe-inicial/page'))
export const LazyFormularioLegal = lazy(() => import('@/app/dashboard/atenciones/formularios/legal/datos-judiciales/page'))
export const LazyFormularioSeguridad = lazy(() => import('@/app/dashboard/atenciones/formularios/seguridad/ficha-ingreso/page'))
export const LazyFormularioTrabajoSocial = lazy(() => import('@/app/dashboard/atenciones/formularios/trabajo-social/ficha-social/page'))

// Memoización de datos pesados
export const memoizeData = (fn: Function) => {
  const cache = new Map()
  return (...args: any[]) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args)
    cache.set(key, result)
    return result
  }
}

// Debounce para búsquedas
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle para eventos frecuentes
export const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean
  return function executedFunction(...args: any[]) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Cache de datos de Supabase
export class SupabaseCache {
  private cache = new Map()
  private ttl = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5 minutos

  set(key: string, value: any, ttl?: number) {
    this.cache.set(key, value)
    this.ttl.set(key, Date.now() + (ttl || this.defaultTTL))
  }

  get(key: string) {
    const expiry = this.ttl.get(key)
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key)
      this.ttl.delete(key)
      return null
    }
    return this.cache.get(key)
  }

  clear() {
    this.cache.clear()
    this.ttl.clear()
  }
}

export const supabaseCache = new SupabaseCache()
