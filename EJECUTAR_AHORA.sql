-- =====================================================
-- EJECUTA ESTE SCRIPT EN SUPABASE SQL EDITOR AHORA
-- =====================================================
-- Este script crea/actualiza el registro del administrador
-- en la tabla users después de que lo hayas creado en auth.users

-- Crear o actualizar el usuario administrador
INSERT INTO users (id, email, name, role)
SELECT 
  id,
  email,
  'Administrador' as name,
  'admin' as role
FROM auth.users
WHERE email = 'admin@ejemplo.com'
ON CONFLICT (email) DO UPDATE
SET 
  role = 'admin',
  name = 'Administrador',
  updated_at = NOW();

-- Verificar que se creó correctamente
SELECT id, email, name, role, created_at, updated_at 
FROM users 
WHERE email = 'admin@ejemplo.com';

-- Si la consulta anterior muestra resultados, ¡todo está listo!





