-- Ejecutar en Supabase (SQL) tras desplegar el código que usa los nuevos tipos.
-- 1) Informe de seguimiento PMSPL: separar de `informe_seguimiento` (médicos).

UPDATE formularios_psicologicos
SET tipo_formulario = 'informe_seguimiento_psicologia_pmspl'
WHERE tipo_formulario = 'informe_seguimiento';

-- Filas de atención psicológica vinculadas por motivo (ajustar si su convención difiere).
UPDATE formularios_atencion fa
SET tipo_formulario = 'informe_seguimiento_psicologia_pmspl'
FROM atenciones a
WHERE fa.atencion_id = a.id
  AND fa.tipo_formulario = 'informe_seguimiento'
  AND a.motivo LIKE 'Formulario Psicológico:%';

-- 2) Informe post sanción CPI: unificar sufijo _cpi (si existía el valor antiguo sin sufijo).

UPDATE formularios_psicologicos
SET tipo_formulario = 'informe_seguimiento_post_sancion_cpi'
WHERE tipo_formulario = 'informe_seguimiento_post_sancion';

UPDATE formularios_atencion
SET tipo_formulario = 'informe_seguimiento_post_sancion_cpi'
WHERE tipo_formulario = 'informe_seguimiento_post_sancion';

-- 3) Tipos CPI alineados con el código (solo si en BD quedaron valores antiguos de constantes).

UPDATE formularios_psicologicos SET tipo_formulario = 'entrevista_preeliminar' WHERE tipo_formulario = 'entrevista_preeliminar_cpi';
UPDATE formularios_psicologicos SET tipo_formulario = 'entrevista_seguimiento_familia' WHERE tipo_formulario = 'entrevista_seguimiento_familia_cpi';

UPDATE formularios_psicologicos SET tipo_formulario = 'seguimiento_terapeutico_individual_adolescentes_cpi' WHERE tipo_formulario = 'seguimiento_terapeutico_individual_adolescentes';
UPDATE formularios_psicologicos SET tipo_formulario = 'seguimiento_terapeutico_grupal_adolescentes_cpi' WHERE tipo_formulario = 'seguimiento_terapeutico_grupal_adolescentes';
UPDATE formularios_psicologicos SET tipo_formulario = 'seguimiento_terapeutico_familiar_cpi' WHERE tipo_formulario = 'seguimiento_terapeutico_familiar';

UPDATE formularios_psicologicos SET tipo_formulario = 'intervencion_crisis_cpi' WHERE tipo_formulario = 'intervencion_crisis';
UPDATE formularios_psicologicos SET tipo_formulario = 'remision_cpi_pmspl' WHERE tipo_formulario = 'remision';
UPDATE formularios_psicologicos SET tipo_formulario = 'remision_interna_cpi' WHERE tipo_formulario = 'remision_interna';
UPDATE formularios_psicologicos SET tipo_formulario = 'informe_preliminar_cpi' WHERE tipo_formulario = 'informe_preliminar';

UPDATE formularios_atencion SET tipo_formulario = 'entrevista_preeliminar' WHERE tipo_formulario = 'entrevista_preeliminar_cpi';
UPDATE formularios_atencion SET tipo_formulario = 'entrevista_seguimiento_familia' WHERE tipo_formulario = 'entrevista_seguimiento_familia_cpi';
UPDATE formularios_atencion SET tipo_formulario = 'seguimiento_terapeutico_individual_adolescentes_cpi' WHERE tipo_formulario = 'seguimiento_terapeutico_individual_adolescentes';
UPDATE formularios_atencion SET tipo_formulario = 'seguimiento_terapeutico_grupal_adolescentes_cpi' WHERE tipo_formulario = 'seguimiento_terapeutico_grupal_adolescentes';
UPDATE formularios_atencion SET tipo_formulario = 'seguimiento_terapeutico_familiar_cpi' WHERE tipo_formulario = 'seguimiento_terapeutico_familiar';
UPDATE formularios_atencion SET tipo_formulario = 'intervencion_crisis_cpi' WHERE tipo_formulario = 'intervencion_crisis';
UPDATE formularios_atencion SET tipo_formulario = 'remision_cpi_pmspl' WHERE tipo_formulario = 'remision';
UPDATE formularios_atencion SET tipo_formulario = 'remision_interna_cpi' WHERE tipo_formulario = 'remision_interna';
UPDATE formularios_atencion SET tipo_formulario = 'informe_preliminar_cpi' WHERE tipo_formulario = 'informe_preliminar';
