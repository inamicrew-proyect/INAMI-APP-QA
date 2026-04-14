-- =============================================================================
-- RLS: formularios_atencion
-- =============================================================================
-- Corrige errores del tipo:
--   "new row violates row-level security policy for table 'formularios_atencion'"
-- cuando la app (cliente Supabase con rol `authenticated`) inserta o actualiza.
--
-- Ejecutar en Supabase → SQL Editor (o psql contra la BD del proyecto).
-- Idempotente: elimina políticas existentes en esa tabla y recrea las estándar.
--
-- Modelo de seguridad: mismo criterio que `formularios_psicologicos` en este repo
-- (usuarios autenticados pueden CRUD). Si más adelante se requiere restricción por
-- profesional/atención, sustituir USING / WITH CHECK por condiciones concretas.
-- =============================================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'formularios_atencion'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.formularios_atencion', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.formularios_atencion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver formularios de atención"
  ON public.formularios_atencion;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear formularios de atención"
  ON public.formularios_atencion;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar formularios de atención"
  ON public.formularios_atencion;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar formularios de atención"
  ON public.formularios_atencion;

CREATE POLICY "Usuarios autenticados pueden ver formularios de atención"
  ON public.formularios_atencion
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear formularios de atención"
  ON public.formularios_atencion
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar formularios de atención"
  ON public.formularios_atencion
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar formularios de atención"
  ON public.formularios_atencion
  FOR DELETE
  TO authenticated
  USING (true);
