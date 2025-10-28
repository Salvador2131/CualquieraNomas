# 🔒 CONFIGURAR CORS EN SUPABASE - PASO A PASO

## 🎯 OBJETIVO

Permitir que tu app en Vercel se conecte a Supabase

---

## 📋 PASOS (CLICK POR CLICK)

### PASO 1: Abrir Supabase

```
Ve a: https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc
```

### PASO 2: Ir a Settings

1. En el menú lateral izquierdo
2. Click en el ícono **⚙️** que dice **"Settings"**

### PASO 3: Ir a API

1. En el submenú de Settings
2. Click en **"API"**

### PASO 4: Buscar "API Settings"

En la página verás varias secciones. Busca:

- **"API Settings"** o **"Configuration"**
- O scroll down y busca: **"Additional Allowed URLs"** o **"Allowed URLs"**

### PASO 5: Agregar tu URL de Vercel

**Necesitas tu URL de Vercel** (la que obtuviste después del deploy).

Si no la tienes:

1. Ve a https://vercel.com/dashboard
2. Click en tu proyecto
3. Verás algo como: "Visit: https://cualquiera-nomas.vercel.app"
4. Copia esa URL

**Luego:**

1. En Supabase, click en **"+ Add URL"** o similar
2. Pega tu URL de Vercel: `https://tu-proyecto.vercel.app`
3. **También agrega:** `http://localhost:3000` (para desarrollo local)
4. Click en **"Save"** o **"Update"**

### PASO 6: Esperar

- Espera 30-60 segundos
- CORS puede tardar en activarse

### PASO 7: Probar

1. Ve a tu URL de Vercel
2. Ve a `/employers`
3. Click en "Nuevo Empleador"
4. Debería funcionar ✅

---

## 📸 QUÉ BUSCAR EN LA PANTALLA

En Supabase Settings → API, deberías ver algo como:

```
API Settings
─────────────────
Site URL
https://your-app.vercel.app
[Change URL]

Additional URLs
+ Add URL
```

---

## ⚠️ SI NO VES "Additional URLs"

Busca en la pantalla:

- "CORS Settings"
- "Allowed Origins"
- "Authorized URLs"
- "Configuration"

Cualquiera de esos nombres sirve.

---

## ✅ DESPUÉS DE CONFIGURAR CORS

Tu app debería:

- ✅ Cargar sin errores de seguridad
- ✅ Permite crear/editar/eliminar empleadores
- ✅ Las APIs funcionan correctamente
- ✅ Todo conectado a Supabase

---

## 🚨 SI AÚN NO FUNCIONA

1. **Verifica que guardaste los cambios** en Supabase
2. **Espera 1-2 minutos** (CORS puede tardar)
3. **Refresca** tu página de Vercel (F5)
4. **Revisa la consola del navegador** (F12 → Console)
5. **Comparte el error** que ves y te ayudo

---

**¿Ya configuraste CORS? ¿Te apareció algún error?**

Dime qué pasó y te ayudo a solucionarlo.
