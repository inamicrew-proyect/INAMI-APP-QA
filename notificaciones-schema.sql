-- Sistema de Notificaciones para INAMI-APP
-- Ejecutar en Supabase SQL Editor

-- Tabla de notificaciones
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tipo_notificacion TEXT NOT NULL CHECK (tipo_notificacion IN (
    'cita_proxima', 
    'seguimiento_pendiente', 
    'atencion_vencida', 
    'recordatorio_general',
    'sistema'
  )),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  datos_adicionales JSONB,
  leida BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_lectura TIMESTAMP WITH TIME ZONE,
  fecha_vencimiento TIMESTAMP WITH TIME ZONE,
  prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuraciones de notificaciones por usuario
CREATE TABLE configuraciones_notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  notificaciones_email BOOLEAN DEFAULT TRUE,
  notificaciones_push BOOLEAN DEFAULT TRUE,
  recordatorios_citas BOOLEAN DEFAULT TRUE,
  recordatorios_seguimientos BOOLEAN DEFAULT TRUE,
  dias_anticipacion_citas INTEGER DEFAULT 1,
  dias_anticipacion_seguimientos INTEGER DEFAULT 3,
  horario_notificaciones TIME DEFAULT '09:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones_notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas para notificaciones
CREATE POLICY "Usuarios pueden ver sus notificaciones" ON notificaciones
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar sus notificaciones" ON notificaciones
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Sistema puede crear notificaciones" ON notificaciones
  FOR INSERT WITH CHECK (true);

-- Políticas para configuraciones
CREATE POLICY "Usuarios pueden ver su configuración" ON configuraciones_notificaciones
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar su configuración" ON configuraciones_notificaciones
  FOR ALL USING (auth.uid() = usuario_id);

-- Función para crear notificación
CREATE OR REPLACE FUNCTION crear_notificacion(
  p_usuario_id UUID,
  p_tipo_notificacion TEXT,
  p_titulo TEXT,
  p_mensaje TEXT,
  p_datos_adicionales JSONB DEFAULT NULL,
  p_prioridad TEXT DEFAULT 'media',
  p_fecha_vencimiento TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notificacion_id UUID;
BEGIN
  INSERT INTO notificaciones (
    usuario_id,
    tipo_notificacion,
    titulo,
    mensaje,
    datos_adicionales,
    prioridad,
    fecha_vencimiento
  ) VALUES (
    p_usuario_id,
    p_tipo_notificacion,
    p_titulo,
    p_mensaje,
    p_datos_adicionales,
    p_prioridad,
    p_fecha_vencimiento
  ) RETURNING id INTO notificacion_id;
  
  RETURN notificacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar notificación como leída
CREATE OR REPLACE FUNCTION marcar_notificacion_leida(p_notificacion_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notificaciones 
  SET leida = TRUE, fecha_lectura = NOW()
  WHERE id = p_notificacion_id AND usuario_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear recordatorios automáticos
CREATE OR REPLACE FUNCTION crear_recordatorios_automaticos()
RETURNS VOID AS $$
DECLARE
  atencion_record RECORD;
  usuario_record RECORD;
  dias_anticipacion INTEGER;
BEGIN
  -- Recordatorios de citas próximas
  FOR atencion_record IN 
    SELECT 
      a.id,
      a.joven_id,
      a.profesional_id,
      a.fecha_atencion,
      a.proxima_cita,
      p.full_name as profesional_nombre,
      j.nombres,
      j.apellidos
    FROM atenciones a
    JOIN profiles p ON a.profesional_id = p.id
    JOIN jovenes j ON a.joven_id = j.id
    WHERE a.proxima_cita IS NOT NULL
    AND a.estado IN ('pendiente', 'en_proceso')
    AND a.proxima_cita BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  LOOP
    -- Obtener configuración del usuario
    SELECT 
      COALESCE(cn.dias_anticipacion_citas, 1) as dias_anticipacion
    INTO usuario_record
    FROM configuraciones_notificaciones cn
    WHERE cn.usuario_id = atencion_record.profesional_id;
    
    dias_anticipacion := COALESCE(usuario_record.dias_anticipacion, 1);
    
    -- Crear notificación si la cita está dentro del rango de anticipación
    IF atencion_record.proxima_cita <= NOW() + (dias_anticipacion || ' days')::INTERVAL THEN
      PERFORM crear_notificacion(
        atencion_record.profesional_id,
        'cita_proxima',
        'Cita Próxima - ' || atencion_record.nombres || ' ' || atencion_record.apellidos,
        'Tienes una cita programada para el ' || 
        TO_CHAR(atencion_record.proxima_cita, 'DD/MM/YYYY HH24:MI') || 
        ' con ' || atencion_record.nombres || ' ' || atencion_record.apellidos,
        jsonb_build_object(
          'atencion_id', atencion_record.id,
          'joven_id', atencion_record.joven_id,
          'fecha_cita', atencion_record.proxima_cita
        ),
        'alta',
        atencion_record.proxima_cita
      );
    END IF;
  END LOOP;
  
  -- Recordatorios de seguimientos pendientes
  FOR atencion_record IN 
    SELECT 
      a.id,
      a.joven_id,
      a.profesional_id,
      a.fecha_atencion,
      p.full_name as profesional_nombre,
      j.nombres,
      j.apellidos
    FROM atenciones a
    JOIN profiles p ON a.profesional_id = p.id
    JOIN jovenes j ON a.joven_id = j.id
    WHERE a.estado = 'pendiente'
    AND a.fecha_atencion < NOW() - INTERVAL '3 days'
  LOOP
    -- Obtener configuración del usuario
    SELECT 
      COALESCE(cn.dias_anticipacion_seguimientos, 3) as dias_anticipacion
    INTO usuario_record
    FROM configuraciones_notificaciones cn
    WHERE cn.usuario_id = atencion_record.profesional_id;
    
    dias_anticipacion := COALESCE(usuario_record.dias_anticipacion, 3);
    
    -- Crear notificación si el seguimiento está pendiente
    IF atencion_record.fecha_atencion <= NOW() - (dias_anticipacion || ' days')::INTERVAL THEN
      PERFORM crear_notificacion(
        atencion_record.profesional_id,
        'seguimiento_pendiente',
        'Seguimiento Pendiente - ' || atencion_record.nombres || ' ' || atencion_record.apellidos,
        'Tienes un seguimiento pendiente desde el ' || 
        TO_CHAR(atencion_record.fecha_atencion, 'DD/MM/YYYY') || 
        ' para ' || atencion_record.nombres || ' ' || atencion_record.apellidos,
        jsonb_build_object(
          'atencion_id', atencion_record.id,
          'joven_id', atencion_record.joven_id,
          'fecha_atencion', atencion_record.fecha_atencion
        ),
        'urgente',
        NOW() + INTERVAL '1 day'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_notificaciones_updated_at 
  BEFORE UPDATE ON notificaciones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuraciones_notificaciones_updated_at 
  BEFORE UPDATE ON configuraciones_notificaciones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para mejor rendimiento
CREATE INDEX idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo_notificacion);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_fecha_creacion ON notificaciones(fecha_creacion);
CREATE INDEX idx_configuraciones_usuario_id ON configuraciones_notificaciones(usuario_id);
