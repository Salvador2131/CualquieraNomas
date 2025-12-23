# 🔍 Verificar Estado de GitHub Actions para Migraciones

## 📋 Configuración Actual

El workflow está configurado en: `.github/workflows/supabase-migrations.yml`

**Se ejecuta cuando:**
- Se hace push a `main` o `develop`
- Y hay cambios en `supabase/migrations/**`

## ✅ Requisitos para que Funcione

### 1. GitHub Secrets Configurados

Ve a tu repositorio en GitHub:
- **Settings** > **Secrets and variables** > **Actions**

Debes tener estos 3 secrets configurados:

#### Secret 1: `SUPABASE_ACCESS_TOKEN`
- **Valor:** Tu Access Token de Supabase
- **Cómo obtenerlo:**
  1. Ve a: https://supabase.com/dashboard/account/tokens
  2. Click en **"Generate new token"**
  3. Dale un nombre (ej: "GitHub Actions")
  4. Copia el token (solo se muestra una vez)

#### Secret 2: `SUPABASE_PROJECT_REF`
- **Valor:** `hjtarzunzoedgpbsniqc` (tu Project ID correcto)
- **Cómo verificar:**
  1. Ve a: https://supabase.com/dashboard
  2. Selecciona tu proyecto
  3. **Settings** > **General**
  4. Copia el **"Reference ID"**

#### Secret 3: `SUPABASE_DB_PASSWORD` (Opcional pero recomendado)
- **Valor:** La contraseña de tu base de datos de Supabase
- **Cómo obtenerla:**
  1. Ve a: **Settings** > **Database**
  2. Si no la recuerdas, puedes resetearla

## 🔍 Verificar si el Workflow se Ejecutó

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **"Actions"**
3. Busca el workflow **"Supabase Migrations"**
4. Revisa si se ejecutó después de tu último push

## ❌ Problemas Comunes

### Problema 1: Workflow no se ejecuta
**Causa:** No hay cambios en `supabase/migrations/**` o los secrets no están configurados

**Solución:**
- Verifica que los secrets estén configurados
- Haz un cambio pequeño en una migración para forzar la ejecución

### Problema 2: Error "SUPABASE_PROJECT_REF no está configurado"
**Causa:** El secret `SUPABASE_PROJECT_REF` no existe o está vacío

**Solución:**
- Agrega el secret con el valor: `hjtarzunzoedgpbsniqc`

### Problema 3: Error "SUPABASE_ACCESS_TOKEN no está configurado"
**Causa:** El secret `SUPABASE_ACCESS_TOKEN` no existe o está vacío

**Solución:**
- Genera un nuevo token en Supabase Dashboard
- Agrega el secret con el token

### Problema 4: Error de migración
**Causa:** La migración tiene errores SQL

**Solución:**
- Revisa los logs del workflow en GitHub Actions
- Corrige el error en la migración
- Haz push nuevamente

## 🚀 Forzar Ejecución Manual

Si quieres ejecutar el workflow manualmente:

1. Ve a **Actions** en GitHub
2. Selecciona **"Supabase Migrations"**
3. Click en **"Run workflow"**
4. Selecciona la rama (main)
5. Click en **"Run workflow"**

## 📝 Verificar Estado Actual

Para verificar qué secrets están configurados:

1. Ve a: `https://github.com/Salvador2131/CualquieraNomas/settings/secrets/actions`
2. Revisa si aparecen los 3 secrets mencionados

## ✅ Checklist

- [ ] `SUPABASE_ACCESS_TOKEN` configurado
- [ ] `SUPABASE_PROJECT_REF` configurado con valor `hjtarzunzoedgpbsniqc`
- [ ] `SUPABASE_DB_PASSWORD` configurado (opcional)
- [ ] Workflow ejecutándose en GitHub Actions
- [ ] Migraciones aplicándose correctamente
