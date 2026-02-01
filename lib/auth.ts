// lib/auth.ts
'use client' // Importante: Este hook solo funciona en Client Components

import { useState, useEffect } from 'react'
// Usar singleton para evitar múltiples instancias
import { getSupabaseClient } from './supabase-client'
import type { Profile } from './supabase' // Tus tipos están bien
import type { User } from '@supabase/supabase-js'

// Tipo del cliente de Supabase del singleton
type SupabaseClientType = ReturnType<typeof getSupabaseClient>

/**
 * Función auxiliar para obtener el perfil.
 * Ahora requiere que le pases el cliente de Supabase.
 */
async function getUserProfile(supabase: SupabaseClientType, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}


/**
 * -----------------------------------------------------------------
 * HOOK REFACTORIZADO: useAuth
 * -----------------------------------------------------------------
 */
export function useAuth() {
  // 2. Creamos el cliente de Supabase DENTRO del hook
  // IMPORTANTE: Los hooks siempre deben ejecutarse en el mismo orden
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    let isMounted = true
    let subscription: { unsubscribe: () => void } | null = null

    // Usar singleton para evitar múltiples instancias de GoTrueClient
    const supabase = getSupabaseClient()

    // 3. Obtenemos la sesión inicial con el cliente correcto
    const getInitialSession = async () => {
      try {
        // Timeout más corto (5 segundos) para que la app cargue más rápido
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout al obtener sesión')), 5000)
        })

        const sessionPromise = supabase.auth.getSession()
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])
        
        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)
          // 4. Pasamos el cliente a la función auxiliar con timeout más corto
          try {
            const profilePromise = getUserProfile(supabase, session.user.id)
            const profileTimeout = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Timeout al obtener perfil')), 4000)
            })
            const { data: profileData } = await Promise.race([profilePromise, profileTimeout])
            
            if (isMounted && profileData) {
              setProfile(profileData)
            }
          } catch (profileError) {
            console.error('Error getting profile:', profileError)
            // Continuar sin perfil para que la app no se quede bloqueada
            // Si hay timeout, intentar obtener el perfil de forma diferida
            if (isMounted) {
              // Cargar perfil en segundo plano sin bloquear
              getUserProfile(supabase, session.user.id)
                .then(({ data: profileData }) => {
                  if (isMounted && profileData) {
                    setProfile(profileData)
                  }
                })
                .catch(() => {
                  // Ignorar errores silenciosamente en carga diferida
                })
            }
          }
        }
      } catch (error) {
        // Solo loguear errores críticos, no timeouts esperados
        if (error instanceof Error && !error.message.includes('Timeout')) {
          console.error('Error getting initial session:', error)
          // Si hay un error de autenticación, limpiar sesión corrupta automáticamente
          if (error.message.includes('JWT') || error.message.includes('session') || error.message.includes('token')) {
            console.warn('Detectada sesión corrupta, limpiando automáticamente...')
            try {
              // Limpiar storage relacionado con auth
              if (typeof window !== 'undefined') {
                const authKeys = Object.keys(localStorage).filter(key => 
                  key.includes('supabase') || key.includes('auth') || key.includes('session')
                )
                authKeys.forEach(key => localStorage.removeItem(key))
                
                const sessionKeys = Object.keys(sessionStorage).filter(key => 
                  key.includes('supabase') || key.includes('auth') || key.includes('session')
                )
                sessionKeys.forEach(key => sessionStorage.removeItem(key))
                
                // Intentar cerrar sesión en Supabase
                supabase.auth.signOut({ scope: 'global' }).catch(() => {})
              }
            } catch (cleanupError) {
              console.error('Error durante limpieza automática:', cleanupError)
            }
          }
        }
        // Continuar sin sesión para que la app no se quede bloqueada
        // La sesión se cargará cuando el usuario interactúe o cuando onAuthStateChange se active
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // 5. Escuchamos cambios de autenticación (login, logout)
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!isMounted) return

          if (session?.user) {
            setUser(session.user)
            try {
              const { data: profileData } = await getUserProfile(supabase, session.user.id)
              if (isMounted && profileData) {
                setProfile(profileData)
              }
            } catch (profileError) {
              console.error('Error getting profile in auth change:', profileError)
            }
          } else {
            setUser(null)
            setProfile(null)
          }
          if (isMounted) {
            setLoading(false)
          }
        }
      )
      subscription = authSubscription
    } catch (error) {
      console.error('Error setting up auth listener:', error)
    }

    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez en el cliente

  return { user, profile, loading }
}

/**
 * Hook para verificar si el usuario actual es administrador
 */
export function useIsAdmin() {
  const { profile, loading } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return { isAdmin, loading }
}

/**
 * Hook para verificar si el usuario puede crear jóvenes y formularios
 * Permite: admin, pedagogo, abogado, medico, psicologo, trabajador_social, seguridad
 */
export function useCanCreate() {
  const { profile, loading } = useAuth()
  const allowedRoles = ['admin', 'pedagogo', 'abogado', 'medico', 'psicologo', 'trabajador_social', 'seguridad']
  const canCreate = profile?.role ? allowedRoles.includes(profile.role) : false

  return { canCreate, loading }
}

/**
 * -----------------------------------------------------------------
 * Las funciones signIn, signUp, etc., ya no deben estar aquí.
 * Como hicimos en `app/login/page.tsx`, debes llamar a 
 * supabase.auth.signInWithPassword() directamente
 * desde tus Client Components.
 * -----------------------------------------------------------------
 */