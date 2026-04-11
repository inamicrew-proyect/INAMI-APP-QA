'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { getHomeHref } from '@/lib/module-nav-access'

type Props = {
  titulo: string
  mensaje: string
}

export function ModuleAccessDenied({ titulo, mensaje }: Props) {
  const { profile } = useAuth()
  const { canView, loading } = usePermissions()
  const isAdmin = profile?.role === 'admin'
  const homeHref = getHomeHref({
    isAdmin,
    permissionsLoading: loading,
    canView,
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="card border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{titulo}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{mensaje}</p>
        <Link href={homeHref} className="btn-primary inline-flex items-center gap-2">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
