import { ModuleRouteGuard } from '@/components/ModuleRouteGuard'
import { Routes } from '@/lib/routes'

export default function AtencionesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleRouteGuard moduleRoute={Routes.ATENCIONES} nombreModulo="Atenciones">
      {children}
    </ModuleRouteGuard>
  )
}
