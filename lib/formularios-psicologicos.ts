/**
 * Funciones helper para trabajar con formularios psicológicos
 */

export interface FormularioPsicologico {
  id?: string
  joven_id: string
  tipo_formulario: string
  datos_json: Record<string, any>
  fecha_creacion?: string
  created_at?: string
  updated_at?: string
}

/**
 * Tipos de formularios psicológicos disponibles
 */
export const TIPOS_FORMULARIOS = {
  // PMSPL
  ENTREVISTA_INICIAL_ADOLESCENTE_PMSPL: 'entrevista_inicial_adolescente',
  ENTREVISTA_FINAL_ADOLESCENTE_PMSPL: 'entrevista_final_adolescente',
  ENTREVISTA_PSICOLOGICA_ADOLESCENTES_JOVENES: 'entrevista_psicologica_adolescentes_jovenes',
  SEGUIMIENTO_PSICOLOGICO: 'seguimiento_psicologico',
  INFORME_PSICODIAGNOSTICO_PMSPL: 'informe_psicodiagnostico',
  INFORME_SEGUIMIENTO_PMSPL: 'informe_seguimiento',
  INFORME_FINAL_PMSPL: 'informe_final',
  REMISION_INSTITUCIONES_PMSPL: 'remision_instituciones',
  
  // CPI
  ENTREVISTA_INICIAL_ADOLESCENTE_CPI: 'entrevista_inicial_adolescente_cpi',
  ENTREVISTA_INICIAL_FAMILIA_CPI: 'entrevista_inicial_familia_cpi',
  ENTREVISTA_PREELIMINAR_CPI: 'entrevista_preeliminar_cpi',
  ENTREVISTA_SEGUIMIENTO_FAMILIA_CPI: 'entrevista_seguimiento_familia_cpi',
  SEGUIMIENTO_TERAPEUTICO_INDIVIDUAL_ADOLESCENTES: 'seguimiento_terapeutico_individual_adolescentes',
  SEGUIMIENTO_TERAPEUTICO_GRUPAL_ADOLESCENTES: 'seguimiento_terapeutico_grupal_adolescentes',
  SEGUIMIENTO_TERAPEUTICO_GRUPAL_PADRES: 'seguimiento_terapeutico_grupal_padres',
  SEGUIMIENTO_TERAPEUTICO_FAMILIAR: 'seguimiento_terapeutico_familiar',
  INTERVENCION_CRISIS: 'intervencion_crisis',
  REMISION_CPI: 'remision',
  REMISION_INTERNA_CPI: 'remision_interna',
  INFORME_PRELIMINAR_CPI: 'informe_preliminar',
  INFORME_PSICODIAGNOSTICO_CPI: 'informe_psicodiagnostico_cpi',
  INFORME_SEGUIMIENTO_POST_SANCION: 'informe_seguimiento_post_sancion',
  INFORME_FINAL_CPI: 'informe_final_cpi',
} as const

/**
 * Obtener un formulario psicológico por ID
 */
export async function getFormularioById(id: string): Promise<FormularioPsicologico | null> {
  try {
    const response = await fetch(`/api/formularios-psicologicos?id=${id}`)
    if (!response.ok) {
      throw new Error('Error al obtener el formulario')
    }
    const { data } = await response.json()
    return data
  } catch (error) {
    console.error('Error getting formulario by id:', error)
    return null
  }
}

/**
 * Obtener formularios psicológicos por joven_id y tipo
 */
export async function getFormulariosByJovenAndTipo(
  jovenId: string,
  tipoFormulario: string
): Promise<FormularioPsicologico[]> {
  try {
    const response = await fetch(
      `/api/formularios-psicologicos?joven_id=${jovenId}&tipo_formulario=${tipoFormulario}`
    )
    if (!response.ok) {
      throw new Error('Error al obtener los formularios')
    }
    const { data } = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error getting formularios by joven and tipo:', error)
    return []
  }
}

/**
 * Obtener el último formulario de un tipo específico para un joven
 */
export async function getUltimoFormulario(
  jovenId: string,
  tipoFormulario: string
): Promise<FormularioPsicologico | null> {
  const formularios = await getFormulariosByJovenAndTipo(jovenId, tipoFormulario)
  if (formularios.length === 0) return null
  
  // Ordenar por fecha_creacion descendente y tomar el primero
  const ordenados = formularios.sort((a, b) => {
    const fechaA = new Date(a.fecha_creacion || a.created_at || 0).getTime()
    const fechaB = new Date(b.fecha_creacion || b.created_at || 0).getTime()
    return fechaB - fechaA
  })
  
  return ordenados[0]
}

/**
 * Guardar un nuevo formulario psicológico
 */
export async function saveFormulario(
  jovenId: string,
  tipoFormulario: string,
  datosJson: Record<string, any>
): Promise<FormularioPsicologico | null> {
  try {
    // Validar que todos los campos requeridos estén presentes
    if (!jovenId || jovenId.trim() === '') {
      throw new Error('El joven_id es requerido')
    }
    
    if (!tipoFormulario || tipoFormulario.trim() === '') {
      throw new Error('El tipo_formulario es requerido')
    }
    
    if (!datosJson || typeof datosJson !== 'object' || Object.keys(datosJson).length === 0) {
      throw new Error('Los datos_json son requeridos y no pueden estar vacíos')
    }

    const payload = {
      joven_id: jovenId,
      tipo_formulario: tipoFormulario,
      datos_json: datosJson,
    }

    console.log('Guardando formulario:', { joven_id: jovenId, tipo_formulario: tipoFormulario, datos_json_keys: Object.keys(datosJson) })

    const response = await fetch('/api/formularios-psicologicos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error response:', error)
      throw new Error(error.error || 'Error al guardar el formulario')
    }

    const { data } = await response.json()
    return data
  } catch (error) {
    console.error('Error saving formulario:', error)
    throw error
  }
}

/**
 * Actualizar un formulario psicológico existente
 */
export async function updateFormulario(
  id: string,
  datosJson: Record<string, any>
): Promise<FormularioPsicologico | null> {
  try {
    const response = await fetch('/api/formularios-psicologicos', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        datos_json: datosJson,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al actualizar el formulario')
    }

    const { data } = await response.json()
    return data
  } catch (error) {
    console.error('Error updating formulario:', error)
    throw error
  }
}

/**
 * Crear una atención psicológica
 */
async function crearAtencionPsicologica(
  jovenId: string,
  motivo: string,
  fechaAtencion?: string
): Promise<string | null> {
  try {
    // Obtener el usuario actual
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('No se pudo obtener el usuario actual')
    }

    // Obtener el tipo de atención psicológica
    const { data: tipoAtencion } = await supabase
      .from('tipos_atencion')
      .select('id')
      .eq('profesional_responsable', 'psicologo')
      .limit(1)
      .maybeSingle()

    let tipoAtencionId = tipoAtencion?.id
    
    // Si no se encuentra, buscar por nombre
    if (!tipoAtencionId) {
      const { data: tipoPorNombre } = await supabase
        .from('tipos_atencion')
        .select('id')
        .ilike('nombre', '%Psicológica%')
        .limit(1)
        .maybeSingle()
      
      tipoAtencionId = tipoPorNombre?.id
    }

    // Si aún no se encuentra, usar el primer tipo disponible
    if (!tipoAtencionId) {
      const { data: anyTipo } = await supabase
        .from('tipos_atencion')
        .select('id')
        .limit(1)
        .maybeSingle()
      
      tipoAtencionId = anyTipo?.id
    }

    if (!tipoAtencionId) {
      console.warn('No se encontró tipo de atención, continuando sin crear atención')
      return null
    }

    // Crear la atención
    const fecha = fechaAtencion || new Date().toISOString()
    const { data: nuevaAtencion, error: atencionError } = await supabase
      .from('atenciones')
      .insert({
        joven_id: jovenId,
        tipo_atencion_id: tipoAtencionId,
        profesional_id: user.id,
        fecha_atencion: fecha,
        motivo: motivo,
        estado: 'completada'
      })
      .select()
      .single()

    if (atencionError) {
      console.error('Error al crear atención:', atencionError)
      // No lanzar error, solo registrar y continuar
      return null
    }

    return nuevaAtencion?.id || null
  } catch (error) {
    console.error('Error creating atencion:', error)
    return null
  }
}

/**
 * Guardar o actualizar un formulario (upsert)
 * Si existe un formulario del mismo tipo para el joven, lo actualiza
 * Si no existe, crea uno nuevo
 * También crea una entrada en atenciones para que aparezca en el listado
 */
export async function saveOrUpdateFormulario(
  jovenId: string,
  tipoFormulario: string,
  datosJson: Record<string, any>
): Promise<FormularioPsicologico | null> {
  try {
    // Intentar obtener el último formulario del mismo tipo
    const formularioExistente = await getUltimoFormulario(jovenId, tipoFormulario)
    
    // Obtener el nombre del formulario para el motivo de la atención
    const nombreFormulario = tipoFormulario.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    const motivo = `Formulario Psicológico: ${nombreFormulario}`
    
    // Obtener la fecha de la entrevista o usar la fecha actual
    const fechaAtencion = datosJson.fecha_entrevista 
      ? new Date(datosJson.fecha_entrevista + 'T00:00:00').toISOString()
      : undefined
    
    if (formularioExistente && formularioExistente.id) {
      // Actualizar el formulario existente
      // No crear nueva atención si ya existe el formulario
      return await updateFormulario(formularioExistente.id, datosJson)
    } else {
      // Crear una nueva atención antes de guardar el formulario
      const atencionId = await crearAtencionPsicologica(jovenId, motivo, fechaAtencion)
      
      // Crear un nuevo formulario
      const formulario = await saveFormulario(jovenId, tipoFormulario, datosJson)
      
      // Si se creó la atención y el formulario, vincularlos en formularios_atencion
      if (atencionId && formulario) {
        try {
          const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
          const supabase = createClientComponentClient()
          
          await supabase
            .from('formularios_atencion')
            .insert({
              atencion_id: atencionId,
              tipo_formulario: tipoFormulario,
              joven_id: jovenId,
              datos_json: datosJson,
              created_at: new Date().toISOString()
            })
        } catch (error) {
          console.error('Error vinculando formulario con atención:', error)
          // No lanzar error, el formulario ya se guardó
        }
      }
      
      return formulario
    }
  } catch (error) {
    console.error('Error in saveOrUpdateFormulario:', error)
    throw error
  }
}

/**
 * Eliminar un formulario psicológico
 */
export async function deleteFormulario(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/formularios-psicologicos?id=${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Error al eliminar el formulario')
    }

    return true
  } catch (error) {
    console.error('Error deleting formulario:', error)
    return false
  }
}
