# ✅ Verificar Conexión GitHub ↔ Vercel

## 🎯 Objetivo

Verificar que la conexión entre GitHub y Vercel esté funcionando correctamente y que los deployments automáticos se ejecuten.

---

## 📋 Checklist de Verificación

### ✅ PASO 1: Verificar Webhook en GitHub

1. **Ve a la configuración de Webhooks:**
   - URL: https://github.com/Salvador2131/CualquieraNomas/settings/hooks

2. **Verifica que el webhook existe:**
   - ✅ Deberías ver un webhook con URL de Vercel
   - ✅ Estado: **Active** (verde)
   - ✅ URL: `https://api.vercel.com/v1/integrations/deploy/...`

3. **Verifica los eventos configurados:**
   - ✅ Debe tener: **Push** (marcado)
   - ✅ Opcional: **Pull Request** (para preview deployments)

4. **Verifica la última entrega:**
   - Haz clic en el webhook
   - Ve a la pestaña **"Recent Deliveries"**
   - **Deberías ver:**
     - Una entrega reciente (si acabas de crear el webhook, puede haber un "ping")
     - Estado: ✅ **200 OK** (verde)
     - Si ves ❌ rojo, hay un problema

---

### ✅ PASO 2: Verificar Deploy Hook en Vercel

1. **Ve a la configuración de Git en Vercel:**
   - URL: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/git

2. **Verifica que el repositorio esté conectado:**
   - ✅ Deberías ver: **Connected Repository**
   - ✅ Repository: `Salvador2131/CualquieraNomas`
   - ✅ Branch: `main`

3. **Verifica que el Deploy Hook exista:**
   - ✅ Deberías ver la sección **"Deploy Hooks"**
   - ✅ Debería mostrar una URL: `https://api.vercel.com/v1/integrations/deploy/...`
   - ✅ Esta URL debe coincidir con la del webhook en GitHub

---

### ✅ PASO 3: Test de Deployment Automático

**Esta es la prueba más importante** - verificar que un push a GitHub active un deployment en Vercel.

#### Opción A: Hacer un Push de Prueba

1. **Haz un pequeño cambio en tu código:**
   ```bash
   echo "# Test conexión GitHub-Vercel - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" >> README.md
   git add README.md
   git commit -m "test: Verificar conexión GitHub-Vercel"
   git push origin main
   ```

2. **Verifica en GitHub (inmediatamente):**
   - Ve a: https://github.com/Salvador2131/CualquieraNomas/commits/main
   - Deberías ver tu commit aparecer

3. **Verifica en Vercel (dentro de 10-30 segundos):**
   - Ve a: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/deployments
   - **Deberías ver:**
     - Un nuevo deployment iniciándose automáticamente
     - Estado: **Building** o **Queued**
     - Source: **GitHub** (no "CLI" o "Manual")
     - Branch: **main**
     - Commit: Tu commit reciente

4. **Espera a que termine el deployment:**
   - El deployment puede tardar 1-3 minutos
   - Estado final: ✅ **Ready** (verde)

#### Opción B: Verificar Webhook Delivery en GitHub

1. **Ve a:**
   - https://github.com/Salvador2131/CualquieraNomas/settings/hooks

2. **Haz clic en el webhook de Vercel**

3. **Ve a la pestaña "Recent Deliveries"**

4. **Después de hacer un push, deberías ver:**
   - Una nueva entrega (delivery)
   - **Request:**
     - Event: `push`
     - Status: ✅ **200 OK**
   - **Response:**
     - Status: ✅ **200 OK**
     - Tiempo de respuesta: < 1 segundo

5. **Si ves un error:**
   - ❌ **404 Not Found** → La URL del deploy hook es incorrecta
   - ❌ **401 Unauthorized** → Problema de autenticación
   - ❌ **500 Internal Server Error** → Problema en Vercel

---

### ✅ PASO 4: Verificar Configuración del Proyecto en Vercel

1. **Ve a:**
   - https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/general

2. **Verifica la configuración:**
   - ✅ **Framework Preset:** Next.js
   - ✅ **Root Directory:** `./` (o vacío)
   - ✅ **Build Command:** `npm run build` (o el default)
   - ✅ **Output Directory:** Vacío (Next.js usa `.next`)
   - ✅ **Install Command:** `npm install` (o el default)

3. **Verifica el Production Branch:**
   - Ve a: Settings → Git
   - ✅ **Production Branch:** `main`

---

### ✅ PASO 5: Verificar Variables de Entorno en Vercel

1. **Ve a:**
   - https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/environment-variables

2. **Verifica que todas las variables estén configuradas:**

   **Variables Públicas (Production, Preview, Development):**
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   **Variables Privadas (solo Production):**
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `JWT_SECRET`
   - ✅ `ENCRYPTION_KEY`

3. **Si faltan variables:**
   - Agrégalas siguiendo `VALORES_VARIABLES_ENTORNO_VERCEL.md`

---

## 🧪 Test Completo: Simular un Deployment Real

### Test 1: Push a Main Branch

```bash
# Crear un cambio pequeño
echo "<!-- Test deployment automático -->" >> app/layout.tsx
git add app/layout.tsx
git commit -m "test: Verificar deployment automático desde GitHub"
git push origin main
```

**Resultado esperado:**
- ✅ En Vercel: Nuevo deployment se inicia automáticamente
- ✅ En GitHub: Webhook delivery con estado 200 OK
- ✅ Deployment completa exitosamente

### Test 2: Crear un Pull Request

1. **Crea una nueva branch:**
   ```bash
   git checkout -b test-preview-deployment
   echo "# Preview Deployment Test" >> README.md
   git add README.md
   git commit -m "test: Preview deployment"
   git push origin test-preview-deployment
   ```

2. **Crea un Pull Request en GitHub:**
   - Ve a: https://github.com/Salvador2131/CualquieraNomas/pulls
   - Haz clic en "New Pull Request"
   - Selecciona: `test-preview-deployment` → `main`
   - Haz clic en "Create Pull Request"

3. **Verifica en Vercel:**
   - Ve a: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/deployments
   - **Deberías ver:**
     - Un nuevo deployment de preview
     - Branch: `test-preview-deployment`
     - Tipo: **Preview** (no Production)

---

## ✅ Indicadores de Éxito

### ✅ Todo Funciona Correctamente Si:

1. **En GitHub:**
   - ✅ Webhook existe y está activo
   - ✅ Últimas entregas muestran estado 200 OK
   - ✅ Los pushes aparecen en "Recent Deliveries"

2. **En Vercel:**
   - ✅ Repositorio conectado
   - ✅ Deploy Hook configurado
   - ✅ Cada push a `main` crea un deployment automático
   - ✅ Los deployments completan exitosamente
   - ✅ Los deployments muestran "Source: GitHub"

3. **En el Deployment:**
   - ✅ Estado: **Ready** (verde)
   - ✅ Build logs no muestran errores
   - ✅ La aplicación funciona en la URL de Vercel

---

## ❌ Problemas Comunes y Soluciones

### Problema 1: El Webhook No Se Dispara

**Síntomas:**
- Haces push pero no aparece deployment en Vercel
- En GitHub → Webhooks → Recent Deliveries: No hay entregas nuevas

**Soluciones:**
1. Verifica que el webhook esté activo en GitHub
2. Verifica que la URL del webhook sea correcta
3. Verifica que estés haciendo push a la branch `main`
4. Revisa los logs del webhook en GitHub para ver errores

### Problema 2: El Webhook Falla (Error 404 o 401)

**Síntomas:**
- En GitHub → Webhooks → Recent Deliveries: Estado ❌ rojo
- Error: 404 Not Found o 401 Unauthorized

**Soluciones:**
1. Verifica que la URL del deploy hook sea correcta
2. Verifica que el deploy hook exista en Vercel
3. Elimina y vuelve a crear el webhook en GitHub

### Problema 3: El Deployment Se Inicia Pero Falla

**Síntomas:**
- El deployment se crea pero falla durante el build
- Build logs muestran errores

**Soluciones:**
1. Revisa los Build Logs en Vercel
2. Verifica que todas las variables de entorno estén configuradas
3. Verifica que `package.json` tenga las dependencias correctas
4. Verifica que Next.js esté en la versión 16.0.10

### Problema 4: Los Deployments No Son Automáticos

**Síntomas:**
- Los deployments solo se crean manualmente
- No aparecen automáticamente al hacer push

**Soluciones:**
1. Verifica que el repositorio esté conectado en Vercel
2. Verifica que el webhook esté activo en GitHub
3. Verifica que estés haciendo push a la branch correcta (`main`)
4. Verifica que "Automatic deployments" esté habilitado en Vercel

---

## 📊 Resumen de Verificación

**Después de completar todos los pasos, deberías tener:**

- ✅ Webhook configurado en GitHub
- ✅ Deploy Hook configurado en Vercel
- ✅ Repositorio conectado en Vercel
- ✅ Variables de entorno configuradas
- ✅ Push a `main` crea deployment automático
- ✅ Pull Request crea preview deployment
- ✅ Deployments completan exitosamente

---

## 🎯 Próximos Pasos

Una vez verificado que todo funciona:

1. ✅ **Deployments automáticos funcionando**
2. ✅ **Cada push a `main` → Production deployment**
3. ✅ **Cada PR → Preview deployment**
4. ✅ **No necesitas hacer `vercel --prod` manualmente**

---

**Documento creado:** `VERIFICAR_CONEXION_GITHUB_VERCEL.md`

**Siguiente paso:** 
1. Haz un push de prueba
2. Verifica que aparezca un deployment en Vercel automáticamente
3. Revisa los logs del webhook en GitHub
