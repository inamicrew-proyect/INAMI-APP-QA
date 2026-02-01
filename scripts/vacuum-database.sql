-- ============================================
-- SCRIPT DE VACUUM MANUAL
-- Ejecutar este script manualmente fuera de transacciones
-- para limpiar dead rows en las tablas
-- ============================================

-- VACUUM ANALYZE en tablas con más dead rows
VACUUM ANALYZE user_roles;
VACUUM ANALYZE profiles;
VACUUM ANALYZE jovenes;
VACUUM ANALYZE modulos;
VACUUM ANALYZE roles;
VACUUM ANALYZE user_module_permissions;
VACUUM ANALYZE formularios_atencion;
VACUUM ANALYZE atenciones;

-- VACUUM ANALYZE en todas las demás tablas
VACUUM ANALYZE centros;
VACUUM ANALYZE configuraciones_notificaciones;
VACUUM ANALYZE entrevistas_evaluacion_seguimiento;
VACUUM ANALYZE entrevistas_familiares;
VACUUM ANALYZE estudios_socioeconomicos;
VACUUM ANALYZE examenes_fisicos;
VACUUM ANALYZE fichas_ingreso_seguridad;
VACUUM ANALYZE fichas_intervencion;
VACUUM ANALYZE fichas_sociales;
VACUUM ANALYZE formularios_psicologicos;
VACUUM ANALYZE historias_clinicas;
VACUUM ANALYZE hojas_egreso;
VACUUM ANALYZE informes;
VACUUM ANALYZE informes_incidencias;
VACUUM ANALYZE informes_seguimiento_salud;
VACUUM ANALYZE notificaciones;
VACUUM ANALYZE role_module_permissions;
VACUUM ANALYZE security_alerts;
VACUUM ANALYZE security_questions;
VACUUM ANALYZE system_logs;
VACUUM ANALYZE system_metrics;
VACUUM ANALYZE tipos_atencion;
VACUUM ANALYZE user_invitations;
VACUUM ANALYZE visitas_domiciliarias;
