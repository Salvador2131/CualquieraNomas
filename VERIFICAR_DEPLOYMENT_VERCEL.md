# ✅ Verificar Deployment en Vercel

## 📋 Checklist Post-Deployment

### 1. Verificar que el Deployment se Completó

1. Ve a tu dashboard de Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Verifica que el último deployment tenga estado **"Ready"** ✅
4. Si hay errores, revisa los logs del build

### 2. Verificar Variables de Entorno en Vercel

**IMPORTANTE:** Las variables de entorno deben estar configuradas en Vercel:

1. Ve a: **Settings** → **Environment Variables**
2. Verifica que estas variables estén configuradas:

#### Variables Requeridas:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` = `https://hjtarzunzoedgpbsniqc.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_gZ0f-x1z89Xs9LR5mVpYbw_HEaRvjGz`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = (tu service role key)
- ✅ `JWT_SECRET` = (tu JWT secret)
- ✅ `ENCRYPTION_KEY` = (tu encryption key)

#### Variables Opcionales (pero recomendadas):
- `NEXT_PUBLIC_APP_URL` = (tu URL de Vercel, ej: `https://tu-proyecto.vercel.app`)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (si usas email)

**⚠️ IMPORTANTE:**
- Las variables que empiezan con `NEXT_PUBLIC_` deben estar disponibles en **Production**, **Preview**, y **Development**
- Las demás variables solo necesitan estar en **Production**

### 3. Verificar que la Aplicación Funciona

#### Paso 1: Abrir la URL de Vercel
1. Ve a tu proyecto en Vercel
2. Click en el dominio (ej: `https://tu-proyecto.vercel.app`)
3. Debería cargar la página principal

#### Paso 2: Verificar Endpoint de Health
Abre en el navegador:
```
https://tu-proyecto.vercel.app/api/health/supabase
```

**Debería devolver:**
```json
{
  "status": "success",
  "message": "Conexión exitosa con Supabase",
  "connected": true
}
```

#### Paso 3: Verificar Dashboard API
Abre en el navegador:
```
https://tu-proyecto.vercel.app/api/dashboard
```

**Debería devolver:**
```json
{
  "users": { "total": 0, "workers": 0, "employers": 0 },
  "events": { "total": 0, "active": 0, "completed": 0, "averageBudget": 0 },
  "revenue": { "total": 0, "employerSpent": 0 },
  "ratings": { "averageWorker": 0 },
  "error": false,
  "message": "Dashboard stats loaded",
  "connected": true
}
```

### 4. Verificar Logs de Vercel

Si hay errores:

1. Ve a: **Deployments** → Selecciona el último deployment
2. Click en **"View Function Logs"** o **"View Build Logs"**
3. Revisa los errores y advertencias

### 5. Problemas Comunes

#### Error: "Environment variable not found"
**Solución:**
- Ve a Settings → Environment Variables
- Agrega las variables faltantes
- Haz un nuevo deployment

#### Error: "404 Not Found" en `/api/dashboard`
**Posibles causas:**
1. El build falló
2. Las variables de entorno no están configuradas
3. El servidor necesita reiniciarse

**Solución:**
- Verifica los logs del build
- Verifica que las variables de entorno estén configuradas
- Haz un nuevo deployment

#### Error: "Failed to connect to Supabase"
**Solución:**
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` sea correcta
- Verifica que `NEXT_PUBLIC_SUPABASE_ANON_KEY` sea correcta
- Verifica que el proyecto de Supabase esté activo (no pausado)

### 6. Verificar Migraciones en Supabase

Las migraciones deberían haberse aplicado automáticamente con GitHub Actions.

**Verificar:**
1. Ve a Supabase Dashboard → **Database** → **Migrations**
2. Verifica que todas las migraciones estén aplicadas
3. Si faltan migraciones, ejecútalas manualmente o espera a que GitHub Actions las aplique

### 7. Próximos Pasos

Una vez verificado que todo funciona:

1. ✅ **Probar el dashboard** en producción
2. ✅ **Probar autenticación** (login/logout)
3. ✅ **Verificar que las migraciones estén aplicadas**
4. ✅ **Probar endpoints críticos** (`/api/dashboard`, `/api/health/supabase`)

## 🔍 Comandos Útiles

### Ver logs en tiempo real:
```bash
# Si tienes Vercel CLI instalado
vercel logs --follow
```

### Verificar variables de entorno:
```bash
# En Vercel Dashboard
Settings → Environment Variables
```

### Forzar nuevo deployment:
```bash
# Hacer un cambio pequeño y push
git commit --allow-empty -m "trigger deployment"
git push origin main
```

## 📝 Notas

- El `vercel.json` está configurado con las variables de entorno usando `@` (Vercel Secrets)
- Si usas Vercel Secrets, asegúrate de crearlos primero en Vercel Dashboard
- Las migraciones se aplican automáticamente con GitHub Actions cuando haces push
