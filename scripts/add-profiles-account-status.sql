-- Estado de cuenta para usuarios internos (perfiles).
-- Ejecutar en Supabase SQL Editor antes de usar "activo / inactivo / bloqueado" en la app.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'activo';

-- Restricción de valores permitidos (PostgreSQL 12+)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_account_status_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_account_status_check
      CHECK (account_status IN ('activo', 'inactivo', 'bloqueado'));
  END IF;
END $$;

COMMENT ON COLUMN profiles.account_status IS
  'activo: acceso normal; inactivo: sin acceso (sesión cerrada, no puede entrar); bloqueado: prohibido en Auth (ban)';
