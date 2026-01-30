import { supabase } from './supabase'
import type { Joven } from './supabase'

export interface DatosAutocompletado {
  // Datos básicos
  nombre_completo: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  edad: string
  sexo: string
  identidad: string
  lugar_nacimiento: string
  nacionalidad: string
  estado_civil: string
  direccion: string
  telefono: string
  email: string
  
  // Datos administrativos
  centro: string
  fecha_ingreso: string
  expediente_administrativo: string
  expediente_judicial: string
  delito_infraccion: string
  medida_aplicada: string
  
  // Datos familiares
  nombre_madre: string
  nombre_padre: string
  telefono_emergencia: string
  
  // Datos educativos
  escolaridad: string
  ocupacion: string
  
  // Datos de salud
  observaciones_generales: string
  foto_url: string
}

export class SistemaAutocompletado {
  private joven: Joven | null = null

  constructor(joven: Joven) {
    this.joven = joven
  }

  /**
   * Obtiene todos los datos del joven para autocompletar formularios
   */
  getDatosCompletos(): DatosAutocompletado {
    if (!this.joven) {
      throw new Error('No hay datos del joven disponibles')
    }

    return {
      // Datos básicos
      nombre_completo: `${this.joven.nombres} ${this.joven.apellidos}`,
      nombres: this.joven.nombres,
      apellidos: this.joven.apellidos,
      fecha_nacimiento: this.joven.fecha_nacimiento || '',
      edad: this.calcularEdad(this.joven.fecha_nacimiento),
      sexo: this.joven.sexo || '',
      identidad: this.joven.identidad || '',
      lugar_nacimiento: this.joven.lugar_nacimiento || '',
      nacionalidad: this.joven.nacionalidad || '',
      estado_civil: this.joven.estado_civil || '',
      direccion: this.joven.direccion || '',
      telefono: this.joven.telefono || '',
      email: this.joven.email || '',
      
      // Datos administrativos
      centro: this.joven.centros?.nombre || '',
      fecha_ingreso: this.joven.fecha_ingreso || '',
      expediente_administrativo: this.joven.expediente_administrativo || '',
      expediente_judicial: this.joven.expediente_judicial || '',
      delito_infraccion: this.joven.delito_infraccion || '',
      medida_aplicada: this.joven.medida_aplicada || '',
      
      // Datos familiares
      nombre_madre: this.joven.nombre_madre || '',
      nombre_padre: this.joven.nombre_padre || '',
      telefono_emergencia: this.joven.telefono_emergencia || '',
      
      // Datos educativos
      escolaridad: this.joven.escolaridad || '',
      ocupacion: this.joven.ocupacion || '',
      
      // Datos de salud
      observaciones_generales: this.joven.observaciones_generales || '',
      foto_url: this.joven.foto_url || ''
    }
  }

  /**
   * Obtiene datos específicos para formularios médicos
   */
  getDatosMedicos() {
    const datos = this.getDatosCompletos()
    return {
      nombre_completo: datos.nombre_completo,
      edad: datos.edad,
      sexo: datos.sexo,
      fecha_nacimiento: datos.fecha_nacimiento,
      centro: datos.centro,
      fecha_ingreso: datos.fecha_ingreso,
      observaciones_generales: datos.observaciones_generales
    }
  }

  /**
   * Obtiene datos específicos para formularios psicológicos
   */
  getDatosPsicologicos() {
    const datos = this.getDatosCompletos()
    return {
      nombre_completo: datos.nombre_completo,
      edad: datos.edad,
      sexo: datos.sexo,
      fecha_nacimiento: datos.fecha_nacimiento,
      lugar_fecha_nacimiento: `${datos.lugar_nacimiento} - ${datos.fecha_nacimiento}`,
      estado_civil: datos.estado_civil,
      escolaridad: datos.escolaridad,
      ocupacion: datos.ocupacion,
      direccion: datos.direccion,
      telefono: datos.telefono,
      expediente_judicial: datos.expediente_judicial,
      delito_infraccion: datos.delito_infraccion,
      medida_aplicada: datos.medida_aplicada
    }
  }

  /**
   * Obtiene datos específicos para formularios pedagógicos
   */
  getDatosPedagogicos() {
    const datos = this.getDatosCompletos()
    return {
      nombre_completo: datos.nombre_completo,
      edad: datos.edad,
      sexo: datos.sexo,
      fecha_nacimiento: datos.fecha_nacimiento,
      escolaridad: datos.escolaridad,
      ocupacion: datos.ocupacion,
      centro: datos.centro,
      expediente_administrativo: datos.expediente_administrativo,
      expediente_judicial: datos.expediente_judicial
    }
  }

  /**
   * Obtiene datos específicos para formularios legales
   */
  getDatosLegales() {
    const datos = this.getDatosCompletos()
    return {
      nombre_completo: datos.nombre_completo,
      edad: datos.edad,
      identidad: datos.identidad,
      expediente_judicial: datos.expediente_judicial,
      delito_infraccion: datos.delito_infraccion,
      medida_aplicada: datos.medida_aplicada,
      centro: datos.centro,
      fecha_ingreso: datos.fecha_ingreso
    }
  }

  /**
   * Obtiene datos específicos para formularios de trabajo social
   */
  getDatosTrabajoSocial() {
    const datos = this.getDatosCompletos()
    return {
      nombre_completo: datos.nombre_completo,
      edad: datos.edad,
      sexo: datos.sexo,
      direccion: datos.direccion,
      telefono: datos.telefono,
      nombre_madre: datos.nombre_madre,
      nombre_padre: datos.nombre_padre,
      telefono_emergencia: datos.telefono_emergencia,
      escolaridad: datos.escolaridad,
      ocupacion: datos.ocupacion,
      centro: datos.centro,
      expediente_administrativo: datos.expediente_administrativo,
      expediente_judicial: datos.expediente_judicial
    }
  }

  /**
   * Obtiene datos específicos para formularios de seguridad
   */
  getDatosSeguridad() {
    const datos = this.getDatosCompletos()
    return {
      nombre_completo: datos.nombre_completo,
      edad: datos.edad,
      sexo: datos.sexo,
      identidad: datos.identidad,
      centro: datos.centro,
      fecha_ingreso: datos.fecha_ingreso,
      delito_infraccion: datos.delito_infraccion,
      medida_aplicada: datos.medida_aplicada
    }
  }

  /**
   * Calcula la edad basada en la fecha de nacimiento
   */
  private calcularEdad(fechaNacimiento: string): string {
    if (!fechaNacimiento) return ''
    
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    
    return edad.toString()
  }

  /**
   * Obtiene datos de formularios previos para referencias cruzadas
   */
  async getReferenciasCruzadas(tipoFormulario: string) {
    if (!this.joven) return null

    try {
      const { data, error } = await supabase
        .from('formularios_medicos')
        .select('datos_json, fecha_creacion')
        .eq('joven_id', this.joven.id)
        .eq('tipo_formulario', tipoFormulario)
        .order('fecha_creacion', { ascending: false })
        .limit(1)

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Error obteniendo referencias cruzadas:', error)
      return null
    }
  }

  /**
   * Obtiene historial de formularios del joven
   */
  async getHistorialFormularios() {
    if (!this.joven) return []

    try {
      const { data, error } = await supabase
        .from('formularios_medicos')
        .select('tipo_formulario, fecha_creacion')
        .eq('joven_id', this.joven.id)
        .order('fecha_creacion', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error obteniendo historial:', error)
      return []
    }
  }
}

/**
 * Hook para usar el sistema de autocompletado
 */
export function useAutocompletado(joven: Joven | null) {
  if (!joven) return null
  
  return new SistemaAutocompletado(joven)
}
