-- Script para eliminar el constraint de roles en la tabla profiles
-- Esto permite que se puedan usar roles dinámicos desde la tabla roles

-- Eliminar el constraint CHECK de role en profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- También eliminar el constraint en user_invitations si existe
ALTER TABLE user_invitations DROP CONSTRAINT IF EXISTS user_invitations_role_check;

-- Nota: Después de ejecutar este script, los roles se validarán mediante
-- la verificación en el backend contra la tabla 'roles', no mediante constraints de base de datos.

