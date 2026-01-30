
SELECT 
  ur.id,
  ur.user_id,
  ur.role_id,
  r.nombre as rol_nombre,
  r.activo as rol_activo
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = 'USER_ID_AQUI'::uuid;

-
SELECT 
  rmp.id,
  rmp.role_id,
  r.nombre as rol_nombre,
  m.nombre as modulo_nombre,
  m.ruta as modulo_ruta,
  rmp.puede_ver,
  rmp.puede_crear,
  rmp.puede_editar,
  rmp.puede_eliminar
FROM role_module_permissions rmp
JOIN user_roles ur ON ur.role_id = rmp.role_id
JOIN roles r ON r.id = rmp.role_id
JOIN modulos m ON m.id = rmp.modulo_id
WHERE ur.user_id = 'USER_ID_AQUI'::uuid
  AND m.ruta = '/dashboard/admin';

-- 3. Verificar todos los módulos y sus permisos para el usuario
SELECT 
  m.id as modulo_id,
  m.nombre as modulo_nombre,
  m.ruta as modulo_ruta,
  r.nombre as rol_nombre,
  COALESCE(MAX(rmp.puede_ver)::boolean, false) as puede_ver,
  COALESCE(MAX(rmp.puede_crear)::boolean, false) as puede_crear,
  COALESCE(MAX(rmp.puede_editar)::boolean, false) as puede_editar,
  COALESCE(MAX(rmp.puede_eliminar)::boolean, false) as puede_eliminar
FROM modulos m
LEFT JOIN role_module_permissions rmp ON rmp.modulo_id = m.id
LEFT JOIN user_roles ur ON ur.role_id = rmp.role_id AND ur.user_id = 'USER_ID_AQUI'::uuid
LEFT JOIN roles r ON r.id = rmp.role_id
WHERE ur.user_id = 'USER_ID_AQUI'::uuid OR ur.user_id IS NULL
GROUP BY m.id, m.nombre, m.ruta, r.nombre
ORDER BY m.nombre;

