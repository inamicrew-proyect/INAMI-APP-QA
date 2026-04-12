'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useAdminAccess } from '@/lib/hooks/useAdminAccess'
import { Routes } from '@/lib/routes'
import { CentrosMaintenancePanel } from '@/components/admin/CentrosMaintenancePanel'

export default function AdminCentrosPage() {
  const router = useRouter()
  const { hasAccess, loading } = useAdminAccess()

  useEffect(() => {
    if (!loading && !hasAccess) {
      router.push('/dashboard')
    }
  }, [hasAccess, loading, router])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card text-center">Cargando...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={Routes.ADMIN}
        className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a administración
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg shrink-0">
          <Building2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Centros</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Mantenimiento del catálogo de centros (CPI y PAMSPL) usado en jóvenes, atenciones y el panel principal.
          </p>
        </div>
      </div>

      <div className="card">
        <CentrosMaintenancePanel />
      </div>
    </div>
  )
}
