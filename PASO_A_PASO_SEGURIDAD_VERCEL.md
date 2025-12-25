# 🛡️ Paso a Paso: Seguridad en Vercel

## ✅ PASO 1: Verificar Versión de Next.js (LOCAL)

**Estado actual:**
- Next.js: `16.0.10` ✅ (versión parcheada)
- Verificado con `npx fix-react2shell-next`: ✅ No vulnerable

**Acción:** ✅ Ya está correcto, no necesitas hacer nada aquí.

---

## ✅ PASO 2: Security Actions Dashboard

### 2.1 Acceder al Dashboard

1. Ve a: https://vercel.com/dashboard/security-actions
2. O desde tu proyecto: **Settings** → **Security**

### 2.2 Revisar Problemas de Seguridad

**¿Qué buscar?**
- ⚠️ Proyectos sin protección de deployment
- ⚠️ Versiones vulnerables detectadas
- ⚠️ Secrets que necesitan rotarse

**Acción:** Revisa qué problemas muestra el dashboard.

---

## ✅ PASO 3: Deployment Protection

### 3.1 Activar Standard Protection

1. Ve a tu proyecto en Vercel Dashboard
2. **Settings** → **Deployment Protection**
3. Busca **"Standard Protection"**

### 3.2 Configurar Protección

**Activar para:**
- ✅ **Preview Deployments** (deployments de branches/PRs)
- ✅ **Development Deployments** (si aplica)
- ❌ **Production Deployments** (dejar desactivado para tu dominio principal)

**Acción:** Activa Standard Protection para Preview y Development.

---

## ✅ PASO 4: Verificar Deployment Actual

### 4.1 Revisar Último Deployment

1. Ve a: **Deployments** en tu proyecto
2. Abre el último deployment
3. Ve a **"Build Logs"**

### 4.2 Verificar Versión Instalada

**Busca en los logs:**
```
Detected Next.js version: 16.0.10
```
O:
```
+ next@16.0.10
```

**Si ves `15.x.x` o `16.0.6` o menor:**
- ❌ El deployment está usando versión vulnerable
- Necesitas hacer un nuevo deployment

**Si ves `16.0.10` o mayor:**
- ✅ El deployment está usando versión correcta

**Acción:** Verifica qué versión muestra el último deployment.

---

## ✅ PASO 5: Si el Deployment Usa Versión Incorrecta

### 5.1 Limpiar Cache

1. **Settings** → **Build & Development Settings**
2. Busca **"Clear Build Cache"**
3. Haz clic y confirma

### 5.2 Forzar Nuevo Deployment

**Opción A: Desde Dashboard**
1. Ve a **Deployments**
2. Click en **"Redeploy"** en el último deployment
3. Selecciona **"Use existing Build Cache"** = ❌ (desmarcar)
4. Click en **"Redeploy"**

**Opción B: Desde CLI**
```bash
vercel cache purge --type=all --yes
vercel --prod --force
```

**Acción:** Si el deployment usa versión incorrecta, limpia cache y haz redeploy.

---

## ✅ PASO 6: Auditar Shareable Links

### 6.1 Revisar Deployments Compartibles

1. Ve a **Deployments**
2. Revisa cada deployment
3. Busca deployments con links compartibles (preview deployments)

### 6.2 Verificar que Estén Parcheados

**Para cada deployment compartible:**
- Verifica que use Next.js 16.0.10 o superior
- Si usa versión vulnerable:
  - Elimínalo, O
  - Actualízalo haciendo redeploy

**Acción:** Revisa y elimina/actualiza deployments vulnerables compartibles.

---

## ✅ PASO 7: Rotar Environment Variables (Opcional pero Recomendado)

### 7.1 Secrets que Deben Rotarse

Si tu app estuvo online sin parchear desde el 4 de diciembre:
1. ✅ `SUPABASE_SERVICE_ROLE_KEY`
2. ✅ `JWT_SECRET`
3. ✅ `ENCRYPTION_KEY`

### 7.2 Cómo Rotar

**Ver guía completa:** `GUIA_ROTAR_SECRETS.md`

**Resumen rápido:**
1. Genera nuevos valores
2. Actualiza en Supabase Dashboard (para service_role)
3. Actualiza en Vercel Dashboard → Environment Variables
4. Haz un nuevo deployment

**Acción:** Si es necesario, rota los secrets siguiendo la guía.

---

## 📋 Checklist Completo

### Verificación Local
- [x] Next.js 16.0.10 instalado localmente
- [x] `fix-react2shell-next` confirma: No vulnerable
- [x] `package.json` tiene `"next": "16.0.10"`

### Vercel Dashboard
- [ ] Revisado Security Actions Dashboard
- [ ] Activado Standard Protection (Preview/Development)
- [ ] Verificado último deployment usa Next.js 16.0.10
- [ ] Cache limpiado (si fue necesario)
- [ ] Nuevo deployment hecho (si fue necesario)
- [ ] Deployments compartibles revisados y actualizados

### Seguridad
- [ ] Environment Variables configuradas correctamente
- [ ] Secrets rotados (si aplica)
- [ ] Deployment Protection activado

---

## 🎯 Próximos Pasos

1. **Revisa Security Actions Dashboard** → Identifica problemas
2. **Activa Deployment Protection** → Protege preview deployments
3. **Verifica último deployment** → Confirma versión correcta
4. **Si hay problemas** → Sigue los pasos de solución
5. **Rota secrets** → Si es necesario

---

**Nota:** Ve paso a paso. No te apresures. Verifica cada cosa antes de continuar.
