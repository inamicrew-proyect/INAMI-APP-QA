// /dashboard/seguridad: redirige al panel de administración si hay acceso (enlaces antiguos o favoritos).
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Routes } from '@/lib/routes'
import { usePermissions } from '@/lib/hooks/usePermissions'

export default function SeguridadPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()
  const { canView, loading: permissionsLoading } = usePermissions()

  const isProfileAdmin = profile?.role === 'admin'
  const canAccessAdmin =
    !loading &&
    profile != null &&
    (isProfileAdmin || (!permissionsLoading && canView(Routes.ADMIN)))

  const waitingPermissions = profile != null && !isProfileAdmin && permissionsLoading

  useEffect(() => {
    if (canAccessAdmin) {
      router.replace(Routes.ADMIN)
    }
  }, [canAccessAdmin, router])

  if (loading || waitingPermissions || canAccessAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card text-center text-gray-600 dark:text-gray-400">Cargando…</div>
      </div>
    )
  }

  if (profile == null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={Routes.DASHBOARD}
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>
        <div className="card border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20">
          <p className="text-gray-800 dark:text-gray-200 text-sm mb-3">
            No se pudo cargar tu perfil. Si necesitas ajustes de cuenta, ve a <strong>Configuración</strong>.
          </p>
          <Link href={Routes.CONFIGURACION} className="btn-secondary inline-flex items-center gap-2">
            Ir a Configuración
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href={Routes.DASHBOARD}
        className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Seguridad</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        La administración del sistema está en el panel principal de seguridad.
      </p>

      <div className="card border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20">
        <p className="text-gray-800 dark:text-gray-200 text-sm mb-3">
          No tienes permiso para el panel de administración (usuarios, roles, bitácora). Para 2FA, contraseña y datos de
          tu cuenta, usa <strong>Configuración</strong>.
        </p>
        <Link href={Routes.CONFIGURACION} className="btn-secondary inline-flex items-center gap-2">
          Ir a Configuración
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
