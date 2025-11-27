-- =====================================================
-- SCRIPT SIMPLIFICADO: CREAR USUARIO ADMINISTRADOR
-- =====================================================
-- 
-- IMPORTANTE: Este script solo crea el registro en la tabla users.
-- PRIMERO debes crear el usuario en Supabase Auth desde el Dashboard:
-- 
-- 1. Ve a Authentication > Users > Add User
-- 2. Email: admin@ejemplo.com
-- 3. Password: admin123
-- 4. Auto Confirm User: ✅ (marcar)
-- 5. Guardar
--
-- Luego ejecuta este script para crear/actualizar el registro en users.

-- Paso 1: Verificar si el usuario existe en auth.users
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar el usuario en auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@ejemplo.com'
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    -- Si existe, crear/actualizar en la tabla users
    INSERT INTO users (id, email, name, role)
    VALUES (admin_user_id, 'admin@ejemplo.com', 'Administrador', 'admin')
    ON CONFLICT (email) DO UPDATE
    SET 
      role = 'admin',
      name = 'Administrador',
      updated_at = NOW();
    
    RAISE NOTICE 'Usuario administrador creado/actualizado exitosamente con ID: %', admin_user_id;
  ELSE
    RAISE EXCEPTION 'Usuario no encontrado en auth.users. Por favor crea el usuario primero desde el Dashboard de Supabase (Authentication > Users > Add User)';
  END IF;
END $$;

-- Verificar que se creó correctamente
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'admin@ejemplo.com';





