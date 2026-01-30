-- ============================================
-- ESQUEMA DE ROLES Y PERMISOS POR ROL
-- Sistema INAMI - Panel Administrador
-- ============================================

-- Tabla de roles del sistema
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de permisos de módulos por rol
CREATE TABLE IF NOT EXISTS role_module_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  modulo_id UUID REFERENCES modulos(id) ON DELETE CASCADE NOT NULL,
  puede_ver BOOLEAN DEFAULT FALSE,
  puede_crear BOOLEAN DEFAULT FALSE,
  puede_editar BOOLEAN DEFAULT FALSE,
  puede_eliminar BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(role_id, modulo_id)
);

-- Tabla de asignación de roles a usuarios
-- Esta tabla permite que un usuario tenga múltiples roles si es necesario
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES profiles(id), -- Admin que asignó el rol
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, role_id)
);

-- Insertar roles por defecto basados en los roles existentes en profiles
INSERT INTO roles (nombre, descripcion) VALUES
  ('admin', 'Administrador del sistema con acceso completo'),
  ('pedagogo', 'Profesional encargado de la educación y formación'),
  ('abogado', 'Profesional legal encargado de asesoría jurídica'),
  ('medico', 'Profesional médico encargado de atención de salud'),
  ('psicologo', 'Profesional de psicología encargado de atención psicológica'),
  ('trabajador_social', 'Profesional de trabajo social'),
  ('seguridad', 'Personal de seguridad')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para roles (todos los autenticados pueden ver)
CREATE POLICY "Todos pueden ver roles" ON roles
  FOR SELECT TO authenticated USING (true);

-- Solo admins pueden modificar roles
CREATE POLICY "Admins pueden gestionar roles" ON roles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Políticas para permisos de módulos por rol
CREATE POLICY "Todos pueden ver permisos de roles" ON role_module_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins pueden gestionar permisos de roles" ON role_module_permissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Políticas para asignación de roles a usuarios
CREATE POLICY "Usuarios pueden ver sus roles asignados" ON user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins pueden gestionar asignación de roles" ON user_roles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para updated_at en roles
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at en permisos de roles
CREATE TRIGGER update_role_module_permissions_updated_at BEFORE UPDATE ON role_module_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_role_module_permissions_role_id ON role_module_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_module_permissions_modulo_id ON role_module_permissions(modulo_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- ============================================
-- FUNCIÓN PARA OBTENER PERMISOS DE UN USUARIO
-- Basado en sus roles asignados
-- ============================================

CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  modulo_id UUID,
  modulo_nombre TEXT,
  puede_ver BOOLEAN,
  puede_crear BOOLEAN,
  puede_editar BOOLEAN,
  puede_eliminar BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    m.id AS modulo_id,
    m.nombre AS modulo_nombre,
    BOOL_OR(rmp.puede_ver) AS puede_ver,
    BOOL_OR(rmp.puede_crear) AS puede_crear,
    BOOL_OR(rmp.puede_editar) AS puede_editar,
    BOOL_OR(rmp.puede_eliminar) AS puede_eliminar
  FROM modulos m
  LEFT JOIN role_module_permissions rmp ON m.id = rmp.modulo_id
  LEFT JOIN user_roles ur ON rmp.role_id = ur.role_id
  WHERE ur.user_id = p_user_id
  GROUP BY m.id, m.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

