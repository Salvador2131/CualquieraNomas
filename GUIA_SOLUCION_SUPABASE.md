# 🔧 Guía de Solución: Problema de Conexión con Supabase

## ❌ Problema Identificado

**Error:** `No se encontró hjtarzunzoedgpbsniqc.supabase.co's DNS address`

**Causa:** El proyecto de Supabase está **pausado** o **eliminado**.

## ✅ Soluciones

### Opción 1: Reactivar Proyecto Existente (Recomendado)

1. **Ve al Dashboard de Supabase:**

   - Abre: https://supabase.com/dashboard
   - Inicia sesión con tu cuenta

2. **Busca tu proyecto:**

   - Busca el proyecto con referencia `hjtarzunzoedgpbsniqc`
   - O busca por la URL: `hjtarzunzoedgpbsniqc.supabase.co`

3. **Verifica el estado:**

   - Si dice **"Paused"** → Haz clic en **"Resume"** o **"Restore"**
   - Espera 2-5 minutos a que se reactive

4. **Verifica las credenciales:**

   - Ve a **Settings > API**
   - Verifica que las URLs y keys coincidan con tu `.env.local`

5. **Prueba la conexión:**
   ```bash
   node scripts/verificar-supabase-completo.js
   ```

### Opción 2: Crear Nuevo Proyecto

Si el proyecto fue eliminado o no puedes reactivarlo:

1. **Crea un nuevo proyecto:**

   - Ve a: https://supabase.com/dashboard
   - Haz clic en **"New Project"**
   - Completa:
     - **Name:** CualquieraNomas (o el nombre que prefieras)
     - **Database Password:** (guárdala en un lugar seguro)
     - **Region:** Elige la más cercana (ej: South America)
     - **Pricing Plan:** Free (para empezar)

2. **Espera a que se cree:**

   - Toma 2-3 minutos
   - Verás un mensaje cuando esté listo

3. **Obtén las credenciales:**

   - Ve a **Settings > API**
   - Copia:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

4. **Actualiza `.env.local`:**

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-nuevo-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-nueva-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-nueva-service-role-key
   ```

5. **Ejecuta las migraciones:**

   - Ve a **SQL Editor** en Supabase Dashboard
   - Ejecuta en orden:
     ```
     1. supabase/migrations/20251222215551_phase1_multi_tenant_organizations.sql
     2. supabase/migrations/20251223000000_add_subscription_system.sql
     3. supabase/migrations/20251223010000_add_rating_triggers.sql
     ```

6. **Verifica la conexión:**
   ```bash
   node scripts/verificar-supabase-completo.js
   ```

## 🔍 Verificación Paso a Paso

### Paso 1: Verificar Variables de Entorno

```bash
# En PowerShell
Get-Content .env.local | Select-String "SUPABASE"
```

Debes ver:

- `NEXT_PUBLIC_SUPABASE_URL=https://...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

### Paso 2: Verificar Conexión

```bash
node scripts/verificar-supabase-completo.js
```

### Paso 3: Verificar desde la App

1. Inicia el servidor:

   ```bash
   npm run dev
   ```

2. Visita:
   - http://localhost:3000/api/diagnostic/supabase
   - http://localhost:3000/api/health/supabase

## 📋 Checklist de Verificación

- [ ] Proyecto de Supabase está activo (no pausado)
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] URL de Supabase es correcta
- [ ] API Keys son correctas
- [ ] Migraciones ejecutadas en Supabase SQL Editor
- [ ] Script de verificación pasa todos los tests
- [ ] Endpoint `/api/diagnostic/supabase` muestra `status: "success"`

## 🆘 Si Nada Funciona

1. **Verifica tu conexión a internet**
2. **Prueba desde otro navegador/dispositivo**
3. **Verifica que no haya firewall bloqueando**
4. **Contacta soporte de Supabase:** support@supabase.io

## 📞 Información de Soporte

- **Documentación:** https://supabase.com/docs
- **Status Page:** https://status.supabase.com
- **Community:** https://github.com/supabase/supabase/discussions
