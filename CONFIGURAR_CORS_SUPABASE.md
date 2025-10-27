# 🔒 CONFIGURAR CORS EN SUPABASE

## 🎯 PROBLEMA ACTUAL

Tu app en Vercel no puede conectarse a Supabase porque falta configurar CORS.

**Error típico:** "Security information" o "Failed to connect"

---

## ✅ SOLUCIÓN: AGREGAR TU URL EN SUPABASE

### PASO 1: Abrir Supabase

Ve a:

```
https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc/settings/api
```

---

### PASO 2: Buscar Configuración de URLs

En la pantalla verás varias secciones. Busca:

**Opción A: "Site URL"**

- Cambia "Site URL" a tu URL de Vercel
- O busca "Additional Allowed URLs"

**Opción B: "Additional Allowed URLs"** o "CORS Settings"

- Click en "+ Add URL"
- Agrega tu URL de Vercel

---

### PASO 3: Agregar tu URL

**¿Cuál es tu URL de Vercel?**

Debería ser algo como:

```
https://cualquiera-nomas.vercel.app
```

O:

```
https://cualquiera-nomas-xyz123.vercel.app
```

**Copia tu URL exacta** (la que viste después del deploy)

---

### PASO 4: Agregar en Supabase

1. Click en "+ Add URL" o "Add Allowed URL"
2. Pega: `https://tu-url-vercel.app`
3. **También agrega:** `http://localhost:3000`
4. Click en "Save" o "Update"

---

### PASO 5: Esperar y Probar

1. **Espera 30-60 segundos** (CORS puede tardar en activarse)
2. **Refresca tu página de Vercel** (F5 o Ctrl+R)
3. **Debería funcionar ahora** ✅

---

## 🖼️ ¿CÓMO LUCE LA PANTALLA EN SUPABASE?

Deberías ver algo como:

```
Site URL
https://your-app.vercel.app

Allowed URLs
+ Add URL
```

O en español:

```
URL del Sitio
https://tu-app.vercel.app

URLs Permitidas
+ Agregar URL
```

---

## ⚠️ UBICACIÓN ALTERNATIVA

Si no encuentras "Allowed URLs" en la sección API:

1. Ve a: **Settings** (⚙️)
2. Click en **"Auth"** en el menú lateral
3. Busca: **"Site URL"** o **"Redirect URLs"**
4. Agrega tu URL ahí

---

## ✅ VERIFICAR QUE FUNCIONÓ

**Después de configurar:**

1. Espera 1-2 minutos
2. Refresca tu página de Vercel
3. Deberías ver:
   - ✅ Sin errores de seguridad
   - ✅ La página carga normalmente
   - ✅ Puedes hacer login
   - ✅ Dashboard funciona

---

## 🐛 SI AÚN NO FUNCIONA

### Verifica que agregaste:

- ✅ Tu URL completa (con https://)
- ✅ Sin "/" al final
- ✅ Localhost también agregado

### Si persiste:

1. Revisa los logs en Vercel:
   - Vercel → Tu Proyecto → Logs
2. Revisa la consola del navegador:
   - F12 → Console
3. Pega aquí el error que ves

---

## 📝 RESUMEN RÁPIDO

**Ve a:**
https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc/settings/api

**Busca:** "Allowed URLs" o "CORS Settings"

**Agrega:**

1. Tu URL de Vercel
2. http://localhost:3000

**Save** → **Espera 1 minuto** → **Refresca Vercel** → **✅ Listo**

---

**¿Ya fuiste a configurar CORS? ¿Qué pantalla ves en Supabase?**
