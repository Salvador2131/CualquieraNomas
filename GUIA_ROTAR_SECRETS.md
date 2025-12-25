# 🔐 Guía para Rotar Secrets después de Vulnerabilidad

## ⚠️ IMPORTANTE

Si tu aplicación estuvo online y sin parchear desde el **4 de diciembre de 2025 a la 1:00 PM PT**, debes rotar todos los secrets de la aplicación, empezando por los más críticos.

## 📋 Secrets que Necesitan Rotarse

### Secrets Críticos (Rotar PRIMERO):

1. ✅ **SUPABASE_SERVICE_ROLE_KEY** - Acceso completo a la base de datos
2. ✅ **JWT_SECRET** - Autenticación y tokens
3. ✅ **ENCRYPTION_KEY** - Encriptación de datos sensibles

### Secrets Importantes:

4. **SMTP_PASS** (si está configurado) - Acceso a email
5. **CRON_SECRET** (si está configurado) - Protección de cron jobs
6. Cualquier otro secret que use tu aplicación

---

## 🔄 PASO 1: Rotar SUPABASE_SERVICE_ROLE_KEY

### En Supabase Dashboard:

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Settings** → **API**
4. En la sección **"Project API keys"**, busca **"service_role"**
5. Click en **"Reset"** o **"Regenerate"** junto a `service_role` key
6. ⚠️ **COPIA EL NUEVO KEY INMEDIATAMENTE** (solo se muestra una vez)
7. Guarda el nuevo key de forma segura

### En Vercel Dashboard:

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Settings** → **Environment Variables**
4. Busca `SUPABASE_SERVICE_ROLE_KEY`
5. Click en el valor para editarlo
6. Pega el **nuevo** `service_role` key de Supabase
7. Asegúrate de que esté disponible en **Production**, **Preview**, y **Development**
8. Click en **"Save"**

---

## 🔄 PASO 2: Generar Nuevo JWT_SECRET

### Generar un nuevo JWT Secret seguro:

**Opción A: Usar OpenSSL (recomendado)**

```bash
# Generar un secret seguro de 64 caracteres
openssl rand -hex 32
```

**Opción B: Usar Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Opción C: Usar PowerShell (Windows)**

```powershell
# Generar un secret seguro
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### Actualizar en Vercel:

1. Ve a: **Settings** → **Environment Variables**
2. Busca `JWT_SECRET`
3. Click para editar
4. Pega el **nuevo** JWT secret generado
5. Asegúrate de que esté disponible en **Production**, **Preview**, y **Development**
6. Click en **"Save"**

---

## 🔄 PASO 3: Generar Nuevo ENCRYPTION_KEY

### Generar un nuevo Encryption Key:

**Opción A: Usar OpenSSL**

```bash
# Generar un key de 32 caracteres (256 bits)
openssl rand -hex 16
```

**Opción B: Usar Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Opción C: Usar PowerShell (Windows)**

```powershell
# Generar un key de 32 caracteres
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Actualizar en Vercel:

1. Ve a: **Settings** → **Environment Variables**
2. Busca `ENCRYPTION_KEY`
3. Click para editar
4. Pega el **nuevo** encryption key generado
5. Asegúrate de que esté disponible en **Production**, **Preview**, y **Development**
6. Click en **"Save"**

---

## 🔄 PASO 4: Rotar SMTP_PASS (si está configurado)

Si usas email con SMTP:

1. Ve a tu proveedor de email (Gmail, etc.)
2. Genera una nueva **App Password**
3. En Vercel: **Settings** → **Environment Variables**
4. Actualiza `SMTP_PASS` con la nueva contraseña
5. Guarda

---

## 🔄 PASO 5: Actualizar .env.local Local

Después de actualizar en Vercel, actualiza tu archivo local:

1. Abre `.env.local`
2. Actualiza los valores con los nuevos secrets:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=<nuevo-key-de-supabase>
   JWT_SECRET=<nuevo-jwt-secret-generado>
   ENCRYPTION_KEY=<nuevo-encryption-key-generado>
   ```
3. Guarda el archivo

---

## 🚀 PASO 6: Hacer Nuevo Deployment

Después de rotar todos los secrets:

1. **Haz un nuevo deployment en Vercel:**

   - Puede ser automático si haces push a GitHub
   - O manual desde Vercel Dashboard → **Deployments** → **"Redeploy"**

2. **Verifica que la aplicación funciona:**
   - Abre tu URL de Vercel
   - Prueba login/logout
   - Verifica que las funciones críticas funcionan

---

## ✅ Checklist de Rotación

- [ ] Rotado `SUPABASE_SERVICE_ROLE_KEY` en Supabase Dashboard
- [ ] Actualizado `SUPABASE_SERVICE_ROLE_KEY` en Vercel
- [ ] Generado nuevo `JWT_SECRET`
- [ ] Actualizado `JWT_SECRET` en Vercel
- [ ] Generado nuevo `ENCRYPTION_KEY`
- [ ] Actualizado `ENCRYPTION_KEY` en Vercel
- [ ] Rotado `SMTP_PASS` (si aplica)
- [ ] Actualizado `.env.local` localmente
- [ ] Hecho nuevo deployment en Vercel
- [ ] Verificado que la aplicación funciona correctamente

---

## ⚠️ IMPORTANTE: Después de Rotar

1. **Invalidar sesiones existentes:**

   - Los usuarios deberán hacer login nuevamente
   - Los tokens JWT antiguos ya no funcionarán

2. **Verificar funcionalidad:**

   - Probar autenticación
   - Probar operaciones críticas
   - Verificar que no hay errores en logs

3. **Monitorear:**
   - Revisar logs de Vercel después del deployment
   - Verificar que no hay errores relacionados con autenticación

---

## 🔍 Verificar que los Secrets Están Actualizados

### En Vercel:

1. Ve a: **Settings** → **Environment Variables**
2. Verifica que todos los valores están actualizados
3. Verifica que están disponibles en los ambientes correctos

### En Supabase:

1. Ve a: **Settings** → **API**
2. Verifica que el `service_role` key es diferente al anterior

---

## 📝 Notas Adicionales

- **Nunca compartas los nuevos secrets** públicamente
- **Guarda los nuevos secrets de forma segura** (password manager)
- **Los secrets antiguos ya no funcionarán** después de rotarlos
- **Es normal que los usuarios tengan que hacer login nuevamente**

---

## 🆘 Si Algo Sale Mal

Si después de rotar los secrets la aplicación no funciona:

1. Verifica que los secrets están correctamente configurados en Vercel
2. Verifica que el deployment se completó correctamente
3. Revisa los logs de Vercel para errores específicos
4. Si es necesario, puedes temporalmente revertir a los secrets anteriores (pero esto NO es recomendado por seguridad)

---

## 📚 Referencias

- [Vercel: Rotating Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase: API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Next.js Security Advisory](https://nextjs.org/blog/CVE-2025-66478)
