import { ModuleRouteGuard } from '@/components/ModuleRouteGuard'
import { Routes } from '@/lib/routes'

export default function JovenesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleRouteGuard moduleRoute={Routes.JOVENES} nombreModulo="Jóvenes">
      {children}
    </ModuleRouteGuard>
  )
}
