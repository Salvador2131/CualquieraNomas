-- =====================================================
-- SCRIPT PARA CREAR USUARIO ADMINISTRADOR
-- =====================================================
-- Ejecutar este script en Supabase SQL Editor
-- 
-- NOTA: Primero debes crear el usuario en Supabase Auth desde el panel de administración
-- o usando la función auth.users directamente.
-- 
-- Este script crea el registro en la tabla users pública.

-- Paso 1: Crear el usuario en Supabase Auth (desde el Dashboard de Supabase)
-- Ve a Authentication > Users > Add User
-- Email: admin@ejemplo.com
-- Password: admin123
-- O usa el siguiente comando SQL si tienes permisos:

-- NOTA: No puedes crear usuarios en auth.users directamente desde SQL sin permisos especiales
-- La mejor manera es usar la interfaz de Supabase Dashboard:
-- 1. Ve a Authentication > Users
-- 2. Click en "Add User"
-- 3. Completa:
--    - Email: admin@ejemplo.com
--    - Password: admin123
--    - Auto Confirm User: ✅ (marcar)
-- 4. Guarda

-- Paso 2: Obtener el ID del usuario creado en auth.users
-- Ejecuta esto después de crear el usuario en el Dashboard:
-- SELECT id, email FROM auth.users WHERE email = 'admin@ejemplo.com';

-- Paso 3: Insertar el usuario en la tabla users pública
-- IMPORTANTE: Reemplaza 'UUID_AQUI' con el ID real del usuario de auth.users obtenido en el paso 2
-- O usa un trigger para que se cree automáticamente (ver más abajo)

-- Opción A: Insertar manualmente (necesitas el UUID de auth.users)
-- INSERT INTO users (id, email, name, role)
-- VALUES (
--   'UUID_DEL_USUARIO_AUTH',  -- Reemplazar con el UUID real
--   'admin@ejemplo.com',
--   'Administrador',
--   'admin'
-- )
-- ON CONFLICT (email) DO UPDATE
-- SET role = 'admin', name = 'Administrador';

-- Opción B: Usar función para crear usuario completo (RECOMENDADO)
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS UUID AS $$
DECLARE
  admin_user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Verificar si ya existe un usuario con ese email en auth.users
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'admin@ejemplo.com'
  LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    -- Si ya existe en auth.users, actualizar o insertar en users
    INSERT INTO users (id, email, name, role)
    VALUES (existing_user_id, 'admin@ejemplo.com', 'Administrador', 'admin')
    ON CONFLICT (email) DO UPDATE
    SET role = 'admin', name = 'Administrador';
    
    RETURN existing_user_id;
  ELSE
    -- Si no existe, crear primero en auth.users (requiere permisos especiales)
    -- NOTA: Esto solo funciona si tienes permisos de superadmin
    -- En producción, mejor crear el usuario desde el Dashboard
    RAISE NOTICE 'Usuario no encontrado en auth.users. Por favor crea el usuario desde el Dashboard de Supabase primero.';
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar la función (después de crear el usuario en auth.users)
-- SELECT create_admin_user();

-- =====================================================
-- ALTERNATIVA: Usar Trigger para crear automáticamente
-- =====================================================
-- Este trigger crea automáticamente un registro en users cuando se crea un usuario en auth.users

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'admin@ejemplo.com' THEN 'admin'
      ELSE 'worker'
    END
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    name = COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- INSTRUCCIONES PARA CREAR EL USUARIO MANUALMENTE
-- =====================================================
-- 
-- MÉTODO 1: Desde Supabase Dashboard (RECOMENDADO)
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Navega a Authentication > Users
-- 3. Click en "Add User" o "Invite User"
-- 4. Completa el formulario:
--    - Email: admin@ejemplo.com
--    - Password: admin123
--    - Auto Confirm User: ✅ (debe estar marcado)
-- 5. Click en "Create User"
-- 6. El trigger automáticamente creará el registro en la tabla users con role='admin'
--
-- MÉTODO 2: Desde SQL Editor (si el trigger está activo)
-- Simplemente ejecuta este INSERT (Supabase creará el usuario en auth.users):
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   'admin@ejemplo.com',
--   crypt('admin123', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );
-- 
-- NOTA: El método 2 requiere permisos especiales y puede no funcionar dependiendo de tu plan de Supabase





