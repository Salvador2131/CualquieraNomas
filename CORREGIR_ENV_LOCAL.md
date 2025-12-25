# 🔧 Corregir .env.local - Valores Exactos

## ⚠️ Problema Detectado

El script de verificación mostró que tu `.env.local` tiene la URL de Supabase **incorrecta**:

**❌ Incorrecto (actual):**
```
NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpsniqc.supabase.co
```
(Nota: tiene "gps" en lugar de "gpb")

**✅ Correcto (debe ser):**
```
NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpbsniqc.supabase.co
```
(Nota: debe tener "gpb")

---

## 📝 Valores Correctos para .env.local

Abre tu archivo `.env.local` y asegúrate de que tenga estos valores **exactos**:

```env
# Configuración de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpbsniqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gZ0f-x1z89Xs9LR5mVpYbw_HEaRvjGz
SUPABASE_SERVICE_ROLE_KEY=ADJYApVe1nGwmpkDs6UaDAYPrl4fbBVnudCati08FfiawMgCvdmblJZVFLMD+9f+Uw+k497GmkFjLUV58PQ+aw==

# Configuración de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Configuración de Seguridad
JWT_SECRET=f254a2acda5e3353023c7aab1c06d24299bfffcffe5930e5e7ec4e38768c17c8
ENCRYPTION_KEY=777dd0b344a2b5242169cafa80e7dda9
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
ALERT_EMAIL=admin@ejemplo.com

# Configuración de Email (Opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

---

## ✅ Paso a Paso para Corregir

### 1. Abre .env.local

El archivo está en la raíz del proyecto:
```
c:\Users\Salva\.cursor\CualquieraNomas\.env.local
```

### 2. Busca esta línea:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpsniqc.supabase.co
```

### 3. Cámbiala por:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpbsniqc.supabase.co
```

**⚠️ IMPORTANTE:** Cambia **"gps"** por **"gpb"** en la URL.

### 4. Guarda el archivo

### 5. Verifica que funcionó

Ejecuta:
```bash
node scripts/verificar-conexiones.js
```

**Debería mostrar:**
- ✅ `Conexión Supabase: ✅ OK`
- En lugar de: ❌ `Error al conectar con Supabase`

---

## 🔍 Por Qué el Error de Conexión

El error `getaddrinfo ENOTFOUND hjtarzunzoedgpsniqc.supabase.co` significa que:
- La URL `hjtarzunzoedgpsniqc.supabase.co` **no existe**
- El DNS no puede resolver ese dominio
- Por eso parece un problema de conexión a internet, pero en realidad es la URL incorrecta

**Con la URL correcta** (`hjtarzunzoedgpbsniqc.supabase.co`), la conexión funcionará.

---

## 📋 Checklist

- [ ] Abrir `.env.local`
- [ ] Buscar `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Cambiar `gps` por `gpb` en la URL
- [ ] Guardar el archivo
- [ ] Ejecutar `node scripts/verificar-conexiones.js`
- [ ] Verificar que ahora muestra: ✅ `Conexión Supabase: ✅ OK`

---

**Después de corregir esto, podremos conectar GitHub → Vercel correctamente.**
