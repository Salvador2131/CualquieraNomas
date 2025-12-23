# 📋 Plan para Ordenar Supabase

## 🎯 Objetivo

Verificar y ordenar completamente la conexión y estructura de Supabase, asegurando que todas las tablas existan y las migraciones estén aplicadas correctamente.

## 📊 Estado Actual

- ✅ Variables de entorno configuradas
- ❓ Conexión con Supabase (verificar si proyecto está activo)
- ❓ Tablas existentes (desconocido)
- ❓ Migraciones aplicadas (desconocido)

## 🔍 Paso 1: Diagnóstico Completo

Ejecuta el script de diagnóstico:

```bash
node scripts/diagnostico-supabase-completo.js
```

Este script verificará:

- ✅ Variables de entorno
- ✅ Conexión HTTP con Supabase
- ✅ Qué tablas existen
- ✅ Qué tablas faltan

## 🔧 Paso 2: Verificar Proyecto Supabase

1. **Ve a Supabase Dashboard:**

   - https://supabase.com/dashboard
   - Inicia sesión

2. **Verifica el estado del proyecto:**

   - Si está **pausado** → Haz clic en **"Resume"** o **"Restore"**
   - Espera 2-5 minutos a que se reactive

3. **Verifica las credenciales:**
   - Ve a **Settings > API**
   - Compara con tu `.env.local`
   - Si son diferentes, actualiza `.env.local`

## 🗄️ Paso 3: Crear Tablas Base (Si Faltan)

Si el diagnóstico muestra que faltan tablas base (`users`, `workers`, `events`, etc.):

1. **Ve a Supabase Dashboard > SQL Editor**

2. **Ejecuta la migración base:**

   ```
   supabase/migrations/20251222200000_create_base_tables.sql
   ```

   Esta migración crea todas las tablas fundamentales de forma idempotente.

## 🔄 Paso 4: Aplicar Migraciones en Orden

Ejecuta las migraciones en este orden exacto:

### 4.1. Migración Base (si faltan tablas)

```
supabase/migrations/20251222200000_create_base_tables.sql
```

### 4.2. Multi-Tenant Fase 1

```
supabase/migrations/20251222215551_phase1_multi_tenant_organizations.sql
```

### 4.3. Sistema de Suscripciones

```
supabase/migrations/20251223000000_add_subscription_system.sql
```

### 4.4. Triggers de Ratings

```
supabase/migrations/20251223010000_add_rating_triggers.sql
```

### 4.5. RLS Básico (Desarrollo)

```
supabase/migrations/20251223020000_enable_rls_basic.sql
```

## ✅ Paso 5: Verificar Resultado

Después de aplicar todas las migraciones:

1. **Ejecuta el diagnóstico nuevamente:**

   ```bash
   node scripts/diagnostico-supabase-completo.js
   ```

2. **Verifica que:**
   - ✅ Todas las tablas existan
   - ✅ No haya errores de conexión
   - ✅ El linter de Supabase no reporte errores de RLS

## 🚨 Problemas Comunes y Soluciones

### Error: "relation does not exist"

**Causa:** Falta la tabla base  
**Solución:** Ejecuta `20251222200000_create_base_tables.sql` primero

### Error: "column does not exist"

**Causa:** Migración ejecutada fuera de orden  
**Solución:** Ejecuta las migraciones en el orden correcto

### Error: "trigger already exists"

**Causa:** Migración ejecutada dos veces  
**Solución:** Las migraciones son idempotentes, pero si persiste, elimina el trigger manualmente

### Error: "ENOTFOUND" (DNS)

**Causa:** Proyecto de Supabase pausado o URL incorrecta  
**Solución:** Reactiva el proyecto en Supabase Dashboard

## 📝 Checklist Final

- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Proyecto de Supabase activo (no pausado)
- [ ] Migración base ejecutada (`20251222200000_create_base_tables.sql`)
- [ ] Migración multi-tenant ejecutada (`20251222215551_phase1_multi_tenant_organizations.sql`)
- [ ] Migración de suscripciones ejecutada (`20251223000000_add_subscription_system.sql`)
- [ ] Migración de triggers ejecutada (`20251223010000_add_rating_triggers.sql`)
- [ ] Migración de RLS ejecutada (`20251223020000_enable_rls_basic.sql`)
- [ ] Diagnóstico completo sin errores
- [ ] Linter de Supabase sin errores de RLS

## 🎯 Resultado Esperado

Después de completar todos los pasos:

- ✅ **28 tablas** creadas y configuradas
- ✅ **RLS habilitado** en todas las tablas públicas
- ✅ **Multi-tenant** configurado (organization_id en todas las tablas)
- ✅ **Sistema de suscripciones** funcionando
- ✅ **Triggers y funciones** creadas
- ✅ **Sin errores** en el linter de Supabase

## 📞 Siguiente Paso

Una vez completado, puedes:

1. Iniciar el servidor: `npm run dev`
2. Verificar endpoints: `/api/health/supabase`
3. Probar la aplicación
