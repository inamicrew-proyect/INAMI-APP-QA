import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Función lazy para obtener el cliente admin
// Esto asegura que las variables de entorno estén cargadas cuando se necesite
let _supabaseAdmin: SupabaseClient | null | undefined = undefined

export function getSupabaseAdmin(): SupabaseClient | null {
  // Si ya está inicializado, retornarlo
  if (_supabaseAdmin !== undefined) {
    return _supabaseAdmin
  }

  // Intentar obtener las variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Mejor manejo de errores para desarrollo
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está definida en las variables de entorno')
  }

  if (!supabaseServiceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está definida en las variables de entorno')
    console.error('💡 Necesitas agregar SUPABASE_SERVICE_ROLE_KEY a tu archivo .env.local')
    console.error('💡 Puedes obtenerla en: Supabase Dashboard > Settings > API > service_role key')
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    // En lugar de lanzar error, retornamos null para manejar mejor
    console.warn('⚠️ supabaseAdmin no se puede inicializar sin las variables de entorno necesarias')
    _supabaseAdmin = null
    return null
  }

  // Inicializar el cliente
  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  })

  return _supabaseAdmin
}

// Función helper para verificar si el cliente está disponible
export function isSupabaseAdminAvailable(): boolean {
  return getSupabaseAdmin() !== null
}

// Exportar usando Proxy para mantener compatibilidad total
// Esto permite que se acceda a cualquier propiedad/método del cliente Supabase
// pero se inicializa de forma lazy cuando se necesita
const proxyTarget = {} as SupabaseClient
export const supabaseAdmin = new Proxy(proxyTarget, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    if (client === null) {
      // Si el cliente es null, retornar null para propiedades especiales
      if (prop === 'valueOf' || prop === Symbol.toPrimitive) {
        return () => null
      }
      // Para verificaciones como `if (!supabaseAdmin)`, retornar null
      if (prop === '_isNull') {
        return true
      }
      // Para otros accesos, retornar una función que retorne null
      return () => null
    }
    const value = (client as any)[prop]
    // Si es una función, bindearla al cliente para mantener el contexto
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
  // Hacer que el Proxy sea "nullish" cuando el cliente es null
  has(_target, prop) {
    const client = getSupabaseAdmin()
    if (client === null) {
      return prop === '_isNull'
    }
    return prop in client
  },
}) as SupabaseClient | null

