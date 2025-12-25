# 🔧 Crear Deploy Hook en Vercel

## ✅ Estado Actual

- ✅ Repositorio conectado: `Salvador2131/CualquieraNomas`
- ❌ Falta el Deploy Hook

---

## 🎯 Solución: Reconectar el Repositorio

La forma más simple de crear el deploy hook es **reconectar el repositorio**. Esto hará que Vercel cree el webhook automáticamente.

---

## 📋 Pasos Detallados

### PASO 1: Desconectar el Repositorio

1. Ve a: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/git

2. Busca el botón **"Disconnect"** o **"Disconnect Repository"**
   - Debería estar cerca del nombre del repositorio conectado
   - Haz clic en él

3. **Confirma la desconexión**
   - Vercel te pedirá confirmación
   - Haz clic en **"Disconnect"** o **"Confirm"**

4. **Espera 10 segundos**
   - Esto asegura que la desconexión se complete

---

### PASO 2: Reconectar el Repositorio

1. **En la misma pantalla**, ahora deberías ver:
   - **"Connect Git Repository"** o botón **"Connect"**
   - Haz clic en él

2. **Selecciona GitHub**
   - Verás opciones: GitHub, GitLab, Bitbucket
   - Haz clic en **"GitHub"**

3. **Selecciona el Repositorio**
   - Busca: **Salvador2131/CualquieraNomas**
   - O usa el buscador para encontrarlo
   - Haz clic en el repositorio

4. **Configurar (si te lo pide)**
   - **Framework Preset:** Next.js (debería detectarse automáticamente)
   - **Root Directory:** Deja vacío o `./`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** Deja vacío (Next.js usa `.next`)
   - **Install Command:** `npm install` (default)

5. **NO necesitas configurar variables de entorno ahora**
   - Ya están configuradas en el proyecto
   - Solo haz clic en **"Deploy"** o **"Import"**

---

### PASO 3: Verificar que se Creó el Deploy Hook

**Espera 1-2 minutos** después de reconectar, luego:

#### Verificación A: En Vercel

1. Ve a: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/git

2. **Deberías ver:**
   ```
   Connected Repository
   Repository: Salvador2131/CualquieraNomas
   Branch: main
   
   Production Branch: main
   
   Deploy Hooks
   Production Deploy Hook:
   https://api.vercel.com/v1/integrations/deploy/...
   [Copy]
   ```

3. **Si ves "Deploy Hooks" con una URL** → ✅ **¡Listo!**

#### Verificación B: En GitHub

1. Ve a: https://github.com/Salvador2131/CualquieraNomas/settings/hooks

2. **Deberías ver:**
   - Un webhook de Vercel
   - URL: `https://api.vercel.com/v1/integrations/deploy/...`
   - Estado: ✅ **Active**
   - Eventos: ✅ Push, ✅ Pull Request

3. **Si ves el webhook** → ✅ **¡Listo!**

---

## ✅ Test Final: Verificar que Funciona

1. **Haz un pequeño cambio:**
   ```bash
   echo "# Test deploy hook" >> README.md
   git add README.md
   git commit -m "test: Verificar deploy hook automático"
   git push origin main
   ```

2. **Deberías ver:**
   - En Vercel Dashboard (dentro de 10-30 segundos): Un nuevo deployment se inicia automáticamente
   - En GitHub → Settings → Hooks → Recent Deliveries: Una entrega con estado **200 OK**

---

## ❌ Si Aún No Aparece el Deploy Hook

### Opción A: Esperar Más Tiempo

- A veces Vercel tarda 2-3 minutos en crear el webhook
- Refresca la página después de esperar

### Opción B: Verificar Permisos de GitHub

1. Ve a: https://github.com/settings/connections/applications
2. Busca **"Vercel"** o **"Vercel Inc"**
3. Verifica que tenga estos permisos:
   - ✅ Repository access (lectura)
   - ✅ **Webhooks (escritura)** ← **IMPORTANTE**
   - ✅ Metadata (lectura)

4. Si falta el permiso de webhooks:
   - Haz clic en **"Configure"** o **"Edit"**
   - Asegúrate de que **"Webhooks"** esté marcado
   - Guarda los cambios
   - Vuelve a reconectar el repositorio

### Opción C: Verificar en GitHub si el Webhook Existe

A veces el webhook se crea pero no se muestra en Vercel:

1. Ve a: https://github.com/Salvador2131/CualquieraNomas/settings/hooks
2. **¿Ves un webhook de Vercel?**
   - Si SÍ → El webhook existe, solo no se muestra en Vercel (esto es raro pero puede pasar)
   - Si NO → Necesitas reconectar (PASO 2)

---

## 🎯 Resultado Esperado

Después de reconectar:

1. ✅ Repositorio conectado en Vercel
2. ✅ Deploy Hook visible en Vercel Settings → Git
3. ✅ Webhook creado automáticamente en GitHub
4. ✅ Deployments automáticos funcionando

---

## 📝 Notas Importantes

- **No perderás deployments existentes** al desconectar y reconectar
- **Las variables de entorno se mantienen** (están en el proyecto, no en la conexión Git)
- **El webhook se crea automáticamente** cuando Vercel conecta un repositorio de GitHub
- **Si el webhook no se crea**, generalmente es un problema de permisos en GitHub

---

**Documento creado:** `CREAR_DEPLOY_HOOK_VERCEL.md`

**Siguiente paso:** 
1. Ve a https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/git
2. Haz clic en "Disconnect"
3. Luego "Connect Git Repository" → GitHub → Salvador2131/CualquieraNomas
4. Verifica que aparezca el Deploy Hook
