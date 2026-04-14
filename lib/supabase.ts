import { createBrowserClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from '@/lib/env/public-supabase'

const supabaseUrl = getPublicSupabaseUrl()
const supabaseAnonKey = getPublicSupabaseAnonKey()

let supabaseInstance: SupabaseClient | null = null

function resolveSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance
  if (typeof window !== 'undefined') {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey) as unknown as SupabaseClient
  } else {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

/**
 * Cliente Supabase compartido.
 * En el navegador usa `createBrowserClient` (@supabase/ssr) para leer la sesión en cookies (App Router).
 * Sin eso, `auth.getUser()` en formularios cliente devolvía null aunque el layout mostrara al usuario.
 * En servidor queda el cliente anónimo clásico (no usar para sesión de usuario en RSC).
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = resolveSupabase()
    const value = Reflect.get(client as object, prop, receiver)
    if (typeof value === 'function') {
      return (value as (...a: unknown[]) => unknown).bind(client)
    }
    return value
  },
})

// Tipos de la base de datos
export type Profile = {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'pedagogo' | 'abogado' | 'medico' | 'psicologo' | 'trabajador_social' | 'seguridad'
  photo_url?: string | null
  created_at: string
  updated_at: string
}

export type Centro = {
  id: string
  nombre: string
  tipo: 'CPI' | 'PAMSPL'
  ubicacion: string
  direccion?: string
  created_at: string
}

export type Joven = {
  id: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  edad: number
  identidad?: string
  sexo?: 'Masculino' | 'Femenino'
  direccion?: string
  telefono?: string
  email?: string
  lugar_nacimiento?: string
  nacionalidad?: string
  estado_civil?: string
  nombre_contacto_emergencia?: string
  telefono_emergencia?: string
  centro_id?: string
  centros?: Centro | null
  fecha_ingreso: string
  medida_aplicada?: string
  delito_infraccion?: string
  expediente_administrativo?: string
  expediente_judicial?: string
  estado: string
  observaciones?: string
  observaciones_generales?: string
  nombre_madre?: string
  nombre_padre?: string
  escolaridad?: string
  ocupacion?: string
  foto_url?: string
  created_at: string
  updated_at: string
}

export type TipoAtencion = {
  id: string
  nombre: string
  descripcion?: string
  profesional_responsable: string
}

export type Atencion = {
  id: string
  joven_id: string
  tipo_atencion_id: string
  profesional_id: string
  fecha_atencion: string
  motivo: string
  observaciones?: string
  recomendaciones?: string
  proxima_cita?: string
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada'
  created_at: string
  updated_at: string
}

export type FormularioAtencion = {
  id: string
  atencion_id: string
  joven_id?: string | null
  tipo_formulario?: string | null
  datos_json: any
  created_at: string
  updated_at: string
}

export type Informe = {
  id: string
  atencion_id: string
  titulo: string
  contenido: string
  archivo_url?: string
  created_by: string
  created_at: string
}

