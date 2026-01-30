import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  estado: 'activo' | 'egresado' | 'transferido'
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

