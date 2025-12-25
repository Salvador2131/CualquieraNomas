# 🔗 Conectar GitHub con Vercel para Deployments Automáticos

## ❌ Problema Actual

Vercel no está haciendo deployments automáticos cuando haces push a GitHub porque **no hay integración activa** entre GitHub y Vercel.

## ✅ Solución: Conectar Repositorio en Vercel Dashboard

### Paso 1: Ve a Vercel Dashboard

1. Ve a: https://vercel.com/dashboard
2. Inicia sesión con tu cuenta
3. Busca el proyecto: **cualquiera-nomas**

### Paso 2: Verificar Conexión con GitHub

1. En tu proyecto, ve a: **Settings** → **Git**
2. Verifica si hay un repositorio conectado

**Si NO hay repositorio conectado:**

### Paso 3: Conectar Repositorio

1. En **Settings** → **Git**, haz clic en **"Connect Git Repository"**
2. Selecciona **GitHub**
3. Autoriza a Vercel a acceder a tus repositorios (si es necesario)
4. Busca y selecciona: **Salvador2131/CualquieraNomas**
5. Haz clic en **"Import"** o **"Connect"**

### Paso 4: Configurar Branch de Producción

1. En **Settings** → **Git** → **Production Branch**
2. Asegúrate de que esté configurado como: **main**
3. Guarda los cambios

### Paso 5: Verificar Webhooks

1. Ve a: https://github.com/Salvador2131/CualquieraNomas/settings/hooks
2. Deberías ver un webhook de Vercel
3. Si no existe, Vercel lo creará automáticamente al conectar

## 🚀 Verificar que Funciona

### Opción 1: Hacer un Push de Prueba

```bash
# Haz un pequeño cambio
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: Verificar deployment automático"
git push origin main
```

**Deberías ver:**
- En GitHub: El commit aparece
- En Vercel Dashboard: Un nuevo deployment se inicia automáticamente (dentro de 10-30 segundos)

### Opción 2: Verificar en Vercel Dashboard

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a la pestaña **"Deployments"**
4. Deberías ver deployments automáticos cuando haces push

## 🔍 Si Aún No Funciona

### Verificar Permisos de GitHub

1. Ve a: https://github.com/settings/connections/applications
2. Busca **Vercel**
3. Verifica que tenga permisos para:
   - ✅ Leer repositorios
   - ✅ Escribir webhooks
   - ✅ Acceder a metadata

### Verificar Configuración del Proyecto

1. En Vercel Dashboard → Tu proyecto → **Settings** → **General**
2. Verifica:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raíz)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (o dejar vacío para Next.js)

### Forzar Reconexión

1. En Vercel Dashboard → **Settings** → **Git**
2. Haz clic en **"Disconnect"** (si hay algo conectado)
3. Luego **"Connect Git Repository"** de nuevo
4. Selecciona el repositorio otra vez

## 📋 Checklist de Verificación

- [ ] Repositorio conectado en Vercel Dashboard
- [ ] Branch de producción configurado como `main`
- [ ] Webhook de Vercel existe en GitHub
- [ ] Permisos de GitHub correctos
- [ ] Hacer push y verificar que se inicia deployment automático

## 🎯 Resultado Esperado

Después de conectar:

1. **Cada push a `main`** → Deployment automático en Vercel
2. **Cada PR** → Preview deployment automático
3. **Deployments aparecen en Vercel Dashboard** automáticamente
4. **No necesitas hacer `vercel --prod` manualmente**

---

**Nota:** Si el proyecto ya estaba conectado pero no funcionaba, puede ser que el webhook esté roto. En ese caso, desconecta y vuelve a conectar.
