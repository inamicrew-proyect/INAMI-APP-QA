-- ============================================
-- TRIGGERS PARA REGISTRAR LOGS DE FORMULARIOS
-- ============================================

-- Función para registrar log cuando se crea un formulario en formularios_atencion
CREATE OR REPLACE FUNCTION log_create_formulario_atencion()
RETURNS TRIGGER AS $$
DECLARE
  usuario_id_log UUID;
BEGIN
  -- Intentar obtener el usuario actual
  usuario_id_log := COALESCE(
    (SELECT id FROM profiles WHERE id = auth.uid()),
    NULL
  );
  
  -- Registrar en system_logs
  INSERT INTO system_logs (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalles
  ) VALUES (
    usuario_id_log,
    'create_formulario_atencion',
    'formularios_atencion',
    NEW.id,
    jsonb_build_object(
      'atencion_id', NEW.atencion_id,
      'tipo_formulario', COALESCE(NEW.tipo_formulario, 'desconocido'),
      'joven_id', COALESCE(NEW.joven_id, 'desconocido'),
      'created_by', usuario_id_log
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar log cuando se actualiza un formulario en formularios_atencion
CREATE OR REPLACE FUNCTION log_update_formulario_atencion()
RETURNS TRIGGER AS $$
DECLARE
  usuario_id_log UUID;
BEGIN
  -- Intentar obtener el usuario actual
  usuario_id_log := COALESCE(
    (SELECT id FROM profiles WHERE id = auth.uid()),
    NULL
  );
  
  -- Registrar en system_logs
  INSERT INTO system_logs (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalles
  ) VALUES (
    usuario_id_log,
    'update_formulario_atencion',
    'formularios_atencion',
    NEW.id,
    jsonb_build_object(
      'atencion_id', NEW.atencion_id,
      'tipo_formulario', COALESCE(NEW.tipo_formulario, 'desconocido'),
      'joven_id', COALESCE(NEW.joven_id, 'desconocido'),
      'updated_by', usuario_id_log
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar log cuando se elimina un formulario en formularios_atencion
CREATE OR REPLACE FUNCTION log_delete_formulario_atencion()
RETURNS TRIGGER AS $$
DECLARE
  usuario_id_log UUID;
BEGIN
  -- Intentar obtener el usuario actual
  usuario_id_log := COALESCE(
    (SELECT id FROM profiles WHERE id = auth.uid()),
    NULL
  );
  
  -- Registrar en system_logs
  INSERT INTO system_logs (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalles
  ) VALUES (
    usuario_id_log,
    'delete_formulario_atencion',
    'formularios_atencion',
    OLD.id,
    jsonb_build_object(
      'atencion_id', OLD.atencion_id,
      'tipo_formulario', COALESCE(OLD.tipo_formulario, 'desconocido'),
      'joven_id', COALESCE(OLD.joven_id, 'desconocido'),
      'deleted_by', usuario_id_log
    )
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear triggers
DROP TRIGGER IF EXISTS trigger_log_create_formulario_atencion ON formularios_atencion;
CREATE TRIGGER trigger_log_create_formulario_atencion
  AFTER INSERT ON formularios_atencion
  FOR EACH ROW
  EXECUTE FUNCTION log_create_formulario_atencion();

DROP TRIGGER IF EXISTS trigger_log_update_formulario_atencion ON formularios_atencion;
CREATE TRIGGER trigger_log_update_formulario_atencion
  AFTER UPDATE ON formularios_atencion
  FOR EACH ROW
  EXECUTE FUNCTION log_update_formulario_atencion();

DROP TRIGGER IF EXISTS trigger_log_delete_formulario_atencion ON formularios_atencion;
CREATE TRIGGER trigger_log_delete_formulario_atencion
  AFTER DELETE ON formularios_atencion
  FOR EACH ROW
  EXECUTE FUNCTION log_delete_formulario_atencion();

-- También agregar triggers para formularios_psicologicos si no existen
CREATE OR REPLACE FUNCTION log_create_formulario_psicologico()
RETURNS TRIGGER AS $$
DECLARE
  usuario_id_log UUID;
BEGIN
  usuario_id_log := COALESCE(
    (SELECT id FROM profiles WHERE id = auth.uid()),
    NULL
  );
  
  INSERT INTO system_logs (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalles
  ) VALUES (
    usuario_id_log,
    'create_formulario_psicologico',
    'formularios_psicologicos',
    NEW.id,
    jsonb_build_object(
      'joven_id', NEW.joven_id,
      'tipo_formulario', NEW.tipo_formulario,
      'created_by', usuario_id_log
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_update_formulario_psicologico()
RETURNS TRIGGER AS $$
DECLARE
  usuario_id_log UUID;
BEGIN
  usuario_id_log := COALESCE(
    (SELECT id FROM profiles WHERE id = auth.uid()),
    NULL
  );
  
  INSERT INTO system_logs (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalles
  ) VALUES (
    usuario_id_log,
    'update_formulario_psicologico',
    'formularios_psicologicos',
    NEW.id,
    jsonb_build_object(
      'joven_id', NEW.joven_id,
      'tipo_formulario', NEW.tipo_formulario,
      'updated_by', usuario_id_log
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_delete_formulario_psicologico()
RETURNS TRIGGER AS $$
DECLARE
  usuario_id_log UUID;
BEGIN
  usuario_id_log := COALESCE(
    (SELECT id FROM profiles WHERE id = auth.uid()),
    NULL
  );
  
  INSERT INTO system_logs (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalles
  ) VALUES (
    usuario_id_log,
    'delete_formulario_psicologico',
    'formularios_psicologicos',
    OLD.id,
    jsonb_build_object(
      'joven_id', OLD.joven_id,
      'tipo_formulario', OLD.tipo_formulario,
      'deleted_by', usuario_id_log
    )
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear triggers para formularios_psicologicos
DROP TRIGGER IF EXISTS trigger_log_create_formulario_psicologico ON formularios_psicologicos;
CREATE TRIGGER trigger_log_create_formulario_psicologico
  AFTER INSERT ON formularios_psicologicos
  FOR EACH ROW
  EXECUTE FUNCTION log_create_formulario_psicologico();

DROP TRIGGER IF EXISTS trigger_log_update_formulario_psicologico ON formularios_psicologicos;
CREATE TRIGGER trigger_log_update_formulario_psicologico
  AFTER UPDATE ON formularios_psicologicos
  FOR EACH ROW
  EXECUTE FUNCTION log_update_formulario_psicologico();

DROP TRIGGER IF EXISTS trigger_log_delete_formulario_psicologico ON formularios_psicologicos;
CREATE TRIGGER trigger_log_delete_formulario_psicologico
  AFTER DELETE ON formularios_psicologicos
  FOR EACH ROW
  EXECUTE FUNCTION log_delete_formulario_psicologico();
