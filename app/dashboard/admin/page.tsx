'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Users, Settings, Lock, UserCog } from 'lucide-react'
import { useAdminAccess } from '@/lib/hooks/useAdminAccess'

export default function AdminPanelPage() {
  const router = useRouter()
  const { hasAccess, loading } = useAdminAccess()

  useEffect(() => {
    console.log('AdminPanelPage: Verificando acceso', { hasAccess, loading })
    if (!loading && !hasAccess) {
      console.warn('AdminPanelPage: Acceso denegado, redirigiendo al dashboard')
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Shield className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel Administrador</h1>
            <p className="text-gray-600 dark:text-gray-400">Gestión y administración del sistema</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/dashboard/admin/usuarios"
          className="card hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Gestión de Usuarios
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Administrar usuarios, cambiar roles y gestionar permisos de módulos
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/admin/roles"
          className="card hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              <UserCog className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Roles
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gestionar roles y sus permisos sobre los módulos del sistema
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/admin/seguridad"
          className="card hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
              <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Seguridad
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Alertas de seguridad y monitoreo del sistema
              </p>
            </div>
          </div>
        </Link>

        <div className="card opacity-50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Settings className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Configuración del Sistema
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Próximamente: Configuración avanzada del sistema
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

