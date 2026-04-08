'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  type ReactNode,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Ctx = {
  /** Marca inicio de navegación (p. ej. antes de router.push si hace falta explícito) */
  startNavigation: () => void
  isNavigating: boolean
}

const NavigationLoadingContext = createContext<Ctx | null>(null)

export function useDashboardNavigationLoading() {
  const ctx = useContext(NavigationLoadingContext)
  if (!ctx) {
    throw new Error('useDashboardNavigationLoading debe usarse dentro de DashboardNavigationLoading')
  }
  return ctx
}

/** router.push / replace con indicador de carga (por si el parche de history no aplica) */
export function useNavigateWithLoading() {
  const router = useRouter()
  const { startNavigation } = useDashboardNavigationLoading()

  const push = useCallback(
    (href: string) => {
      startNavigation()
      router.push(href)
    },
    [router, startNavigation]
  )

  const replace = useCallback(
    (href: string) => {
      startNavigation()
      router.replace(href)
    },
    [router, startNavigation]
  )

  return { push, replace, router }
}

function sameLocationPathSearch(url: URL, pathname: string, search: string) {
  return url.pathname === pathname && url.search === search
}

function DashboardNavigationLoadingInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryKey = searchParams.toString()

  const [navigating, setNavigating] = useState(false)
  const pathnameRef = useRef(pathname)
  const readyRef = useRef(false)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  const startNavigation = useCallback(() => setNavigating(true), [])

  // Al terminar la transición de ruta (incl. solo cambio de query), quitar carga
  useEffect(() => {
    setNavigating(false)
    readyRef.current = true
  }, [pathname, queryKey])

  // Evitar barra colgada si la navegación no actualiza la ruta
  useEffect(() => {
    if (!navigating) return
    const t = window.setTimeout(() => setNavigating(false), 15000)
    return () => window.clearTimeout(t)
  }, [navigating])

  // Clic en enlaces internos (misma app)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }
      const a = (e.target as HTMLElement).closest('a')
      if (!a?.getAttribute('href')) return
      if (a.hasAttribute('download')) return
      if (a.target === '_blank') return
      let url: URL
      try {
        url = new URL(a.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      if (sameLocationPathSearch(url, pathnameRef.current, window.location.search)) return
      setNavigating(true)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  // router.push / replace y navegación del historial (Next usa history API)
  useEffect(() => {
    const origPush = history.pushState.bind(history)
    const origReplace = history.replaceState.bind(history)
    const deferNav = () => {
      // Deferir para evitar que React detecte actualización durante efectos de inserción
      queueMicrotask(() => setNavigating(true))
    }

    const destinationChangesRoute = (url: string | URL | null | undefined) => {
      if (url == null || url === '') return false
      try {
        const next = typeof url === 'string' ? new URL(url, window.location.href) : url
        const cur = window.location
        return next.pathname !== cur.pathname || next.search !== cur.search
      } catch {
        return false
      }
    }

    history.pushState = function (state, title, url) {
      if (readyRef.current && destinationChangesRoute(url ?? undefined)) {
        deferNav()
      }
      return origPush(state, title, url)
    }

    history.replaceState = function (state, title, url) {
      if (readyRef.current && destinationChangesRoute(url ?? undefined)) {
        deferNav()
      }
      return origReplace(state, title, url)
    }

    const onPopState = () => deferNav()
    window.addEventListener('popstate', onPopState)

    return () => {
      history.pushState = origPush
      history.replaceState = origReplace
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  const value = useMemo(
    () => ({ startNavigation, isNavigating: navigating }),
    [startNavigation, navigating]
  )

  return (
    <NavigationLoadingContext.Provider value={value}>
      {navigating && (
        <div
          className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-1 overflow-hidden bg-sky-200/60 dark:bg-sky-900/40"
          role="progressbar"
          aria-label="Cargando página"
          aria-busy="true"
        >
          <div className="nav-route-progress-bar h-full w-1/2 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 shadow-sm" />
        </div>
      )}
      {children}
    </NavigationLoadingContext.Provider>
  )
}

/** Proveedor: barra superior + contexto; Suspense por useSearchParams */
export function DashboardNavigationLoading({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <DashboardNavigationLoadingInner>{children}</DashboardNavigationLoadingInner>
    </Suspense>
  )
}
