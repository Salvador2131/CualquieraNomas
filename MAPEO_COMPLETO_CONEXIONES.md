# 🔗 Mapeo Completo de Conexiones: Cursor → GitHub → Vercel → Supabase

## 📊 Diagrama de Conexiones

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
│ Cursor  │ ──────> │ GitHub  │ ──────> │ Vercel  │ ──────> │ Supabase│
│  (IDE)  │  Push   │ (Repo)  │  Webhook│ (Host)  │  API    │  (DB)   │
└─────────┘         └─────────┘         └─────────┘         └─────────┘
     │                   │                    │                    │
     │                   │                    │                    │
     └───────────────────┴────────────────────┴────────────────────┘
                    GitHub Actions (CI/CD)
```

---

## 1️⃣ CONEXIÓN: Cursor → GitHub

### 1.1 Configuración Actual

**Repositorio Remoto:**
```
Origin: https://github.com/Salvador2131/CualquieraNomas.git
```

**Branch Principal:**
```
main (local y remoto)
```

### 1.2 Verificar Conexión

**Comando:**
```bash
git remote -v
git branch -a
git status
```

**Debería mostrar:**
- ✅ `origin` apunta a GitHub
- ✅ Branch `main` existe
- ✅ Sin errores de conexión

### 1.3 Autenticación

**Método:** HTTPS (con credenciales de GitHub)
- Usuario: Salvador2131
- Repositorio: CualquieraNomas

**Verificar:**
```bash
git ls-remote origin
```

Si funciona → ✅ Conexión OK
Si falla → ❌ Problema de autenticación

---

## 2️⃣ CONEXIÓN: GitHub → Vercel

### 2.1 Estado Actual

**⚠️ PROBLEMA IDENTIFICADO:**
- No hay webhook configurado en GitHub
- No hay deployments automáticos cuando haces push

### 2.2 Verificar Webhook en GitHub

**URL:** https://github.com/Salvador2131/CualquieraNomas/settings/hooks

**¿Qué buscar?**
- Webhook de Vercel con URL: `https://api.vercel.com/v1/integrations/deploy/...`
- Estado: Activo
- Eventos: Push, Pull Request

**Si NO existe:**
- ❌ Esta es la razón por la que no hay deployments automáticos
- Necesitas conectar el repositorio en Vercel Dashboard

### 2.3 Verificar Conexión en Vercel

**URL:** https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/git

**¿Qué buscar?**
- Repositorio conectado: `Salvador2131/CualquieraNomas`
- Production Branch: `main`
- Automatic Deployments: Habilitado

**Si NO está conectado:**
1. Click en **"Connect Git Repository"**
2. Selecciona **GitHub**
3. Selecciona: **Salvador2131/CualquieraNomas**
4. Esto creará el webhook automáticamente

---

## 3️⃣ CONEXIÓN: Vercel → Supabase

### 3.1 Variables de Entorno en Vercel

**URL:** https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/environment-variables

**Variables Requeridas:**

#### Públicas (Production, Preview, Development):
- `NEXT_PUBLIC_SUPABASE_URL` = `https://hjtarzunzoedgpbsniqc.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_gZ0f-x1z89Xs9LR5mVpYbw_HEaRvjGz`

#### Privadas (Solo Production):
- `SUPABASE_SERVICE_ROLE_KEY` = `ADJYApVe1nGwmpkDs6UaDAYPrl4fbBVnudCati08FfiawMgCvdmblJZVFLMD+9f+Uw+k497GmkFjLUV58PQ+aw==`

### 3.2 Verificar Conexión

**Endpoint de Health:**
```
https://cualquiera-nomas-salvador-berniers-projects.vercel.app/api/health/supabase
```

**Debería devolver:**
```json
{
  "status": "success",
  "message": "Conexión exitosa con Supabase",
  "connected": true
}
```

### 3.3 Configuración en Código

**Archivo:** `lib/supabase.ts`
- Usa `NEXT_PUBLIC_SUPABASE_URL`
- Usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Archivo:** `lib/config/env.ts`
- Valida todas las variables de entorno
- Proporciona acceso centralizado

---

## 4️⃣ CONEXIÓN: GitHub → Supabase (GitHub Actions)

### 4.1 Workflow Configurado

**Archivo:** `.github/workflows/supabase-migrations.yml`

**Se ejecuta cuando:**
- Push a `main` o `develop`
- Y hay cambios en `supabase/migrations/**`

### 4.2 Secrets Requeridos en GitHub

**URL:** https://github.com/Salvador2131/CualquieraNomas/settings/secrets/actions

**Secrets Necesarios:**
1. `SUPABASE_ACCESS_TOKEN` - Token de acceso de Supabase
2. `SUPABASE_PROJECT_REF` - `hjtarzunzoedgpbsniqc`
3. `SUPABASE_DB_PASSWORD` - Contraseña de la base de datos (opcional)

### 4.3 Verificar que Funciona

**URL:** https://github.com/Salvador2131/CualquieraNomas/actions

**Busca:**
- Workflow: **"Supabase Migrations"**
- Última ejecución
- Estado: ✅ Success o ❌ Failed

**Si no se ejecuta:**
- Verifica que los secrets estén configurados
- Verifica que haya cambios en `supabase/migrations/**`

---

## 5️⃣ CONEXIÓN: Cursor → Supabase (Local)

### 5.1 Variables de Entorno Locales

**Archivo:** `.env.local` (no está en git, solo local)

**Valores desde `env.local.example`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpbsniqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gZ0f-x1z89Xs9LR5mVpYbw_HEaRvjGz
SUPABASE_SERVICE_ROLE_KEY=ADJYApVe1nGwmpkDs6UaDAYPrl4fbBVnudCati08FfiawMgCvdmblJZVFLMD+9f+Uw+k497GmkFjLUV58PQ+aw==
```

### 5.2 Supabase CLI (Opcional)

**Configuración:** `supabase/config.toml`
- Project ID: Configurado con `supabase link`
- Local development: Puerto 54321

**Verificar:**
```bash
supabase status
```

---

## 📋 Checklist de Verificación Completa

### Cursor → GitHub
- [ ] `git remote -v` muestra GitHub correcto
- [ ] `git push origin main` funciona
- [ ] Branch `main` está sincronizado

### GitHub → Vercel
- [ ] Webhook existe en GitHub (Settings → Webhooks)
- [ ] Webhook está activo (última entrega exitosa)
- [ ] Repositorio conectado en Vercel Dashboard
- [ ] Production Branch configurado como `main`
- [ ] Automatic Deployments habilitado
- [ ] Push a GitHub crea deployment automático en Vercel

### Vercel → Supabase
- [ ] Variables de entorno configuradas en Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_URL` correcta
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` correcta
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (solo Production)
- [ ] Endpoint `/api/health/supabase` responde correctamente
- [ ] La app en Vercel se conecta a Supabase

### GitHub → Supabase (GitHub Actions)
- [ ] Workflow existe: `.github/workflows/supabase-migrations.yml`
- [ ] Secrets configurados en GitHub:
  - [ ] `SUPABASE_ACCESS_TOKEN`
  - [ ] `SUPABASE_PROJECT_REF`
  - [ ] `SUPABASE_DB_PASSWORD` (opcional)
- [ ] Workflow se ejecuta cuando hay cambios en migraciones
- [ ] Última ejecución fue exitosa

### Cursor → Supabase (Local)
- [ ] `.env.local` existe y tiene valores correctos
- [ ] `npm run dev` funciona localmente
- [ ] `/api/health/supabase` responde en localhost
- [ ] Supabase CLI configurado (si se usa)

---

## 🔍 Comandos de Verificación Rápida

### Verificar Cursor → GitHub
```bash
git remote -v
git status
git log --oneline -5
```

### Verificar GitHub → Vercel
```bash
# Ver webhooks en GitHub (manual)
# https://github.com/Salvador2131/CualquieraNomas/settings/hooks

# Ver deployments en Vercel
vercel ls
```

### Verificar Vercel → Supabase
```bash
# Verificar endpoint de health
curl https://cualquiera-nomas-salvador-berniers-projects.vercel.app/api/health/supabase
```

### Verificar GitHub → Supabase
```bash
# Ver workflow runs
# https://github.com/Salvador2131/CualquieraNomas/actions
```

### Verificar Cursor → Supabase (Local)
```bash
# Verificar variables de entorno
node scripts/verificar-conexiones.js

# Verificar conexión
npm run dev
# Visitar: http://localhost:3000/api/health/supabase
```

---

## 🛠️ Script de Verificación Automática

**Ejecutar:**
```bash
node scripts/verificar-conexiones.js
```

**Verifica:**
- ✅ Variables de entorno locales
- ✅ Conexión con Supabase
- ✅ Conexión con Vercel (si proporcionas URL)

---

## ⚠️ Problemas Identificados

### 1. GitHub → Vercel: NO CONECTADO
**Problema:** No hay webhook, no hay deployments automáticos
**Solución:** Conectar repositorio en Vercel Dashboard

### 2. Vercel: Advertencias de Versión Vulnerable
**Problema:** Vercel detecta versión vulnerable aunque el código tiene 16.0.10
**Posibles causas:**
- Cache de build
- Deployment anterior aún activo
- package-lock.json desincronizado

**Solución:** Ver `RESOLVER_ADVERTENCIAS_VERCEL.md`

---

## 📝 URLs Importantes

### GitHub
- Repositorio: https://github.com/Salvador2131/CualquieraNomas
- Settings: https://github.com/Salvador2131/CualquieraNomas/settings
- Webhooks: https://github.com/Salvador2131/CualquieraNomas/settings/hooks
- Secrets: https://github.com/Salvador2131/CualquieraNomas/settings/secrets/actions
- Actions: https://github.com/Salvador2131/CualquieraNomas/actions

### Vercel
- Dashboard: https://vercel.com/dashboard
- Proyecto: https://vercel.com/salvador-berniers-projects/cualquiera-nomas
- Settings: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings
- Git Settings: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/git
- Environment Variables: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/environment-variables
- Deployments: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/deployments
- Security Actions: https://vercel.com/dashboard/security-actions

### Supabase
- Dashboard: https://supabase.com/dashboard
- Proyecto: https://supabase.com/dashboard/project/hjtarzunzoedgpbsniqc
- API Settings: https://supabase.com/dashboard/project/hjtarzunzoedgpbsniqc/settings/api
- Database: https://supabase.com/dashboard/project/hjtarzunzoedgpbsniqc/editor

---

## 🎯 Próximos Pasos Recomendados

1. **Conectar GitHub → Vercel** (PRIORIDAD ALTA)
   - Esto habilitará deployments automáticos
   - Creará el webhook automáticamente

2. **Verificar Variables de Entorno en Vercel**
   - Asegurar que todas estén configuradas
   - Verificar valores correctos

3. **Verificar GitHub Actions Secrets**
   - Asegurar que migraciones se ejecuten automáticamente

4. **Resolver Advertencias de Vercel**
   - Limpiar cache
   - Hacer nuevo deployment
   - Verificar versión correcta

---

**Documento creado:** `MAPEO_COMPLETO_CONEXIONES.md`
