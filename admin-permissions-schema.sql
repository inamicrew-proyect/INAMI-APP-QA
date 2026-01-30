-- ============================================
-- ESQUEMA DE PERMISOS DE MÓDULOS Y SEGURIDAD
-- Sistema INAMI - Panel Administrador
-- ============================================

-- Tabla de módulos del sistema
CREATE TABLE IF NOT EXISTS modulos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  ruta TEXT NOT NULL UNIQUE, -- Ejemplo: '/dashboard/jovenes'
  icono TEXT, -- Nombre del icono (lucide-react)
  activo BOOLEAN DEFAULT TRUE,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertar módulos por defecto
INSERT INTO modulos (nombre, descripcion, ruta, icono, orden) VALUES
  ('Dashboard', 'Panel principal del sistema', '/dashboard', 'LayoutDashboard', 1),
  ('Jóvenes', 'Gestión de menores infractores', '/dashboard/jovenes', 'Users', 2),
  ('Atenciones', 'Gestión de atenciones realizadas', '/dashboard/atenciones', 'FileText', 3),
  ('Notificaciones', 'Sistema de notificaciones', '/dashboard/notificaciones', 'Bell', 4),
  ('Panel Administrador', 'Panel de administración', '/dashboard/admin', 'Shield', 5)
ON CONFLICT (nombre) DO NOTHING;

-- Tabla de permisos de módulos por usuario
CREATE TABLE IF NOT EXISTS user_module_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  modulo_id UUID REFERENCES modulos(id) ON DELETE CASCADE NOT NULL,
  puede_ver BOOLEAN DEFAULT FALSE,
  puede_crear BOOLEAN DEFAULT FALSE,
  puede_editar BOOLEAN DEFAULT FALSE,
  puede_eliminar BOOLEAN DEFAULT FALSE,
  granted_by UUID REFERENCES profiles(id), -- Admin que otorgó el permiso
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, modulo_id)
);

-- Tabla de alertas de seguridad
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_alerta TEXT NOT NULL CHECK (tipo_alerta IN (
    'intento_acceso_no_autorizado',
    'cambio_rol',
    'cambio_permisos',
    'actividad_sospechosa',
    'múltiples_intentos_fallidos',
    'acceso_desde_ubicacion_inesperada',
    'modificacion_masiva_datos',
    'eliminacion_datos',
    'otro'
  )),
  severidad TEXT NOT NULL CHECK (severidad IN ('baja', 'media', 'alta', 'critica')) DEFAULT 'media',
  usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  detalles JSONB, -- Información adicional sobre la alerta
  resuelta BOOLEAN DEFAULT FALSE,
  resuelta_por UUID REFERENCES profiles(id),
  fecha_resolucion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de logs de actividad del sistema
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accion TEXT NOT NULL, -- Ejemplo: 'login', 'logout', 'create_joven', 'update_user', etc.
  entidad TEXT, -- Ejemplo: 'jovenes', 'usuarios', 'atenciones'
  entidad_id UUID, -- ID de la entidad afectada
  detalles JSONB, -- Información adicional
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de métricas del sistema
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  metric_type TEXT NOT NULL, -- 'usuarios_activos', 'atenciones_dia', 'jovenes_activos', etc.
  valor NUMERIC NOT NULL,
  detalles JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para modulos (todos los autenticados pueden ver)
CREATE POLICY "Todos pueden ver módulos" ON modulos
  FOR SELECT TO authenticated USING (true);

-- Solo admins pueden modificar módulos
CREATE POLICY "Admins pueden gestionar módulos" ON modulos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Políticas para permisos de módulos
CREATE POLICY "Usuarios pueden ver sus permisos" ON user_module_permissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins pueden gestionar todos los permisos" ON user_module_permissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Políticas para alertas de seguridad (solo admins)
CREATE POLICY "Admins pueden ver todas las alertas" ON security_alerts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Sistema puede crear alertas" ON security_alerts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins pueden actualizar alertas" ON security_alerts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Políticas para logs del sistema (solo admins)
CREATE POLICY "Admins pueden ver logs del sistema" ON system_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Sistema puede crear logs" ON system_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas para métricas del sistema (solo admins)
CREATE POLICY "Admins pueden ver métricas" ON system_metrics
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Sistema puede crear métricas" ON system_metrics
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para updated_at en modulos
CREATE TRIGGER update_modulos_updated_at BEFORE UPDATE ON modulos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at en permisos
CREATE TRIGGER update_user_module_permissions_updated_at BEFORE UPDATE ON user_module_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear alerta cuando se cambia un rol
CREATE OR REPLACE FUNCTION crear_alerta_cambio_rol()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role != NEW.role THEN
    INSERT INTO security_alerts (
      tipo_alerta,
      severidad,
      usuario_id,
      descripcion,
      detalles
    ) VALUES (
      'cambio_rol',
      'alta',
      NEW.id,
      'Cambio de rol de usuario: ' || OLD.role || ' → ' || NEW.role,
      jsonb_build_object(
        'usuario_email', NEW.email,
        'rol_anterior', OLD.role,
        'rol_nuevo', NEW.role,
        'cambiado_por', auth.uid()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER alerta_cambio_rol
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION crear_alerta_cambio_rol();

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user_id ON user_module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_modulo_id ON user_module_permissions(modulo_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_usuario_id ON security_alerts(usuario_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_tipo ON security_alerts(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severidad ON security_alerts(severidad);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resuelta ON security_alerts(resuelta);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_usuario_id ON system_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_accion ON system_logs(accion);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_metrics_fecha ON system_metrics(fecha);
CREATE INDEX IF NOT EXISTS idx_system_metrics_tipo ON system_metrics(metric_type);

