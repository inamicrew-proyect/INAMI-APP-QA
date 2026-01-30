-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA SISTEMA INAMI
-- Instituto Nacional para la Atención de Menores Infractores
-- ============================================

-- Tabla de usuarios (se crea automáticamente por Supabase Auth)
-- Solo agregamos campos adicionales en la tabla profiles

-- Tabla de perfiles de usuarios
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pedagogo', 'abogado', 'medico', 'psicologo', 'trabajador_social', 'seguridad')),
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de invitaciones de usuarios (registro por invitación)
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pedagogo', 'abogado', 'medico', 'psicologo', 'trabajador_social', 'seguridad')),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '14 days') NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de centros (CPI y PAMSPL)
CREATE TABLE IF NOT EXISTS centros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('CPI', 'PAMSPL')),
  ubicacion TEXT NOT NULL,
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertar los centros existentes
INSERT INTO centros (nombre, tipo, ubicacion) VALUES
  ('Jalteva', 'CPI', 'Cedros'),
  ('Nuevo Jalteva', 'CPI', 'Cedros'),
  ('El Carmen', 'CPI', 'San Pedro Sula'),
  ('Sagrado Corazón de María', 'CPI', 'Colonia 21 de Octubre'),
  ('PAMSPL Distrito Central', 'PAMSPL', 'Distrito Central'),
  ('PAMSPL La Ceiba', 'PAMSPL', 'La Ceiba'),
  ('PAMSPL Comayagua', 'PAMSPL', 'Comayagua'),
  ('PAMSPL Choluteca', 'PAMSPL', 'Choluteca'),
  ('PAMSPL San Pedro Sula', 'PAMSPL', 'San Pedro Sula'),
  ('PAMSPL Juticalpa', 'PAMSPL', 'Juticalpa');

-- Tabla de jóvenes/menores
CREATE TABLE IF NOT EXISTS jovenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  edad INTEGER NOT NULL,
  identidad TEXT UNIQUE,
  sexo TEXT CHECK (sexo IN ('Masculino', 'Femenino')),
  direccion TEXT,
  telefono TEXT,
  nombre_contacto_emergencia TEXT,
  telefono_emergencia TEXT,
  centro_id UUID REFERENCES centros(id),
  fecha_ingreso DATE NOT NULL,
  medida_aplicada TEXT,
  delito_infraccion TEXT,
  foto_url TEXT, -- URL de la foto del joven
  expediente_administrativo TEXT,
  expediente_judicial TEXT,
  email TEXT,
  estado_civil TEXT,
  observaciones_generales TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'egresado', 'transferido')),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de tipos de atención
CREATE TABLE IF NOT EXISTS tipos_atencion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  profesional_responsable TEXT CHECK (profesional_responsable IN ('pedagogo', 'abogado', 'medico', 'psicologo', 'trabajador_social', 'seguridad'))
);

-- Insertar tipos de atención
INSERT INTO tipos_atencion (nombre, descripcion, profesional_responsable) VALUES
  ('Atención Pedagógica', 'Evaluación y seguimiento educativo del menor', 'pedagogo'),
  ('Atención Legal', 'Seguimiento del proceso legal y derechos del menor', 'abogado'),
  ('Atención Médica', 'Evaluación y seguimiento de salud física', 'medico'),
  ('Atención Psicológica', 'Evaluación y terapia psicológica', 'psicologo'),
  ('Atención de Trabajo Social', 'Evaluación familiar y social', 'trabajador_social'),
  ('Registro de Seguridad', 'Registro y seguimiento de datos de ingreso', 'seguridad');

-- Tabla principal de atenciones
CREATE TABLE IF NOT EXISTS atenciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  joven_id UUID REFERENCES jovenes(id) ON DELETE CASCADE NOT NULL,
  tipo_atencion_id UUID REFERENCES tipos_atencion(id) NOT NULL,
  profesional_id UUID REFERENCES profiles(id) NOT NULL,
  fecha_atencion TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  motivo TEXT NOT NULL,
  observaciones TEXT,
  recomendaciones TEXT,
  proxima_cita DATE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completada', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de formularios específicos por tipo de atención
CREATE TABLE IF NOT EXISTS formularios_atencion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  atencion_id UUID REFERENCES atenciones(id) ON DELETE CASCADE NOT NULL,
  datos_json JSONB NOT NULL,  -- Aquí se guardan los datos específicos de cada formulario
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de informes generados
CREATE TABLE IF NOT EXISTS informes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  atencion_id UUID REFERENCES atenciones(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  archivo_url TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros ENABLE ROW LEVEL SECURITY;
-- Políticas para user_invitations (solo administradores)
CREATE POLICY "Admins pueden gestionar invitaciones" ON user_invitations
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));
ALTER TABLE jovenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_atencion ENABLE ROW LEVEL SECURITY;
ALTER TABLE atenciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE formularios_atencion ENABLE ROW LEVEL SECURITY;
ALTER TABLE informes ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para centros (todos pueden ver)
CREATE POLICY "Todos pueden ver centros" ON centros
  FOR SELECT TO authenticated USING (true);

-- Políticas para jovenes
CREATE POLICY "Usuarios autenticados pueden ver jóvenes" ON jovenes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear jóvenes" ON jovenes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar jóvenes" ON jovenes
  FOR UPDATE TO authenticated USING (true);

-- Políticas para tipos_atencion
CREATE POLICY "Todos pueden ver tipos de atención" ON tipos_atencion
  FOR SELECT TO authenticated USING (true);

-- Políticas para atenciones
CREATE POLICY "Usuarios pueden ver todas las atenciones" ON atenciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios pueden crear atenciones" ON atenciones
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar atenciones" ON atenciones
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios pueden eliminar sus atenciones" ON atenciones
  FOR DELETE TO authenticated USING (profesional_id = auth.uid());

-- Políticas para formularios_atencion
CREATE POLICY "Usuarios pueden ver formularios" ON formularios_atencion
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios pueden crear formularios" ON formularios_atencion
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar formularios" ON formularios_atencion
  FOR UPDATE TO authenticated USING (true);

-- Políticas para informes
CREATE POLICY "Usuarios pueden ver informes" ON informes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios pueden crear informes" ON informes
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at BEFORE UPDATE ON user_invitations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_jovenes_updated_at BEFORE UPDATE ON jovenes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_atenciones_updated_at BEFORE UPDATE ON atenciones
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_formularios_updated_at BEFORE UPDATE ON formularios_atencion
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'seguridad')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_jovenes_centro ON jovenes(centro_id);
CREATE INDEX IF NOT EXISTS idx_jovenes_estado ON jovenes(estado);
CREATE INDEX IF NOT EXISTS idx_atenciones_joven ON atenciones(joven_id);
CREATE INDEX IF NOT EXISTS idx_atenciones_profesional ON atenciones(profesional_id);
CREATE INDEX IF NOT EXISTS idx_atenciones_fecha ON atenciones(fecha_atencion);
CREATE INDEX IF NOT EXISTS idx_formularios_atencion ON formularios_atencion(atencion_id);
CREATE INDEX IF NOT EXISTS idx_informes_atencion ON informes(atencion_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);

-- ============================================
-- SISTEMA DE NOTIFICACIONES
-- ============================================

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

-- Habilitar RLS para notificaciones
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

-- Triggers para notificaciones
CREATE TRIGGER update_notificaciones_updated_at 
  BEFORE UPDATE ON notificaciones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuraciones_notificaciones_updated_at 
  BEFORE UPDATE ON configuraciones_notificaciones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para notificaciones
CREATE INDEX idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo_notificacion);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_fecha_creacion ON notificaciones(fecha_creacion);
CREATE INDEX idx_configuraciones_usuario_id ON configuraciones_notificaciones(usuario_id);

