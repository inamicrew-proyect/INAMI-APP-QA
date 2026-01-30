'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle, PenSquare, Shield } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAdminAccess } from '@/lib/hooks/useAdminAccess'

type UserProfile = {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  updated_at: string
  photo_url?: string | null
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  pedagogo: 'Pedagogo',
  abogado: 'Abogado',
  medico: 'Médico',
  psicologo: 'Psicólogo',
  trabajador_social: 'Trabajador Social',
  seguridad: 'Seguridad',
}

export default function UsuarioDetallePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string | undefined
  const supabase = createClientComponentClient()
  const { hasAccess, loading: authLoading } = useAdminAccess()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar que el usuario tiene acceso
  useEffect(() => {
    if (!authLoading && !hasAccess) {
      router.push('/dashboard')
    }
  }, [hasAccess, authLoading, router])

  useEffect(() => {
    if (!id) return

    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setError('No autenticado. Vuelve a iniciar sesión.')
          setLoading(false)
          return
        }

        const response = await fetch(`/api/users/${id}`, {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        const result = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            setError('No estás autenticado. Por favor, inicia sesión nuevamente.')
          } else if (response.status === 403) {
            setError('No tienes permisos para ver este usuario. Solo los administradores pueden ver todos los usuarios.')
          } else if (response.status === 404) {
            setError('Usuario no encontrado.')
          } else {
            setError(result.error || result.message || result.details || 'No se pudo cargar la información.')
          }
          setUser(null)
          return
        }

        setUser(result.user)
      } catch (err: any) {
        console.error('Error fetching user:', err)
        setError(`Ocurrió un error al cargar la información: ${err?.message || 'Error desconocido'}`)
      } finally {
        setLoading(false)
      }
    }

    if (hasAccess) {
      fetchUser()
    }
  }, [id, supabase, hasAccess])

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center">Cargando...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  if (!id) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card">
          <p className="text-red-600">ID de usuario no proporcionado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/dashboard/admin/usuarios')}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        {user && (
          <div className="flex gap-2">
            <Link
              href={`/dashboard/admin/usuarios/${user.id}/permisos`}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Permisos
            </Link>
            <Link
              href={`/dashboard/admin/usuarios/${user.id}/editar`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <PenSquare className="w-4 h-4" />
              Editar
            </Link>
          </div>
        )}
      </div>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Detalle del Usuario</h1>

        {loading && (
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando información...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && user && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                {user.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photo_url}
                    alt={user.full_name || user.email}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-semibold text-primary-600">
                    {(user.full_name || user.email)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">{user.full_name || '-'}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">UID</p>
                <p className="font-mono text-gray-900">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rol</p>
                <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Creado</p>
                  <p className="text-gray-900">
                    {new Date(user.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actualizado</p>
                  <p className="text-gray-900">
                    {new Date(user.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

