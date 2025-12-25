# 🛡️ Activar Protección de Deployment en Vercel

## 📋 Importante según Vercel

Según la guía oficial de Vercel, **incluso si tu aplicación de producción está parcheada, las versiones antiguas podrían seguir siendo vulnerables**. Se recomienda activar **Standard Protection** para todos los deployments excepto el dominio de producción.

## ✅ Pasos para Activar Protección

### 1. Ve a Vercel Dashboard

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: `CualquieraNomas`
3. Ve a: **Settings** → **Deployment Protection**

### 2. Configurar Standard Protection

1. En la sección **"Deployment Protection"**, busca **"Standard Protection"**
2. Activa **"Standard Protection"** para:
   - ✅ **Preview Deployments** (deployments de branches/PRs)
   - ✅ **Development Deployments** (si aplica)
   - ❌ **Production Deployments** (dejar desactivado para tu dominio principal)

### 3. Configurar Excepciones (si es necesario)

Si necesitas compartir links de preview deployments:

1. Ve a: **Settings** → **Deployment Protection** → **"Protection Bypass"**
2. Agrega excepciones solo para deployments que:
   - ✅ Ya están parcheados (usando Next.js 16.0.10 o superior)
   - ✅ Son necesarios para compartir con clientes/colaboradores
3. **NO agregues excepciones** para deployments vulnerables

### 4. Auditar Shareable Links

1. Ve a: **Deployments**
2. Revisa todos los deployments con links compartibles
3. Verifica que todos estén usando versiones parcheadas
4. Si encuentras deployments vulnerables, elimínalos o actualízalos

---

## 🔍 Verificar Estado de Protección

### En Security Actions Dashboard:

1. Ve a: https://vercel.com/dashboard/security-actions
2. Revisa si hay proyectos sin protección de deployment
3. Sigue las recomendaciones para activar protección

### Verificar Configuración Actual:

1. Ve a tu proyecto en Vercel
2. **Settings** → **Deployment Protection**
3. Verifica que **Standard Protection** esté activado para previews

---

## ⚠️ Importante

- **Production domain** (tu dominio principal) NO debe tener protección activada (para que los usuarios puedan acceder)
- **Preview deployments** SÍ deben tener protección activada (para evitar acceso a versiones vulnerables)
- Si necesitas compartir un preview, usa **Protection Bypass** solo para ese deployment específico

---

## 📝 Checklist

- [ ] Standard Protection activado para Preview Deployments
- [ ] Standard Protection activado para Development Deployments (si aplica)
- [ ] Production Deployments sin protección (para acceso público)
- [ ] Revisados todos los shareable links
- [ ] Verificado que todos los deployments activos están parcheados

---

## 🚀 Después de Activar

Una vez activada la protección:

1. Los nuevos preview deployments estarán protegidos automáticamente
2. Si alguien intenta acceder a un preview protegido, necesitará un token de bypass
3. Tu dominio de producción seguirá siendo accesible públicamente

---

## 📚 Referencias

- [Vercel Deployment Protection Documentation](https://vercel.com/docs/security/deployment-protection)
- [Vercel Security Actions Dashboard](https://vercel.com/dashboard/security-actions)
