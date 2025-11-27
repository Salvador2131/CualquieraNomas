# 👤 Instrucciones para Crear Usuario Administrador

## Credenciales del Administrador

- **Email**: `admin@ejemplo.com`
- **Contraseña**: `admin123`

## 📋 Pasos para Crear el Usuario

### Método 1: Desde Supabase Dashboard (RECOMENDADO)

1. **Ir al Dashboard de Supabase**

   - Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
   - Navega a **Authentication** en el menú lateral
   - Haz clic en **Users**

2. **Crear el Usuario**

   - Haz clic en el botón **"Add User"** o **"Invite User"**
   - Completa el formulario:
     ```
     Email: admin@ejemplo.com
     Password: admin123
     Auto Confirm User: ✅ (DEBE estar marcado)
     ```
   - Haz clic en **"Create User"**

3. **Verificar el Usuario**
   - El usuario debería aparecer en la lista de usuarios
   - Si tienes el trigger configurado (ver `scripts/create-admin-user.sql`), el registro se creará automáticamente en la tabla `users` pública con `role='admin'`

### Método 2: Usar el Script SQL Simplificado (MÁS FÁCIL)

1. **Crear el usuario en Supabase Auth primero** (Dashboard > Authentication > Users > Add User)
2. **Ejecutar el script SQL simplificado:**
   - Ve a SQL Editor en Supabase
   - Copia y pega el contenido de `scripts/crear-admin-simple.sql`
   - Ejecuta el script
   - El script verificará si el usuario existe en auth.users y creará el registro en users automáticamente

### Método 3: Crear Manualmente en la Tabla Users

Si el script no funciona, puedes crear el usuario manualmente:

1. **Obtener el ID del Usuario de Auth**

   ```sql
   SELECT id, email FROM auth.users WHERE email = 'admin@ejemplo.com';
   ```

2. **Insertar en la Tabla Users**
   ```sql
   INSERT INTO users (id, email, name, role)
   VALUES (
     'UUID_DEL_PASO_ANTERIOR',  -- Reemplazar con el UUID real
     'admin@ejemplo.com',
     'Administrador',
     'admin'
   )
   ON CONFLICT (email) DO UPDATE
   SET role = 'admin', name = 'Administrador';
   ```

### Método 4: Usar el Script SQL con Trigger (Avanzado)

Si tienes permisos y quieres configurar el trigger automático:

1. Ejecuta el script `scripts/create-admin-user.sql` completo en el SQL Editor
2. Esto configurará el trigger automático que crea usuarios en `users` cuando se crean en `auth.users`
3. Luego crea el usuario desde el Dashboard (Método 1)
4. El trigger creará automáticamente el registro en la tabla `users`

## ✅ Verificar que Funciona

Después de crear el usuario, prueba iniciar sesión:

1. Ve a `http://localhost:3000/auth/login`
2. Ingresa:
   - Email: `admin@ejemplo.com`
   - Contraseña: `admin123`
3. Deberías ser redirigido a `/dashboard` como administrador

## 🔍 Troubleshooting

### Si el login falla:

1. **Verificar que el usuario existe en auth.users:**

   ```sql
   SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'admin@ejemplo.com';
   ```

2. **Verificar que existe en la tabla users:**

   ```sql
   SELECT id, email, name, role FROM users WHERE email = 'admin@ejemplo.com';
   ```

3. **Si falta en users, insertar manualmente:**

   ```sql
   -- Primero obtener el ID
   SELECT id FROM auth.users WHERE email = 'admin@ejemplo.com';

   -- Luego insertar (reemplazar UUID_AQUI con el ID real)
   INSERT INTO users (id, email, name, role)
   VALUES ('UUID_AQUI', 'admin@ejemplo.com', 'Administrador', 'admin')
   ON CONFLICT (email) DO UPDATE SET role = 'admin';
   ```

4. **Verificar que la contraseña es correcta:**
   - Puedes resetear la contraseña desde el Dashboard si es necesario

## 📝 Notas

- El campo `role` debe ser exactamente `'admin'` (no `'administrator'` ni `'Administrador'`)
- El trigger `on_auth_user_created` debe estar configurado para que se cree automáticamente el registro en `users`
- Si el trigger no funciona, puedes crear el usuario manualmente usando los métodos 2 o 3
