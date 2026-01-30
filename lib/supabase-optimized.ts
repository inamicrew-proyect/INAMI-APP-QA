import { supabase } from './supabase'
import { supabaseCache } from './optimization'

// Cliente optimizado de Supabase con cache
export class OptimizedSupabaseClient {
  // Cache para consultas frecuentes
  async getJovenes(centroId?: string, limit = 50) {
    const cacheKey = `jovenes_${centroId || 'all'}_${limit}`
    const cached = supabaseCache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('jovenes')
      .select(`
        id,
        nombres,
        apellidos,
        fecha_nacimiento,
        identidad,
        centros!inner(nombre)
      `)
      .eq(centroId ? 'centro_id' : 'id', centroId || 'id')
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    supabaseCache.set(cacheKey, data, 2 * 60 * 1000) // 2 minutos
    return data
  }

  // Cache para datos de un joven específico
  async getJoven(id: string) {
    const cacheKey = `joven_${id}`
    const cached = supabaseCache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('jovenes')
      .select(`
        *,
        centros!inner(nombre)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    
    supabaseCache.set(cacheKey, data, 5 * 60 * 1000) // 5 minutos
    return data
  }

  // Cache para atenciones
  async getAtenciones(jovenId: string, limit = 20) {
    const cacheKey = `atenciones_${jovenId}_${limit}`
    const cached = supabaseCache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('atenciones')
      .select(`
        *,
        tipos_atencion!inner(nombre, profesional_responsable),
        profesional:profiles!atenciones_profesional_id_fkey(nombre, apellidos)
      `)
      .eq('joven_id', jovenId)
      .order('fecha_atencion', { ascending: false })
      .limit(limit)

    if (error) throw error
    
    supabaseCache.set(cacheKey, data, 3 * 60 * 1000) // 3 minutos
    return data
  }

  // Cache para tipos de atención
  async getTiposAtencion() {
    const cacheKey = 'tipos_atencion'
    const cached = supabaseCache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('tipos_atencion')
      .select('*')
      .order('nombre')

    if (error) throw error
    
    supabaseCache.set(cacheKey, data, 10 * 60 * 1000) // 10 minutos
    return data
  }

  // Cache para centros
  async getCentros() {
    const cacheKey = 'centros'
    const cached = supabaseCache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('centros')
      .select('*')
      .order('nombre')

    if (error) throw error
    
    supabaseCache.set(cacheKey, data, 15 * 60 * 1000) // 15 minutos
    return data
  }

  // Cache para formularios
  async getFormularios(jovenId: string, tipo?: string) {
    const cacheKey = `formularios_${jovenId}_${tipo || 'all'}`
    const cached = supabaseCache.get(cacheKey)
    if (cached) return cached

    let query = supabase
      .from('formularios_trabajo_social')
      .select('*')
      .eq('joven_id', jovenId)
      .order('fecha_creacion', { ascending: false })

    if (tipo) {
      query = query.eq('tipo_formulario', tipo)
    }

    const { data, error } = await query

    if (error) throw error
    
    supabaseCache.set(cacheKey, data, 2 * 60 * 1000) // 2 minutos
    return data
  }

  // Invalidar cache cuando se actualiza un joven
  invalidateJoven(_jovenId: string) {
    supabaseCache.clear()
  }

  // Invalidar cache cuando se crea una atención
  invalidateAtenciones(jovenId: string) {
    const keys = ['jovenes', 'atenciones', 'formularios']
    keys.forEach(key => {
      if (key.includes(jovenId)) {
        supabaseCache.clear()
      }
    })
  }
}

export const optimizedSupabase = new OptimizedSupabaseClient()
