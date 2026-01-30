

INSERT INTO user_roles (user_id, role_id)
SELECT 
  p.id AS user_id,
  r.id AS role_id
FROM profiles p
INNER JOIN roles r ON r.nombre = p.role
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = p.id AND ur.role_id = r.id
);


INSERT INTO role_module_permissions (role_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 
  r.id AS role_id,
  m.id AS modulo_id,
  true AS puede_ver,
  true AS puede_crear,
  true AS puede_editar,
  true AS puede_eliminar
FROM roles r
CROSS JOIN modulos m
WHERE r.nombre = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM role_module_permissions rmp 
    WHERE rmp.role_id = r.id AND rmp.modulo_id = m.id
  );

