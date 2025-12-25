# 🔗 Conectar GitHub → Vercel - Paso a Paso

## ✅ Estado Actual

- ✅ Cursor → GitHub: CONECTADO
- ✅ Cursor → Supabase: CONECTADO (corregido)
- ❌ GitHub → Vercel: NO CONECTADO ← **SIGUIENTE PASO**

---

## 🎯 Objetivo

Conectar el repositorio de GitHub con Vercel para habilitar deployments automáticos.

---

## 📋 Pasos Detallados

### PASO 1: Ir a Vercel Dashboard

1. Abre tu navegador
2. Ve a: https://vercel.com/dashboard
3. Inicia sesión si es necesario

### PASO 2: Seleccionar Tu Proyecto

1. Busca el proyecto: **cualquiera-nomas**
2. Haz clic en el proyecto para abrirlo

### PASO 3: Ir a Settings → Git

1. En el menú lateral, haz clic en **"Settings"**
2. En el submenú, haz clic en **"Git"**

**URL directa:**
```
https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/git
```

### PASO 4: Verificar Estado Actual

**¿Qué ves en la pantalla?**

**Opción A: "Not connected" o "Connect Git Repository"**
- ✅ Esto es lo que esperamos
- Continúa al PASO 5

**Opción B: Ya hay un repositorio conectado**
- Si es `Salvador2131/CualquieraNomas` → ✅ Ya está conectado
- Si es otro repositorio → Haz clic en **"Disconnect"** y luego continúa

### PASO 5: Conectar Repositorio

1. Haz clic en el botón **"Connect Git Repository"** o **"Connect"**
2. Se abrirá un modal o página nueva

### PASO 6: Seleccionar GitHub

1. Verás opciones: **GitHub**, **GitLab**, **Bitbucket**
2. Haz clic en **"GitHub"**

### PASO 7: Autorizar Vercel (si es necesario)

1. Si GitHub te pide autorización:
   - Haz clic en **"Authorize Vercel"** o **"Grant access"**
   - Selecciona los permisos necesarios
   - Confirma la autorización

2. Si ya está autorizado, verás la lista de repositorios

### PASO 8: Seleccionar Repositorio

1. Busca en la lista: **Salvador2131/CualquieraNomas**
2. O usa el buscador para encontrarlo
3. Haz clic en el repositorio

### PASO 9: Configurar Proyecto

**Framework Preset:**
- Debería detectar automáticamente: **Next.js**
- Si no, selecciona **"Next.js"** manualmente

**Root Directory:**
- Deja vacío o `./` (raíz del proyecto)

**Build Command:**
- Deja el default: `npm run build`

**Output Directory:**
- Deja vacío (Next.js usa `.next` automáticamente)

**Install Command:**
- Deja el default: `npm install`

### PASO 10: Configurar Variables de Entorno

**⚠️ IMPORTANTE:** Configura las variables ANTES de hacer deploy.

1. En la misma pantalla, busca la sección **"Environment Variables"**
2. O haz clic en **"Add Environment Variable"**

**Agregar Variables Públicas (marcar: Production, Preview, Development):**

**Variable 1:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://hjtarzunzoedgpbsniqc.supabase.co`
- ✅ Production
- ✅ Preview
- ✅ Development
- Click en **"Add"**

**Variable 2:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `sb_publishable_gZ0f-x1z89Xs9LR5mVpYbw_HEaRvjGz`
- ✅ Production
- ✅ Preview
- ✅ Development
- Click en **"Add"**

**Agregar Variables Privadas (solo Production):**

**Variable 3:**
- Key: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `ADJYApVe1nGwmpkDs6UaDAYPrl4fbBVnudCati08FfiawMgCvdmblJZVFLMD+9f+Uw+k497GmkFjLUV58PQ+aw==`
- ✅ Production (solo)
- ❌ Preview
- ❌ Development
- Click en **"Add"**

**Variable 4:**
- Key: `JWT_SECRET`
- Value: `f254a2acda5e3353023c7aab1c06d24299bfffcffe5930e5e7ec4e38768c17c8`
- ✅ Production (solo)
- Click en **"Add"**

**Variable 5:**
- Key: `ENCRYPTION_KEY`
- Value: `777dd0b344a2b5242169cafa80e7dda9`
- ✅ Production (solo)
- Click en **"Add"**

### PASO 11: Deploy

1. Después de configurar las variables, haz clic en **"Deploy"** o **"Import"**
2. Vercel comenzará a hacer el primer deployment
3. Esto puede tardar 2-5 minutos

### PASO 12: Verificar que se Creó el Webhook

1. Ve a: https://github.com/Salvador2131/CualquieraNomas/settings/hooks
2. **Deberías ver:**
   - Un webhook de Vercel
   - URL: `https://api.vercel.com/v1/integrations/deploy/...`
   - Estado: Activo
   - Eventos: Push, Pull Request

**Si NO aparece el webhook:**
- Espera 1-2 minutos
- Refresca la página
- Si aún no aparece, ve al PASO 13

### PASO 13: Verificar Deployment

1. Ve a: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/deployments
2. Deberías ver el deployment en progreso o completado
3. Abre el deployment y verifica en **"Build Logs"**:
   - Debe mostrar: `Detected Next.js version: 16.0.10`
   - O: `+ next@16.0.10`

---

## ✅ Verificación Final

### Test 1: Deployment Automático

1. Haz un pequeño cambio:
   ```bash
   echo "# Test deployment automatico" >> README.md
   git add README.md
   git commit -m "test: Verificar deployment automático"
   git push origin main
   ```

2. **Deberías ver:**
   - En GitHub: El commit aparece
   - En Vercel Dashboard (dentro de 10-30 segundos): Un nuevo deployment se inicia automáticamente

### Test 2: Verificar Webhook

1. Ve a: https://github.com/Salvador2131/CualquieraNomas/settings/hooks
2. Haz clic en el webhook de Vercel
3. Ve a **"Recent Deliveries"**
4. Deberías ver entregas recientes con estado **200 OK**

---

## 🎯 Resultado Esperado

Después de completar estos pasos:

1. ✅ Repositorio conectado en Vercel
2. ✅ Webhook creado automáticamente en GitHub
3. ✅ Variables de entorno configuradas
4. ✅ Primer deployment completado
5. ✅ Deployments automáticos funcionando
6. ✅ Next.js 16.0.10 instalándose correctamente

---

## ❌ Si Algo Sale Mal

### Problema: No puedo encontrar el repositorio en Vercel

**Solución:**
- Verifica que estés usando la cuenta correcta de GitHub
- Verifica los permisos de Vercel en GitHub: https://github.com/settings/connections/applications

### Problema: El deployment falla

**Solución:**
- Revisa los Build Logs para ver el error específico
- Verifica que todas las variables de entorno estén configuradas
- Verifica que `package.json` tenga Next.js 16.0.10

### Problema: No se crea el webhook

**Solución:**
- Desconecta y vuelve a conectar el repositorio
- Verifica permisos de Vercel en GitHub

---

**Documento creado:** `CONECTAR_GITHUB_VERCEL_PASO_A_PASO.md`

**Siguiente paso:** Sigue los pasos 1-13 arriba para conectar GitHub con Vercel.
