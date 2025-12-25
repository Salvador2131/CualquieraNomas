# 🔍 Diagnóstico de Conexión GitHub-Vercel

## ❌ Problema

Los deployments automáticos no se están ejecutando cuando haces push a GitHub.

## 🔍 Verificaciones Necesarias

### 1. Verificar en Vercel Dashboard

**URL:** https://vercel.com/dashboard

1. Selecciona proyecto: **cualquiera-nomas**
2. Ve a: **Settings** → **Git**
3. **¿Qué ves?**
   - ✅ **"Connected to GitHub"** con el repositorio → **El problema es otro**
   - ❌ **"Connect Git Repository"** o nada → **Necesitas conectar**

### 2. Verificar Webhooks en GitHub

**URL:** https://github.com/Salvador2131/CualquieraNomas/settings/hooks

1. **¿Hay un webhook de Vercel?**
   - ✅ Sí existe → Verifica que esté activo (última entrega exitosa)
   - ❌ No existe → **Este es el problema**

### 3. Verificar Permisos de GitHub

**URL:** https://github.com/settings/connections/applications

1. Busca **"Vercel"** o **"Vercel Inc"**
2. **¿Está autorizado?**
   - ✅ Sí → Verifica permisos
   - ❌ No → **Necesitas autorizar**

3. **Permisos necesarios:**
   - ✅ Repository access (lectura)
   - ✅ Webhooks (escritura)

## 🛠️ Soluciones por Escenario

### Escenario A: No hay repositorio conectado

**Síntomas:**
- En Vercel Dashboard → Settings → Git → No hay repositorio

**Solución:**
1. Ve a: https://vercel.com/dashboard
2. Proyecto → **Settings** → **Git**
3. Click en **"Connect Git Repository"**
4. Selecciona **GitHub**
5. Autoriza si es necesario
6. Selecciona: **Salvador2131/CualquieraNomas**
7. Click en **"Import"**

### Escenario B: Repositorio conectado pero no hay webhook

**Síntomas:**
- Repositorio conectado en Vercel
- Pero no hay webhook en GitHub

**Solución:**
1. En Vercel Dashboard → **Settings** → **Git**
2. Click en **"Disconnect"**
3. Espera 10 segundos
4. Click en **"Connect Git Repository"** de nuevo
5. Selecciona el mismo repositorio
6. Esto debería crear el webhook automáticamente

### Escenario C: Webhook existe pero está fallando

**Síntomas:**
- Webhook existe en GitHub
- Pero las entregas fallan o no se ejecutan

**Solución:**
1. En GitHub → Settings → Webhooks
2. Click en el webhook de Vercel
3. Ve a **"Recent Deliveries"**
4. **¿Qué ves?**
   - ❌ Errores 401/403 → Problema de permisos
   - ❌ Errores 404 → URL incorrecta
   - ✅ 200 OK → El webhook funciona, el problema es otro

5. **Si hay errores:**
   - Click en **"Redeliver"** en una entrega fallida
   - O regenera el webhook desconectando y reconectando

### Escenario D: Todo está conectado pero no funciona

**Síntomas:**
- Repositorio conectado ✅
- Webhook existe ✅
- Webhook funciona ✅
- Pero no hay deployments automáticos

**Posibles causas:**

1. **Branch incorrecto:**
   - Verifica que Production Branch sea `main`
   - Vercel Dashboard → Settings → Git → Production Branch

2. **Deployments deshabilitados:**
   - Verifica que "Automatic deployments" esté activado
   - Vercel Dashboard → Settings → Git → Automatic deployments

3. **Ignorar commits:**
   - Verifica que no haya reglas que ignoren commits
   - Vercel Dashboard → Settings → Git → Ignored Build Step

4. **Problema de permisos del webhook:**
   - El webhook necesita permisos de "push" events
   - GitHub → Settings → Webhooks → Vercel → Events → Debe incluir "Pushes"

## 🧪 Test de Verificación

### Test 1: Deployment Manual

```bash
vercel --prod
```

**Si funciona:** El problema es solo la integración automática
**Si falla:** Hay un problema más profundo (variables de entorno, build, etc.)

### Test 2: Verificar Webhook Manualmente

1. Ve a: https://github.com/Salvador2131/CualquieraNomas/settings/hooks
2. Click en el webhook de Vercel (si existe)
3. Scroll hasta abajo → **"Recent Deliveries"**
4. Click en la entrega más reciente
5. **¿Qué ves?**
   - ✅ **200 OK** → Webhook funciona
   - ❌ **Error** → Revisa el mensaje de error

### Test 3: Forzar Entrega de Webhook

1. En GitHub → Webhooks → Vercel
2. Click en **"Recent Deliveries"**
3. Selecciona una entrega
4. Click en **"Redeliver"**
5. **¿Se crea un deployment en Vercel?**
   - ✅ Sí → El webhook funciona, el problema puede ser timing
   - ❌ No → El webhook está roto

## 📋 Checklist Completo

- [ ] Repositorio conectado en Vercel Dashboard
- [ ] Webhook existe en GitHub
- [ ] Webhook tiene permisos correctos
- [ ] Webhook está activo (última entrega exitosa)
- [ ] Production Branch configurado como `main`
- [ ] Automatic deployments habilitado
- [ ] No hay reglas que ignoren commits
- [ ] Permisos de GitHub correctos
- [ ] Deployment manual funciona (`vercel --prod`)

## 🚨 Si Nada Funciona

### Opción 1: Recrear Proyecto en Vercel

1. **NO elimines el proyecto actual** (puede perder configuraciones)
2. Crea un **nuevo proyecto** en Vercel
3. Conecta el mismo repositorio de GitHub
4. Configura las variables de entorno
5. Haz un push de prueba

### Opción 2: Usar GitHub Actions para Deploy

Si la integración de Vercel no funciona, puedes usar GitHub Actions:

```yaml
# .github/workflows/deploy-vercel.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

Pero esto requiere configurar secrets adicionales.

## ✅ Solución Recomendada (Más Probable)

**El problema más común:** El proyecto fue creado manualmente con `vercel` CLI y nunca se conectó a GitHub.

**Solución:**
1. Ve a: https://vercel.com/dashboard
2. Proyecto → **Settings** → **Git**
3. Si dice "Not connected" o similar:
   - Click en **"Connect Git Repository"**
   - Selecciona GitHub
   - Selecciona: **Salvador2131/CualquieraNomas**
   - Click en **"Import"**

4. **Después de conectar:**
   - Haz un push de prueba
   - Deberías ver un deployment automático en 10-30 segundos
