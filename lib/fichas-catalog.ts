/**
 * Catálogo de códigos únicos por ficha (ruta del formulario y tipo_formulario en BD).
 * Los códigos ayudan a identificar la ficha al listar y al ver una atención guardada.
 */
import { labelFromKey } from '@/lib/formulario-utils'

export const RUTA_FORMULARIOS_PREFIX = '/dashboard/atenciones/formularios/'

/** Sufijo de ruta (sin prefijo común) → metadatos de presentación */
export const FICHA_POR_RUTA_SUFFIX: Record<string, { codigo: string; nombre: string }> = {
  // Psicología PAMSPL
  'psicologia/pmspl/entrevista-inicial-adolescente': {
    codigo: 'PS-01',
    nombre: 'Entrevista Inicial — Adolescente/Joven (PAMSPL)',
  },
  'psicologia/pmspl/entrevista-psicologica-adolescentes-jovenes': {
    codigo: 'PS-02',
    nombre: 'Entrevista Psicológica — Adolescentes y Jóvenes',
  },
  'psicologia/pmspl/entrevista-final-adolescente': {
    codigo: 'PS-03',
    nombre: 'Entrevista Psicológica Final — Adolescente/Joven',
  },
  'psicologia/pmspl/remision-instituciones': {
    codigo: 'PS-04',
    nombre: 'Ficha de Remisión a Instituciones o Servicios Externos',
  },
  'psicologia/pmspl/seguimiento-psicologico': { codigo: 'PS-05', nombre: 'Fichas de Seguimiento Psicológico' },
  'psicologia/pmspl/informe-psicodiagnostico': { codigo: 'PS-06', nombre: 'Informe Psicodiagnóstico (PAMSPL)' },
  'psicologia/pmspl/informe-seguimiento': { codigo: 'PS-07', nombre: 'Informe Psicológico de Seguimiento (PAMSPL)' },
  'psicologia/pmspl/informe-final': { codigo: 'PS-08', nombre: 'Informe Psicológico Final (PAMSPL)' },
  // Psicología CPI
  'psicologia/cpi/entrevista-seguimiento-familia': {
    codigo: 'PS-09',
    nombre: 'Entrevista de seguimiento — Familia de referencia (CPI)',
  },
  'psicologia/cpi/entrevista-inicial-adolescente': {
    codigo: 'PS-10',
    nombre: 'Entrevista psicológica inicial — Adolescente/Joven (CPI)',
  },
  'psicologia/cpi/entrevista-inicial-familia': {
    codigo: 'PS-11',
    nombre: 'Entrevista psicológica inicial — Familia (CPI)',
  },
  'psicologia/cpi/intervencion-crisis': { codigo: 'PS-12', nombre: 'Ficha de intervención en crisis (CPI)' },
  'psicologia/cpi/remision': { codigo: 'PS-13', nombre: 'Ficha de Remisión (CPI)' },
  'psicologia/cpi/seguimiento-terapeutico-familiar': {
    codigo: 'PS-14',
    nombre: 'Ficha de seguimiento terapéutico familiar (CPI)',
  },
  'psicologia/cpi/seguimiento-terapeutico-grupal-adolescentes': {
    codigo: 'PS-15',
    nombre: 'Ficha de seguimiento terapéutico grupal — adolescentes/jóvenes (CPI)',
  },
  'psicologia/cpi/seguimiento-terapeutico-grupal-padres': {
    codigo: 'PS-16',
    nombre: 'Ficha de seguimiento terapéutico grupal — padres/madres/encargados (CPI)',
  },
  'psicologia/cpi/seguimiento-terapeutico-individual-adolescentes': {
    codigo: 'PS-17',
    nombre: 'Ficha de seguimiento terapéutico individual — adolescentes/jóvenes (CPI)',
  },
  'psicologia/cpi/remision-interna': { codigo: 'PS-18', nombre: 'Ficha de remisión interna (CPI)' },
  'psicologia/cpi/informe-psicodiagnostico': { codigo: 'PS-19', nombre: 'Informe Psicodiagnóstico (CPI)' },
  'psicologia/cpi/informe-final': { codigo: 'PS-20', nombre: 'Informe Psicológico Final (CPI)' },
  'psicologia/cpi/informe-seguimiento-post-sancion': {
    codigo: 'PS-21',
    nombre: 'Informe de seguimiento post sanción (CPI)',
  },
  'psicologia/cpi/informe-preliminar': { codigo: 'PS-22', nombre: 'Informe Psicológico Preliminar (CPI)' },
  'psicologia/cpi/entrevista-preeliminar': { codigo: 'PS-23', nombre: 'Entrevista preeliminar (CPI)' },
  // Trabajo social PAMSPL
  'trabajo-social/ficha-social': { codigo: 'TS-01', nombre: 'Ficha Social' },
  'trabajo-social/entrevista-familiar': { codigo: 'TS-02', nombre: 'Entrevista Familiar (PAMSPL)' },
  'trabajo-social/estudio-socioeconomico': { codigo: 'TS-03', nombre: 'Estudio Socioeconómico' },
  'trabajo-social/ficha-intervencion': { codigo: 'TS-04', nombre: 'Ficha de Intervención (PAMSPL)' },
  'trabajo-social/entrevista-evaluacion-seguimiento': {
    codigo: 'TS-05',
    nombre: 'Entrevista Social de Evaluación y Seguimiento (PAMSPL)',
  },
  'trabajo-social/ficha-incidencias': { codigo: 'TS-06', nombre: 'Ficha de Incidencias' },
  'trabajo-social/informe-servicio-comunitario': { codigo: 'TS-07', nombre: 'Informe Social — Servicio Comunitario' },
  'trabajo-social/plan-atencion-individual': { codigo: 'TS-08', nombre: 'Plan de Atención Individual (PLATIN)' },
  'trabajo-social/informe-social-inicial': { codigo: 'TS-09', nombre: 'Informe Social Inicial' },
  'trabajo-social/informe-social-egreso-cierre': { codigo: 'TS-10', nombre: 'Informe Social de Egreso/Cierre' },
  'trabajo-social/informe-social-evaluacion-seguimiento': {
    codigo: 'TS-11',
    nombre: 'Informe Social de Evaluación y Seguimiento',
  },
  'trabajo-social/informe-socioeconomico': { codigo: 'TS-12', nombre: 'Informe Socio-Económico' },
  'trabajo-social/ficha-social-area-trabajo-social': { codigo: 'TS-13', nombre: 'Ficha Social — Área de Trabajo Social' },
  'trabajo-social/ficha-entrevista-final-cierre': { codigo: 'TS-14', nombre: 'Ficha Entrevista Final Cierre' },
  'trabajo-social/visita-domiciliaria': { codigo: 'TS-15', nombre: 'Visita Domiciliaria (PAMSPL)' },
  'trabajo-social/informe-incidencias': { codigo: 'TS-16', nombre: 'Informe de Incidencias' },
  // Trabajo social CPI
  'trabajo-social/ficha-social-fase-ingreso': { codigo: 'TS-17', nombre: 'Ficha Social — Fase de Ingreso (CPI)' },
  'trabajo-social/ficha-social-fase-diagnostico': { codigo: 'TS-18', nombre: 'Ficha Social — Fase de Diagnóstico (CPI)' },
  'trabajo-social/informe-social-fase-diagnostico': {
    codigo: 'TS-19',
    nombre: 'Informe Social — Fase Diagnóstico (CPI)',
  },
  'trabajo-social/ficha-visita-domiciliaria-cpi': { codigo: 'TS-20', nombre: 'Ficha de Visita Domiciliaria (CPI)' },
  'trabajo-social/entrevista-evaluacion-seguimiento-cpi': {
    codigo: 'TS-21',
    nombre: 'Entrevista de Evaluación y Seguimiento (CPI)',
  },
  'trabajo-social/informe-evaluacion-seguimiento-cpi': {
    codigo: 'TS-22',
    nombre: 'Informe de Evaluación y Seguimiento (CPI)',
  },
  'trabajo-social/ficha-entrevista-egreso-cpi': { codigo: 'TS-23', nombre: 'Ficha Entrevista de Egreso (CPI)' },
  'trabajo-social/informe-social-egreso-cpi': { codigo: 'TS-24', nombre: 'Informe Social de Egreso (CPI)' },
  'trabajo-social/ficha-intervencion-cpi': { codigo: 'TS-25', nombre: 'Ficha de Intervención Trabajo Social (CPI)' },
  'trabajo-social/entrevista-familiar-cpi': { codigo: 'TS-26', nombre: 'Ficha Entrevista Familiar (CPI)' },
  'trabajo-social/ficha-remision-interna-cpi': { codigo: 'TS-27', nombre: 'Ficha de Remisión Interna (CPI)' },
  'trabajo-social/plan-atencion-cautelar-cpi': { codigo: 'TS-28', nombre: 'Plan de Atención Cautelar (CPI)' },
  'trabajo-social/platin-cpi': { codigo: 'TS-29', nombre: 'PLATIN (CPI)' },
  // Educación
  'educacion/informe-inicial': { codigo: 'ED-01', nombre: 'Informe Inicial Educativo' },
  'educacion/plan-actividades': { codigo: 'ED-02', nombre: 'Plan de Actividades' },
  'educacion/informe-seguimiento': { codigo: 'ED-03', nombre: 'Informe de Seguimiento Educativo' },
  'educacion/informe-final': { codigo: 'ED-04', nombre: 'Informe Final Educativo' },
  'educacion/informe-especial': { codigo: 'ED-05', nombre: 'Informe Especial Educativo' },
  'educacion/cierre': { codigo: 'ED-06', nombre: 'Cierre Educativo' },
  // Salud / médicos
  'medicos/examen-fisico': { codigo: 'MD-01', nombre: 'Examen Físico' },
  'medicos/historia-clinica': { codigo: 'MD-02', nombre: 'Historia Clínica' },
  'medicos/hoja-egreso': { codigo: 'MD-03', nombre: 'Hoja de Egreso' },
  'medicos/informe-seguimiento': { codigo: 'MD-04', nombre: 'Informe de Seguimiento Médico' },
  'salud/informe-seguimiento': { codigo: 'MD-05', nombre: 'Informe de Seguimiento (Salud)' },
  // Seguridad
  'seguridad/ficha-ingreso': { codigo: 'SG-01', nombre: 'Ficha de Ingreso — Seguridad' },
  'seguridad/datos-aprehension': { codigo: 'SG-02', nombre: 'Datos de Aprehensión' },
  'seguridad/estado-fisico': { codigo: 'SG-03', nombre: 'Estado Físico' },
  // Legal CPI
  'legal/cpi/asesoria-intervencion': { codigo: 'LG-C01', nombre: 'Asesoría/Intervención Legal (CPI)' },
  'legal/cpi/ficha-nnaj-sancionado': { codigo: 'LG-C02', nombre: 'Ficha de NNAJ Sancionado (CPI)' },
  'legal/cpi/datos-judiciales': { codigo: 'LG-C03', nombre: 'Datos Judiciales (CPI)' },
  'legal/cpi/informe-legal-ingreso': { codigo: 'LG-C04', nombre: 'Informe Legal de Ingreso (CPI)' },
  'legal/cpi/ficha-entrevista-legal-ingreso': { codigo: 'LG-C05', nombre: 'Ficha de Entrevista Legal de Ingreso (CPI)' },
  'legal/cpi/informe-legal-nnaj-sancionado': { codigo: 'LG-C06', nombre: 'Informe Legal de NNAJ Sancionado (CPI)' },
  'legal/cpi/informe-legal-evaluacion-seguimiento-platin': {
    codigo: 'LG-C07',
    nombre: 'Informe Legal — Evaluación y Seguimiento PLATIN (CPI)',
  },
  'legal/cpi/resumen-causas': { codigo: 'LG-C08', nombre: 'Resumen de Causas (CPI)' },
  // Legal PAMSPL
  'legal/pamspl/asesoria-intervencion': { codigo: 'LG-P01', nombre: 'Asesoría/Intervención Legal (PAMSPL)' },
  'legal/pamspl/ficha-ingreso-nnaj': { codigo: 'LG-P02', nombre: 'Ficha de Ingreso de NNAJ (PAMSPL)' },
  'legal/pamspl/datos-judiciales': { codigo: 'LG-P03', nombre: 'Datos Judiciales (PAMSPL)' },
  'legal/pamspl/resumen-causas': { codigo: 'LG-P04', nombre: 'Resumen de Causas (PAMSPL)' },
  // Rutas genéricas legal (formularios que guardan con tipos compartidos)
  'legal/asesoria-legal': { codigo: 'LG-01', nombre: 'Asesoría / Intervención Legal' },
  'legal/datos-judiciales': { codigo: 'LG-02', nombre: 'Datos Judiciales' },
  'legal/resumen-causas': { codigo: 'LG-03', nombre: 'Resumen de Causas' },
  // Pedagogía
  'pedagogia/informe-inicial': { codigo: 'PD-01', nombre: 'Informe Inicial (Pedagogía)' },
  'pedagogia/seguimiento': { codigo: 'PD-03', nombre: 'Seguimiento (Pedagogía)' },
  'pedagogia/cierre': { codigo: 'PD-04', nombre: 'Cierre (Pedagogía)' },
  'pedagogia/especial': { codigo: 'PD-05', nombre: 'Informe Especial (Pedagogía)' },
}

/** tipo_formulario (BD) → sufijo de ruta del formulario fuente */
export const TIPO_FORMULARIO_A_SUFFIX: Record<string, string> = {
  // Trabajo social
  entrevista_familiar_pmspl: 'trabajo-social/entrevista-familiar',
  entrevista_familiar_cpi: 'trabajo-social/entrevista-familiar-cpi',
  entrevista_evaluacion_seguimiento: 'trabajo-social/entrevista-evaluacion-seguimiento',
  entrevista_evaluacion_seguimiento_cpi: 'trabajo-social/entrevista-evaluacion-seguimiento-cpi',
  ficha_entrevista_egreso_cpi: 'trabajo-social/ficha-entrevista-egreso-cpi',
  ficha_entrevista_final_cierre: 'trabajo-social/ficha-entrevista-final-cierre',
  ficha_intervencion: 'trabajo-social/ficha-intervencion',
  ficha_intervencion_cpi: 'trabajo-social/ficha-intervencion-cpi',
  ficha_remision_interna_cpi: 'trabajo-social/ficha-remision-interna-cpi',
  ficha_social: 'trabajo-social/ficha-social',
  ficha_social_area_trabajo_social: 'trabajo-social/ficha-social-area-trabajo-social',
  ficha_social_fase_diagnostico: 'trabajo-social/ficha-social-fase-diagnostico',
  ficha_social_fase_ingreso: 'trabajo-social/ficha-social-fase-ingreso',
  ficha_visita_domiciliaria_cpi: 'trabajo-social/ficha-visita-domiciliaria-cpi',
  informe_evaluacion_seguimiento_cpi: 'trabajo-social/informe-evaluacion-seguimiento-cpi',
  informe_incidencias: 'trabajo-social/informe-incidencias',
  informe_servicio_comunitario: 'trabajo-social/informe-servicio-comunitario',
  informe_social_egreso_cierre: 'trabajo-social/informe-social-egreso-cierre',
  informe_social_egreso_cpi: 'trabajo-social/informe-social-egreso-cpi',
  informe_social_evaluacion_seguimiento: 'trabajo-social/informe-social-evaluacion-seguimiento',
  informe_social_fase_diagnostico: 'trabajo-social/informe-social-fase-diagnostico',
  informe_social_inicial: 'trabajo-social/informe-social-inicial',
  informe_socioeconomico: 'trabajo-social/informe-socioeconomico',
  plan_atencion_cautelar_cpi: 'trabajo-social/plan-atencion-cautelar-cpi',
  plan_atencion_individual: 'trabajo-social/plan-atencion-individual',
  visita_domiciliaria: 'trabajo-social/visita-domiciliaria',
  platin_cpi: 'trabajo-social/platin-cpi',
  estudio_socioeconomico: 'trabajo-social/estudio-socioeconomico',
  // Psicología PAMSPL (valores reales en formularios_atencion / API)
  entrevista_inicial_adolescente: 'psicologia/pmspl/entrevista-inicial-adolescente',
  entrevista_final_adolescente: 'psicologia/pmspl/entrevista-final-adolescente',
  entrevista_psicologica_adolescentes_jovenes: 'psicologia/pmspl/entrevista-psicologica-adolescentes-jovenes',
  seguimiento_psicologico: 'psicologia/pmspl/seguimiento-psicologico',
  informe_psicodiagnostico: 'psicologia/pmspl/informe-psicodiagnostico',
  informe_seguimiento: 'psicologia/pmspl/informe-seguimiento',
  informe_final: 'psicologia/pmspl/informe-final',
  remision_instituciones: 'psicologia/pmspl/remision-instituciones',
  // Psicología CPI
  entrevista_inicial_adolescente_cpi: 'psicologia/cpi/entrevista-inicial-adolescente',
  entrevista_inicial_familia_cpi: 'psicologia/cpi/entrevista-inicial-familia',
  entrevista_preeliminar: 'psicologia/cpi/entrevista-preeliminar',
  entrevista_seguimiento_familia: 'psicologia/cpi/entrevista-seguimiento-familia',
  informe_final_cpi: 'psicologia/cpi/informe-final',
  informe_preliminar_cpi: 'psicologia/cpi/informe-preliminar',
  informe_seguimiento_post_sancion_cpi: 'psicologia/cpi/informe-seguimiento-post-sancion',
  intervencion_crisis_cpi: 'psicologia/cpi/intervencion-crisis',
  remision_cpi_pmspl: 'psicologia/cpi/remision',
  remision_interna_cpi: 'psicologia/cpi/remision-interna',
  seguimiento_terapeutico_familiar_cpi: 'psicologia/cpi/seguimiento-terapeutico-familiar',
  seguimiento_terapeutico_grupal_adolescentes_cpi: 'psicologia/cpi/seguimiento-terapeutico-grupal-adolescentes',
  seguimiento_terapeutico_grupal_padres: 'psicologia/cpi/seguimiento-terapeutico-grupal-padres',
  seguimiento_terapeutico_individual_adolescentes_cpi:
    'psicologia/cpi/seguimiento-terapeutico-individual-adolescentes',
  informe_psicodiagnostico_cpi: 'psicologia/cpi/informe-psicodiagnostico',
  // Seguridad
  ficha_ingreso_seguridad: 'seguridad/ficha-ingreso',
  datos_aprehension: 'seguridad/datos-aprehension',
  estado_fisico: 'seguridad/estado-fisico',
  // Legal (rutas genéricas en mapa de edición)
  asesoria_legal: 'legal/asesoria-legal',
  datos_judiciales: 'legal/datos-judiciales',
  resumen_causas: 'legal/resumen-causas',
  // Médicos / salud
  historia_clinica: 'medicos/historia-clinica',
  examen_fisico: 'medicos/examen-fisico',
  hoja_egreso: 'medicos/hoja-egreso',
  informe_seguimiento_salud: 'salud/informe-seguimiento',
  // Pedagogía / educación
  cierre: 'pedagogia/cierre',
  especial: 'pedagogia/especial',
  seguimiento: 'pedagogia/seguimiento',
  informe_inicial: 'pedagogia/informe-inicial',
  informe_inicial_educativo: 'educacion/informe-inicial',
}

export function rutaSuffixDesdeCompleta(ruta: string): string {
  if (ruta.startsWith(RUTA_FORMULARIOS_PREFIX)) {
    return ruta.slice(RUTA_FORMULARIOS_PREFIX.length)
  }
  return ruta.replace(/^\//, '')
}

export function getFichaMetaPorRutaCompleta(ruta: string): { codigo: string; nombre: string } | undefined {
  return FICHA_POR_RUTA_SUFFIX[rutaSuffixDesdeCompleta(ruta)]
}

export function getFichaMetaPorTipoFormulario(
  tipo: string | null | undefined
): { codigo: string; nombre: string } | undefined {
  if (!tipo) return undefined
  const suffix = TIPO_FORMULARIO_A_SUFFIX[tipo]
  if (!suffix) return undefined
  return FICHA_POR_RUTA_SUFFIX[suffix]
}

/** Título para cabecera al ver una ficha guardada (atención). */
export function tituloFichaVisualizacion(
  tipoFormulario: string | null | undefined,
  nombreTipoAtencion?: string | null
): string {
  const meta = getFichaMetaPorTipoFormulario(tipoFormulario)
  if (meta) {
    return `${meta.codigo} — ${meta.nombre}`
  }
  if (tipoFormulario) {
    return `${labelFromKey(tipoFormulario)}${nombreTipoAtencion ? ` · ${nombreTipoAtencion}` : ''}`
  }
  if (nombreTipoAtencion) {
    return `Formulario específico · ${nombreTipoAtencion}`
  }
  return 'Formulario específico'
}
