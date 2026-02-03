'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, AlertCircle, User } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth'

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
  const supabase = getSupabaseClient()
  const { profile: currentUserProfile } = useAuth()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        // Verificar sesión
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
          // Mensajes de error más específicos
          if (response.status === 401) {
            setError('No estás autenticado. Por favor, inicia sesión nuevamente.')
          } else if (response.status === 403) {
            setError(result.error || 'No tienes permisos para ver este usuario. Solo puedes ver tu propio perfil o ser administrador para ver todos los usuarios.')
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

    fetchUser()
  }, [id, supabase])

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-stone-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Mi Perfil</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
              Información de tu cuenta
            </p>
          </div>
        </div>
      </div>

      <div className="bg-stone-50 dark:bg-gray-800 rounded-xl border border-stone-200 dark:border-gray-700/50 p-6 shadow-sm">

        {loading && (
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando información...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}


        {!loading && !error && user && (
          <div className="space-y-6">
            {/* Foto de perfil - Solo lectura */}
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden border-4 border-stone-200 dark:border-gray-700">
                {user.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photo_url}
                    alt={user.full_name || user.email}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-semibold text-primary-600 dark:text-primary-400">
                    {(user.full_name || user.email)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.full_name || '-'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>

            {/* Información del usuario - Solo lectura */}
            <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre de Usuario</p>
                <p className="text-base text-gray-900 dark:text-gray-100">{user.full_name || '-'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Correo Electrónico</p>
                <p className="text-base text-gray-900 dark:text-gray-100">{user.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Rol</p>
                <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha de Creación</p>
                <p className="text-base text-gray-900 dark:text-gray-100">
                  {new Date(user.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

