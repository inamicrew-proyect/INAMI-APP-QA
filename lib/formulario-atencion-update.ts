import type { SupabaseClient } from '@supabase/supabase-js'

export async function actualizarAtencionYFormularioJson(
  supabase: SupabaseClient,
  params: {
    atencionId: string
    tipoFormulario: string
    jovenId: string
    tipoAtencionId: string
    datosJson: object
  }
): Promise<void> {
  const { error: e1 } = await supabase
    .from('atenciones')
    .update({
      joven_id: params.jovenId,
      tipo_atencion_id: params.tipoAtencionId,
    })
    .eq('id', params.atencionId)

  if (e1) {
    throw new Error(`Error al actualizar la atención: ${e1.message}`)
  }

  const { error: e2 } = await supabase
    .from('formularios_atencion')
    .update({
      joven_id: params.jovenId,
      datos_json: params.datosJson as Record<string, unknown>,
    })
    .eq('atencion_id', params.atencionId)
    .eq('tipo_formulario', params.tipoFormulario)

  if (e2) {
    throw new Error(`Error al actualizar la ficha: ${e2.message}`)
  }
}
