import { ModuleRouteGuard } from '@/components/ModuleRouteGuard'
import { Routes } from '@/lib/routes'

export default function NotificacionesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleRouteGuard moduleRoute={Routes.NOTIFICACIONES} nombreModulo="Notificaciones">
      {children}
    </ModuleRouteGuard>
  )
}
