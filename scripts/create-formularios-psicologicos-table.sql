-- ============================================
-- CREAR TABLA DE FORMULARIOS PSICOLÓGICOS
-- ============================================

-- Tabla para almacenar formularios psicológicos
CREATE TABLE IF NOT EXISTS formularios_psicologicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  joven_id UUID REFERENCES jovenes(id) ON DELETE CASCADE NOT NULL,
  tipo_formulario TEXT NOT NULL,
  datos_json JSONB NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para mejorar el rendimiento de las consultas
-- Los índices con IF NOT EXISTS son seguros de ejecutar múltiples veces
CREATE INDEX IF NOT EXISTS idx_formularios_psicologicos_joven_id ON formularios_psicologicos(joven_id);
CREATE INDEX IF NOT EXISTS idx_formularios_psicologicos_tipo_formulario ON formularios_psicologicos(tipo_formulario);
CREATE INDEX IF NOT EXISTS idx_formularios_psicologicos_fecha_creacion ON formularios_psicologicos(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_formularios_psicologicos_joven_tipo ON formularios_psicologicos(joven_id, tipo_formulario);

-- Habilitar RLS (Row Level Security)
ALTER TABLE formularios_psicologicos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para formularios_psicologicos
-- Eliminar políticas existentes si ya existen antes de crearlas
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver formularios psicológicos" ON formularios_psicologicos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear formularios psicológicos" ON formularios_psicologicos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar formularios psicológicos" ON formularios_psicologicos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar formularios psicológicos" ON formularios_psicologicos;

-- Los usuarios autenticados pueden ver todos los formularios psicológicos
CREATE POLICY "Usuarios autenticados pueden ver formularios psicológicos" ON formularios_psicologicos
  FOR SELECT TO authenticated USING (true);

-- Los usuarios autenticados pueden crear formularios psicológicos
CREATE POLICY "Usuarios autenticados pueden crear formularios psicológicos" ON formularios_psicologicos
  FOR INSERT TO authenticated WITH CHECK (true);

-- Los usuarios autenticados pueden actualizar formularios psicológicos
CREATE POLICY "Usuarios autenticados pueden actualizar formularios psicológicos" ON formularios_psicologicos
  FOR UPDATE TO authenticated USING (true);

-- Los usuarios autenticados pueden eliminar formularios psicológicos
CREATE POLICY "Usuarios autenticados pueden eliminar formularios psicológicos" ON formularios_psicologicos
  FOR DELETE TO authenticated USING (true);

-- Trigger para actualizar updated_at automáticamente
-- Eliminar el trigger si ya existe antes de crearlo
DROP TRIGGER IF EXISTS update_formularios_psicologicos_updated_at ON formularios_psicologicos;
CREATE TRIGGER update_formularios_psicologicos_updated_at 
  BEFORE UPDATE ON formularios_psicologicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Agregar campo tipo_formulario y joven_id a formularios_atencion si no existen
-- (para mantener compatibilidad con el sistema existente)
DO $$
BEGIN
  -- Verificar si la columna tipo_formulario existe en formularios_atencion
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'formularios_atencion' 
    AND column_name = 'tipo_formulario'
  ) THEN
    ALTER TABLE formularios_atencion ADD COLUMN tipo_formulario TEXT;
  END IF;

  -- Verificar si la columna joven_id existe en formularios_atencion
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'formularios_atencion' 
    AND column_name = 'joven_id'
  ) THEN
    ALTER TABLE formularios_atencion ADD COLUMN joven_id UUID REFERENCES jovenes(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_formularios_atencion_joven_id ON formularios_atencion(joven_id);
  END IF;
END $$;
