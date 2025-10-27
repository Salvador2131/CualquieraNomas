# 🚀 SETUP RÁPIDO DE SUPABASE

## ✅ DATOS DE TU PROYECTO

**Proyecto ID:** `hjtarzunzoedgpsniqc`  
**URL:** `https://hjtarzunzoedgpsniqc.supabase.co`  
**Anon Key:** Ya está en el token que proporcionaste

---

## 📝 PASOS PARA CONFIGURAR

### 1. Crear archivo `.env.local`

Crea el archivo `.env.local` en la raíz del proyecto con este contenido:

```env
# Configuración de Supabase
# Proyecto: hjtarzunzoedgpsniqc

# URL del proyecto de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpsniqc.supabase.co

# Clave pública (anon key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gZ0f-x1z89Xs9LR5mVpYbw_HEaRvjGz

# Clave de servicio (service role key)
SUPABASE_SERVICE_ROLE_KEY=ADJYApVe1nGwmpkDs6UaDAYPrl4fbBVnudCati08FfiawMgCvdmblJZVFLMD+9f+Uw+k497GmkFjLUV58PQ+aw==

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Configuración de Seguridad
JWT_SECRET=cambia-este-valor-por-uno-aleatorio-y-seguro
ENCRYPTION_KEY=cambia-este-valor-por-uno-aleatorio-y-seguro
RATE_LIMIT_ENABLED=true
CORS_ORIGIN=http://localhost:3000

# Configuración de Logging
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_CONSOLE_ENABLED=true

# Configuración de Base de Datos
DB_POOL_SIZE=10
DB_TIMEOUT=30000
DB_RETRY_ATTEMPTS=3

# Configuración de Monitoreo
MONITORING_ENABLED=false
METRICS_ENABLED=false
```

### 2. Obtener Service Role Key

1. Ve a: https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc/settings/api
2. Busca la sección "service_role" key
3. Copia esa key
4. Reemplaza `TU_SERVICE_ROLE_KEY_AQUI` en `.env.local`

### 3. Generar JWT_SECRET y ENCRYPTION_KEY

Ejecuta estos comandos para generar valores seguros:

```bash
# Para JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Para ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copia los valores generados y pégalos en `.env.local`

### 4. Ejecutar Scripts SQL en Supabase

1. Ve a: https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc/editor
2. Abre el SQL Editor
3. Ejecuta en orden:
   - `scripts/create-tables.sql`
   - `scripts/FASE_3_COMPLETA.sql`
   - `scripts/add-unique-salary-constraint.sql`

### 5. Verificar Conexión

```bash
# Reiniciar el servidor de desarrollo
npm run dev
```

Ve a: http://localhost:3000

---

## ⚠️ NOTAS IMPORTANTES

1. **NO subir `.env.local` al repositorio** (ya está en .gitignore)
2. **La Service Role Key es muy sensible** - nunca la compartas
3. **El token que proporcionaste es el anon key** - perfecto para el frontend

---

## 🎯 CHECKLIST

- [ ] Crear `.env.local`
- [ ] Obtener `SUPABASE_SERVICE_ROLE_KEY` del dashboard
- [ ] Generar `JWT_SECRET` y `ENCRYPTION_KEY` seguros
- [ ] Ejecutar scripts SQL en Supabase
- [ ] Reiniciar servidor de desarrollo
- [ ] Verificar que el dashboard carga sin errores

---

## 🔗 ENLACES ÚTILES

- Dashboard de tu proyecto: https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc
- API Settings: https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc/settings/api
- SQL Editor: https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc/editor
