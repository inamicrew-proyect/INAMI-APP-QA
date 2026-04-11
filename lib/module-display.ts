import { Routes } from '@/lib/routes'

function normalizeRoute(route: string) {
  if (!route) return route
  if (route === '/') return '/'
  return route.replace(/\/+$/, '')
}

/** Nombre visible en tablas de permisos (alineado con menú «Seguridad»). */
export function getModuloNombreParaUi(modulo: { nombre: string; ruta: string }): string {
  if (normalizeRoute(modulo.ruta) === normalizeRoute(Routes.ADMIN)) {
    return 'Seguridad'
  }
  return modulo.nombre
}
