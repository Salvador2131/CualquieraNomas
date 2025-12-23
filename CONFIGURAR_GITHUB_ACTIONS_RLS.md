# 🔧 Configurar GitHub Actions para Aplicar Migraciones RLS

## 📋 Estado Actual

El workflow está configurado en: `.github/workflows/supabase-migrations.yml`

**Se ejecuta automáticamente cuando:**
- Haces push a `main` o `develop`
- Y hay cambios en `supabase/migrations/**`

## ⚠️ Problema Probable

El workflow necesita **3 secrets** configurados en GitHub. Si no están configurados o tienen valores incorrectos, las migraciones no se aplicarán automáticamente.

## ✅ Solución: Configurar GitHub Secrets

### Paso 1: Ve a GitHub Secrets

1. Ve a tu repositorio: https://github.com/Salvador2131/CualquieraNomas
2. Click en **Settings** (parte superior del repo)
3. En el menú lateral: **Secrets and variables** > **Actions**
4. Click en **"New repository secret"**

### Paso 2: Agregar los 3 Secrets

#### Secret 1: `SUPABASE_PROJECT_REF`

- **Name:** `SUPABASE_PROJECT_REF`
- **Value:** `hjtarzunzoedgpbsniqc` ⚠️ **IMPORTANTE: Con "gpb", NO "gps"**
- Click: **Add secret**

**Verificar valor correcto:**
- Ve a: https://supabase.com/dashboard
- Selecciona tu proyecto
- **Settings** > **General**
- Copia el **"Reference ID"** (debe ser `hjtarzunzoedgpbsniqc`)

#### Secret 2: `SUPABASE_ACCESS_TOKEN`

- **Name:** `SUPABASE_ACCESS_TOKEN`
- **Value:** Tu Access Token de Supabase
- Click: **Add secret**

**Cómo obtenerlo:**
1. Ve a: https://supabase.com/dashboard/account/tokens
2. Click en **"Generate new token"**
3. Dale un nombre (ej: "GitHub Actions")
4. Copia el token (solo se muestra una vez)
5. Pégalo en el secret

#### Secret 3: `SUPABASE_DB_PASSWORD` (Opcional pero recomendado)

- **Name:** `SUPABASE_DB_PASSWORD`
- **Value:** La contraseña de tu base de datos de Supabase
- Click: **Add secret**

**Cómo obtenerla:**
1. Ve a: **Settings** > **Database**
2. Si no la recuerdas, puedes resetearla

## 🔍 Verificar si el Workflow se Ejecutó

1. Ve a: https://github.com/Salvador2131/CualquieraNomas/actions
2. Busca el workflow **"Supabase Migrations"**
3. Revisa si se ejecutó después de tus últimos pushes

## 🚀 Forzar Ejecución Manual

Si quieres ejecutar el workflow ahora:

1. Ve a: https://github.com/Salvador2131/CualquieraNomas/actions
2. Selecciona **"Supabase Migrations"** en el menú lateral
3. Click en **"Run workflow"** (botón arriba a la derecha)
4. Selecciona la rama: `main`
5. Click en **"Run workflow"**

## ❌ Errores Comunes

### Error: "SUPABASE_PROJECT_REF no está configurado"
**Causa:** El secret no existe o está vacío

**Solución:**
- Agrega el secret con el valor: `hjtarzunzoedgpbsniqc` (con "gpb")

### Error: "SUPABASE_ACCESS_TOKEN no está configurado"
**Causa:** El secret no existe o está vacío

**Solución:**
- Genera un nuevo token en Supabase Dashboard
- Agrega el secret con el token

### Error: "Project not found" o "Invalid project ref"
**Causa:** El `SUPABASE_PROJECT_REF` tiene el valor incorrecto

**Solución:**
- Verifica que sea: `hjtarzunzoedgpbsniqc` (con "gpb", NO "gps")
- Actualiza el secret si es necesario

### Workflow no se ejecuta
**Causa:** No hay cambios en `supabase/migrations/**` o los secrets no están configurados

**Solución:**
- Verifica que los secrets estén configurados
- Haz un cambio pequeño en una migración para forzar la ejecución
- O ejecuta el workflow manualmente

## ✅ Checklist de Configuración

- [ ] `SUPABASE_PROJECT_REF` configurado con valor `hjtarzunzoedgpbsniqc`
- [ ] `SUPABASE_ACCESS_TOKEN` configurado con token válido
- [ ] `SUPABASE_DB_PASSWORD` configurado (opcional)
- [ ] Workflow ejecutándose en GitHub Actions
- [ ] Migraciones aplicándose correctamente

## 📝 Después de Configurar

Una vez configurados los secrets:

1. **Haz un push** con cambios en migraciones
2. **O ejecuta el workflow manualmente** desde GitHub Actions
3. **Verifica los logs** para ver si se aplicaron correctamente

Las migraciones se aplicarán automáticamente cada vez que hagas push con cambios en `supabase/migrations/**`.
