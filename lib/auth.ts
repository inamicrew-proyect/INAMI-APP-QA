// lib/auth.ts
'use client' // Importante: Este hook solo funciona en Client Components

import { useState, useEffect } from 'react'
// Usar singleton para evitar múltiples instancias
import { getSupabaseClient } from './supabase-client'
import type { Profile } from './supabase' // Tus tipos están bien
import type { User } from '@supabase/supabase-js'
import { cacheProfile, getCachedProfile, clearProfileCache } from './profile-cache'

// Tipo del cliente de Supabase del singleton
type SupabaseClientType = ReturnType<typeof getSupabaseClient>

/**
 * Función auxiliar para obtener el perfil.
 * Ahora requiere que le pases el cliente de Supabase.
 */
async function getUserProfile(supabase: SupabaseClientType, userId: string) {
  console.log('🔍 [getUserProfile] Iniciando consulta...', { userId })
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    // Type assertion para que TypeScript reconozca el tipo correcto
    const profileData = data as Profile | null
    
    if (error) {
      console.error('❌ [getUserProfile] Error en consulta:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('✅ [getUserProfile] Perfil obtenido:', {
        hasData: !!profileData,
        id: profileData?.id,
        email: profileData?.email,
        role: profileData?.role
      })
    }
    
    return { data: profileData, error }
  } catch (err) {
    console.error('❌ [getUserProfile] Excepción:', err)
    return { data: null, error: err as Error }
  }
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

    // Función para cargar perfil desde API con reintentos automáticos
    const loadProfileFromAPI = async (userId: string, retryCount = 0): Promise<boolean> => {
      const maxRetries = 5
      
      try {
        console.log(`🔄 [useAuth] Intentando cargar perfil desde API (intento ${retryCount + 1}/${maxRetries + 1})...`, { userId, isMounted })
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout
        
        const response = await fetch('/api/auth/profile', { 
          cache: 'no-store',
          credentials: 'include',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        clearTimeout(timeoutId)
        console.log('🔍 [useAuth] API Response status:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ [useAuth] API response not OK:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 200),
            intento: retryCount + 1
          })
          
          // Reintentar si no es el último intento y el error no es 401 (no autenticado)
          if (retryCount < maxRetries && response.status !== 401 && isMounted) {
            const delay = (retryCount + 1) * 500
            console.log(`🔄 [useAuth] Reintentando después de error ${response.status} en ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            return await loadProfileFromAPI(userId, retryCount + 1)
          }
          
          return false
        }
        
        const result = await response.json()
        console.log('🔍 [useAuth] API response JSON:', { 
          hasProfile: !!result.profile, 
          error: result.error,
          profileId: result.profile?.id,
          profileRole: result.profile?.role,
          profileEmail: result.profile?.email,
          intento: retryCount + 1
        })
        
        if (result.profile && isMounted) {
          console.log('✅ [useAuth] PERFIL CARGADO desde API:', {
            id: result.profile.id,
            email: result.profile.email,
            role: result.profile.role,
            full_name: result.profile.full_name,
            intento: retryCount + 1
          })
          // Guardar en caché para acceso rápido
          cacheProfile(result.profile)
          setProfile(result.profile)
          setLoading(false)
          return true
        } else {
          console.warn('⚠️ [useAuth] API OK pero profile es null o componente desmontado:', {
            hasProfile: !!result.profile,
            isMounted,
            error: result.error,
            intento: retryCount + 1
          })
          
          // Reintentar si no es el último intento
          if (retryCount < maxRetries && isMounted) {
            const delay = (retryCount + 1) * 500
            console.log(`🔄 [useAuth] Reintentando porque profile es null en ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            return await loadProfileFromAPI(userId, retryCount + 1)
          }
        }
        
        return false
      } catch (apiError) {
        if (apiError instanceof Error && apiError.name === 'AbortError') {
          console.error('❌ [useAuth] Timeout cargando perfil desde API (intento ' + (retryCount + 1) + ')')
        } else {
          console.error('❌ [useAuth] Error cargando perfil desde API:', {
            error: apiError,
            message: apiError instanceof Error ? apiError.message : 'Unknown error',
            stack: apiError instanceof Error ? apiError.stack : undefined,
            intento: retryCount + 1
          })
        }
        
        // Reintentar si no es el último intento
        if (retryCount < maxRetries && isMounted) {
          const delay = (retryCount + 1) * 500
          console.log(`🔄 [useAuth] Reintentando después de excepción en ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return await loadProfileFromAPI(userId, retryCount + 1)
        }
        
        return false
      }
    }

    // 3. Obtenemos la sesión inicial con el cliente correcto
    const getInitialSession = async () => {
      try {
        console.log('🔍 [useAuth] Iniciando getInitialSession...')
        
        // PRIMERO: Intentar cargar desde caché si hay sesión previa (solo en cliente)
        // Esto permite mostrar el perfil inmediatamente mientras se carga desde el servidor
        let cachedProfile: Profile | null = null
        if (typeof window !== 'undefined') {
          cachedProfile = getCachedProfile()
        }
        
        // Obtener sesión primero para tener el usuario
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('🔍 [useAuth] Sesión obtenida:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          email: session?.user?.email,
          sessionError: sessionError?.message,
          hasCachedProfile: !!cachedProfile
        })
        
        if (sessionError) {
          console.error('❌ [useAuth] Error getting session:', sessionError)
        }
        
        if (!isMounted) {
          console.log('⚠️ [useAuth] Componente desmontado, cancelando...')
          return
        }

        if (session?.user) {
          console.log('✅ [useAuth] Usuario encontrado, cargando perfil...', { userId: session.user.id })
          setUser(session.user)
          
          // Si el perfil en caché es del mismo usuario, usarlo inmediatamente
          if (cachedProfile && cachedProfile.id === session.user.id && isMounted) {
            console.log('✅ [useAuth] Perfil en caché coincide con usuario actual, usando temporalmente:', {
              id: cachedProfile.id,
              role: cachedProfile.role
            })
            setProfile(cachedProfile)
            setLoading(false) // Permitir que la UI se renderice mientras se actualiza
          } else {
            // Si el usuario cambió, limpiar caché y perfil
            if (cachedProfile) {
              console.log('⚠️ [useAuth] Usuario cambió, limpiando caché')
              clearProfileCache()
              setProfile(null)
            }
          }
          
          // USAR SOLO LA API - más confiable
          // Intentar múltiples veces para asegurar que se cargue
          let profileLoaded = false
          const maxRetries = 3
          
          for (let attempt = 1; attempt <= maxRetries && !profileLoaded && isMounted; attempt++) {
            console.log(`🔄 [useAuth] Intento ${attempt}/${maxRetries} de cargar perfil desde API...`)
            
            try {
              const apiResponse = await fetch('/api/auth/profile', { 
                cache: 'no-store',
                credentials: 'include',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              })
              
              console.log(`🔍 [useAuth] API Response status (intento ${attempt}):`, apiResponse.status, apiResponse.statusText)
              
              if (apiResponse.ok) {
                const apiResult = await apiResponse.json()
                console.log(`🔍 [useAuth] API Result (intento ${attempt}):`, { 
                  hasProfile: !!apiResult.profile, 
                  error: apiResult.error,
                  profileRole: apiResult.profile?.role
                })
                
                if (apiResult.profile && isMounted) {
                  console.log('✅ [useAuth] PERFIL CARGADO desde API:', {
                    id: apiResult.profile.id,
                    email: apiResult.profile.email,
                    role: apiResult.profile.role,
                    full_name: apiResult.profile.full_name,
                    intento: attempt
                  })
                  setProfile(apiResult.profile)
                  setLoading(false)
                  profileLoaded = true
                  return
                } else {
                  console.warn(`⚠️ [useAuth] API OK pero profile es null (intento ${attempt}):`, apiResult)
                }
              } else {
                const errorText = await apiResponse.text()
                console.error(`❌ [useAuth] API Error (intento ${attempt}):`, apiResponse.status, errorText.substring(0, 200))
              }
            } catch (apiError) {
              console.error(`❌ [useAuth] Error en intento ${attempt}:`, apiError)
            }
            
            // Esperar antes del siguiente intento (solo si no es el último)
            if (attempt < maxRetries && isMounted) {
              await new Promise(resolve => setTimeout(resolve, 500 * attempt))
            }
          }
          
          // Si después de todos los intentos no se cargó, intentar método directo como último recurso
          if (!profileLoaded) {
            console.log('🔄 [useAuth] API falló después de todos los intentos, intentando método directo...')
          }
          
          // Cargar perfil sin timeout agresivo
          try {
            console.log('🔍 [useAuth] Llamando getUserProfile...', { userId: session.user.id })
            const { data: profileData, error: profileError } = await getUserProfile(supabase, session.user.id)
            
            console.log('🔍 [useAuth] Respuesta getUserProfile:', {
              hasData: !!profileData,
              hasError: !!profileError,
              errorMessage: profileError?.message,
              errorCode: profileError && 'code' in profileError ? profileError.code : undefined,
              profileRole: profileData?.role
            })
            
            if (profileError) {
              console.error('❌ [useAuth] Error getting profile:', profileError)
              // Si falla, intentar desde API inmediatamente
              const loadedFromAPI = await loadProfileFromAPI(session.user.id)
              if (!loadedFromAPI) {
                // Si API también falla, reintentar después de un breve delay
                setTimeout(async () => {
                  if (isMounted) {
                    console.log('🔄 [useAuth] Reintentando cargar perfil...')
                    const retry = await getUserProfile(supabase, session.user.id)
                    if (retry.data && isMounted) {
                      console.log('✅ [useAuth] PERFIL CARGADO (retry):', {
                        id: retry.data.id,
                        email: retry.data.email,
                        role: retry.data.role,
                        full_name: retry.data.full_name
                      })
                      setProfile(retry.data)
                    } else if (retry.error) {
                      console.error('❌ [useAuth] Error en retry, intentando API de nuevo...')
                      await loadProfileFromAPI(session.user.id)
                    }
                  }
                }, 1000)
              }
            } else if (isMounted && profileData) {
              console.log('✅ [useAuth] PERFIL CARGADO:', {
                id: profileData.id,
                email: profileData.email,
                role: profileData.role,
                full_name: profileData.full_name
              })
              setProfile(profileData)
            } else if (isMounted) {
              console.warn('⚠️ [useAuth] PERFIL NO CARGADO - profileData es null, intentando API...')
              await loadProfileFromAPI(session.user.id)
            }
          } catch (profileError) {
            console.error('❌ [useAuth] Error getting profile (catch):', profileError)
            // Intentar desde API si falla
            await loadProfileFromAPI(session.user.id)
          }
        } else {
          // No hay sesión, marcar como cargado
          console.log('⚠️ [useAuth] No hay sesión activa')
          if (isMounted) {
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('❌ [useAuth] Error en getInitialSession:', error)
        if (error instanceof Error) {
          console.error('❌ [useAuth] Error details:', {
            message: error.message,
            stack: error.stack
          })
        }
        // Continuar sin sesión para que la app no se quede bloqueada
      } finally {
        if (isMounted) {
          console.log('🔍 [useAuth] Finalizando getInitialSession, setting loading=false')
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // 5. Escuchamos cambios de autenticación (login, logout)
    // Este listener se dispara cuando hay cambios en la autenticación
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔔 [useAuth] onAuthStateChange:', { event, hasSession: !!session, userId: session?.user?.id })
          
          if (!isMounted) {
            console.log('⚠️ [useAuth] Componente desmontado, ignorando cambio de auth')
            return
          }

          if (session?.user) {
            console.log('✅ [useAuth] Sesión encontrada en onAuthStateChange, cargando perfil...', { 
              event, 
              userId: session.user.id,
              currentProfile: profile?.id 
            })
            setUser(session.user)
            setLoading(true)
            
            try {
              // Si ya tenemos el perfil y es del mismo usuario, verificar que esté actualizado
              if (profile && profile.id === session.user.id) {
                console.log('✅ [useAuth] Perfil ya cargado para este usuario')
                // Pero si el evento es SIGNED_IN, forzar recarga para asegurar datos frescos
                if (event === 'SIGNED_IN') {
                  console.log('🔄 [useAuth] Evento SIGNED_IN detectado, forzando recarga del perfil...')
                } else {
                  setLoading(false)
                  return
                }
              }
              
              // SIEMPRE intentar cargar desde API primero (más confiable después de login)
              console.log('🔄 [useAuth] Cargando perfil desde API en onAuthStateChange...')
              const loadedFromAPI = await loadProfileFromAPI(session.user.id)
              
              if (!loadedFromAPI) {
                console.log('⚠️ [useAuth] API falló, intentando método directo...')
                // Si API falla, intentar método directo
                const { data: profileData, error: profileError } = await getUserProfile(supabase, session.user.id)
                
                if (profileError) {
                  console.error('❌ [useAuth] Error getting profile in auth change:', profileError)
                  // Reintentar desde API después de un breve delay
                  setTimeout(async () => {
                    if (isMounted) {
                      await loadProfileFromAPI(session.user.id)
                    }
                  }, 1000)
                } else if (isMounted && profileData) {
                  console.log('✅ [useAuth] PERFIL CARGADO en onAuthStateChange (método directo):', {
                    id: profileData.id,
                    email: profileData.email,
                    role: profileData.role,
                    full_name: profileData.full_name
                  })
                  // Guardar en caché
                  cacheProfile(profileData)
                  setProfile(profileData)
                } else {
                  console.warn('⚠️ [useAuth] profileData es null o componente desmontado')
                }
              } else {
                console.log('✅ [useAuth] Perfil cargado exitosamente desde API en onAuthStateChange')
              }
            } catch (profileError) {
              console.error('❌ [useAuth] Error getting profile in auth change (catch):', profileError)
              // Reintentar desde API después de un breve delay
              setTimeout(async () => {
                if (isMounted) {
                  await loadProfileFromAPI(session.user.id)
                }
              }, 1000)
            }
            
            if (isMounted) {
              setLoading(false)
            }
          } else {
            // Solo resetear si realmente no hay sesión (verificar dos veces para evitar race conditions)
            console.log('⚠️ [useAuth] No hay sesión en onAuthStateChange, verificando...')
            const { data: { session: doubleCheck } } = await supabase.auth.getSession()
            
            if (!doubleCheck) {
              console.log('⚠️ [useAuth] Confirmado: no hay sesión, reseteando perfil')
              setUser(null)
              setProfile(null)
              // Limpiar caché cuando no hay sesión
              clearProfileCache()
            } else {
              console.log('✅ [useAuth] Sesión encontrada en verificación doble, manteniendo perfil')
              // Si hay sesión pero el evento dice que no, puede ser un race condition
              // Asegurarnos de que el perfil esté cargado
              if (doubleCheck.user && isMounted) {
                // Si ya tenemos el perfil para este usuario, no hacer nada
                if (profile && profile.id === doubleCheck.user.id) {
                  console.log('✅ [useAuth] Perfil ya existe para este usuario, manteniendo')
                  setUser(doubleCheck.user)
                } else {
                  // Cargar el perfil de nuevo para asegurarnos
                  console.log('🔄 [useAuth] Cargando perfil después de verificación doble...')
                  const loaded = await loadProfileFromAPI(doubleCheck.user.id)
                  if (!loaded) {
                    const { data: profileData } = await getUserProfile(supabase, doubleCheck.user.id)
                    if (profileData && isMounted) {
                      setProfile(profileData)
                    }
                  }
                  setUser(doubleCheck.user)
                }
              }
            }
          }
          
          if (isMounted) {
            setLoading(false)
          }
        }
      )
      subscription = authSubscription
      console.log('✅ [useAuth] Listener de auth configurado correctamente')
    } catch (error) {
      console.error('❌ [useAuth] Error setting up auth listener:', error)
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