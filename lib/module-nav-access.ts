import { Routes } from '@/lib/routes'

/** Rutas probadas como “inicio” si el usuario no puede ver el dashboard. */
const HOME_FALLBACK_ORDER: string[] = [
  Routes.DASHBOARD,
  Routes.JOVENES,
  Routes.ATENCIONES,
  Routes.CITAS,
  Routes.NOTIFICACIONES,
  Routes.CONFIGURACION,
]

export type NavPermissionContext = {
  isAdmin: boolean
  permissionsLoading: boolean
  canView: (moduleRoute: string) => boolean
}

/** ¿Mostrar enlace de menú al módulo? (admin ve todo; si no, solo con puede_ver tras cargar permisos). */
export function canShowNavModule(moduleRoute: string, ctx: NavPermissionContext): boolean {
  if (ctx.isAdmin) return true
  if (ctx.permissionsLoading) return false
  return ctx.canView(moduleRoute)
}

/** Destino del logo / “volver al inicio” según primer módulo visible. */
export function getHomeHref(ctx: NavPermissionContext): string {
  if (ctx.isAdmin) return Routes.DASHBOARD
  if (ctx.permissionsLoading) return Routes.DASHBOARD
  for (const r of HOME_FALLBACK_ORDER) {
    if (ctx.canView(r)) return r
  }
  return Routes.CONFIGURACION
}
