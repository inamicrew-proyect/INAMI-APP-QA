import { Suspense } from 'react'
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard'
import { Routes } from '@/lib/routes'

export default function AtencionesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleRouteGuard moduleRoute={Routes.ATENCIONES} nombreModulo="Atenciones">
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="card animate-pulse h-32 bg-gray-100 dark:bg-gray-800" />
          </div>
        }
      >
        {children}
      </Suspense>
    </ModuleRouteGuard>
  )
}
