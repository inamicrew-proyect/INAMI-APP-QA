// app/dashboard/seguridad/page.tsx — Acceso a administración del sistema (2FA vive en Configuración)
'use client'

import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, Users, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Routes } from '@/lib/routes'

export default function SeguridadPage() {
  const { profile } = useAuth()
  const { canView, loading: permissionsLoading } = usePermissions()

  const isAdminByProfile = profile?.role === 'admin'
  const hasAdminModule = !permissionsLoading && canView(Routes.ADMIN)
  const showAdminPanel = isAdminByProfile || hasAdminModule
  const checkingAccess = permissionsLoading && !isAdminByProfile

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
        Administración del sistema: usuarios, roles, permisos y bitácora.
      </p>

      {checkingAccess && (
        <div className="card mb-6 animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        </div>
      )}

      {showAdminPanel && !checkingAccess && (
        <div className="card border-2 border-sky-200 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/40">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Administración del sistema
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Gestiona usuarios, roles, permisos de módulos y registros de seguridad.
          </p>
          <Link href={Routes.ADMIN} className="btn-primary inline-flex items-center gap-2 mb-4">
            Ir al panel de administración
            <ChevronRight className="w-4 h-4" />
          </Link>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={Routes.ADMIN_USUARIOS}
              className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-300 hover:underline font-medium"
            >
              <Users className="w-4 h-4" />
              Usuarios
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link
              href={Routes.ADMIN_ROLES}
              className="text-sky-700 dark:text-sky-300 hover:underline font-medium"
            >
              Roles
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link
              href={Routes.ADMIN_SEGURIDAD}
              className="text-sky-700 dark:text-sky-300 hover:underline font-medium"
            >
              Bitácora / seguridad
            </Link>
          </div>
        </div>
      )}

      {!checkingAccess && !showAdminPanel && (
        <div className="card border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20">
          <p className="text-gray-800 dark:text-gray-200 text-sm mb-3">
            No tienes permisos de administración. Para 2FA, contraseña y datos de tu cuenta, usa{' '}
            <strong>Configuración</strong>.
          </p>
          <Link href={Routes.CONFIGURACION} className="btn-secondary inline-flex items-center gap-2">
            Ir a Configuración
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
