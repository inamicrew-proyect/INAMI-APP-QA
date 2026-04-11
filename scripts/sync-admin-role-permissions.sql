-- Sincroniza el rol `admin` (profiles.role = 'admin') con los permisos del rol ADMINISTRADOR.
-- Ejecutar en Supabase SQL Editor cuando se cree un entorno nuevo o tras cambiar permisos de ADMINISTRADOR.

INSERT INTO public.roles (nombre, descripcion, activo)
VALUES (
  'admin',
  'Administrador del sistema; mismos permisos que ADMINISTRADOR (profiles.role = admin).',
  true
)
ON CONFLICT (nombre) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  activo = true,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.role_module_permissions (role_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT
  (SELECT id FROM public.roles WHERE nombre = 'admin' LIMIT 1),
  rmp.modulo_id,
  rmp.puede_ver,
  rmp.puede_crear,
  rmp.puede_editar,
  rmp.puede_eliminar
FROM public.role_module_permissions rmp
WHERE rmp.role_id = (SELECT id FROM public.roles WHERE nombre = 'ADMINISTRADOR' LIMIT 1)
ON CONFLICT (role_id, modulo_id) DO UPDATE SET
  puede_ver = EXCLUDED.puede_ver,
  puede_crear = EXCLUDED.puede_crear,
  puede_editar = EXCLUDED.puede_editar,
  puede_eliminar = EXCLUDED.puede_eliminar,
  updated_at = timezone('utc'::text, now());
