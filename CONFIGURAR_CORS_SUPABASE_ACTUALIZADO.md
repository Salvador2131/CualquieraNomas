# 🔒 CONFIGURAR CORS EN SUPABASE - GUÍA ACTUALIZADA

## 🎯 UBICACIÓN REAL EN SUPABASE

En Supabase, la configuración de CORS cambió según la versión. Aquí están todas las ubicaciones posibles:

---

## 📍 UBICACIÓN 1: Authentication → URL Configuration

### Pasos:
1. Ve a: https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc
2. En el menú lateral, click en **"Authentication"** (no Settings)
3. Luego click en **"URL Configuration"** (en el submenú)
4. Ahí verás:
   - **Site URL**
   - **Redirect URLs**
5. **Agrega tu URL de Vercel** en "Redirect URLs" o cambia "Site URL"

---

## 📍 UBICACIÓN 2: Settings → API → API Settings

### Pasos:
1. Click en **Settings** ⚙️
2. Click en **"API"**
3. En la sección **"Project Settings"** busca:
   - **"API Settings"**
   - **"Project URL"**
4. Cambia el **"API URL"** o busca **"Additional URLs"**

---

## 📍 UBICACIÓN 3: Project Settings → General

### Pasos:
1. Settings → **"General"** (no API)
2. Busca sección de **"URLs"** o **"Configuration"**
3. Ahí debería aparecer configuración de URLs permitidas

---

## 📍 UBICACIÓN 4: Authentication → Policies (NO es la correcta)

Si ves "Policies", esa NO es la configuración de CORS, esa es para Row Level Security.

---

## 🔧 SOLUCIÓN ALTERNATIVA: Usar Supabase Client Directo

Si no encuentras la configuración, podemos implementar CORS desde el código usando headers correctos en las llamadas a Supabase.

---

## 📸 DESCRIPCIÓN DE LO QUE DEBES VER

En **Authentication → URL Configuration** deberías ver algo como:

```
Site URL
https://your-app.vercel.app
[Change]

Additional Redirect URLs
+ Add URL
http://localhost:3000
[+ Add URL]
```

---

## ⚠️ SOLUCIÓN RÁPIDA

Si aún no lo encuentras:

**Opción A:** Busca la palabra "URL" en cualquiera de las pestañas de Settings

**Opción B:** Busca "Configuration" en Authentication

**Opción C:** Dime qué pantallas ves en Supabase y te guío exactamente

---

**¿En qué pantalla estás? ¿Qué pestañas o secciones ves?**

Dime qué ves y te doy los pasos exactos.

