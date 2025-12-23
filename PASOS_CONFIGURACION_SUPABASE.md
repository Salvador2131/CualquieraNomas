# 📋 PASOS PARA CONFIGURAR SUPABASE CLI

## 🎯 Ruta del Proyecto

```powershell
cd "c:\Users\Salva\.cursor\CualquieraNomas"
```

---

## ✅ PASO 1: Instalar Dependencias

```powershell
cd "c:\Users\Salva\.cursor\CualquieraNomas"
npm install
```

**Qué hace:** Instala todas las dependencias del proyecto

**Tiempo estimado:** 2-3 minutos

---

## ✅ PASO 1.5: Instalar Supabase CLI

**Método Oficial:** Instalar como dependencia de desarrollo del proyecto.

### 📦 Instalación con npm (Recomendado - Método Oficial)

El Supabase CLI se instala automáticamente cuando instalas las dependencias del proyecto:

```powershell
cd "c:\Users\Salva\.cursor\CualquieraNomas"
npm install
```

Esto instalará `supabase` como dependencia de desarrollo (ya está en `package.json`).

**Verificar instalación:**

```powershell
npx supabase --version
```

O usar los scripts de npm:

```powershell
npm run supabase:status
```

**Nota:** Los scripts en `package.json` ya están configurados para usar `supabase` desde `node_modules`.

### 📥 Método Alternativo: Instalación Manual

Si prefieres instalarlo manualmente, sigue la guía en: `INSTALAR_SUPABASE_CLI.md`

---

## ✅ PASO 2: Verificar Supabase CLI

```powershell
cd "c:\Users\Salva\.cursor\CualquieraNomas"
npx supabase --version
```

**O usar el script:**

```powershell
npm run supabase:status
```

**Si no está instalado**, ejecuta `npm install` primero (ver PASO 1 arriba).

---

## ✅ PASO 3: Ejecutar Script de Configuración

```powershell
cd "c:\Users\Salva\.cursor\CualquieraNomas"
.\scripts\setup-supabase-cli.ps1
```

**Qué hace:**

- Verifica Node.js y npm
- Instala Supabase CLI si no está instalado
- Inicializa la estructura de Supabase

**Tiempo estimado:** 1-2 minutos

**Si hay error de permisos:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## ✅ PASO 4: Obtener Credenciales de Supabase

### 4.1. Obtener Project Ref

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Settings** > **General**
4. Busca: **Reference ID**
5. Copia el ID (ejemplo: `hjtarzunzoedgpbsniqc`)

### 4.2. Obtener Access Token

1. Ve a: https://supabase.com/dashboard/account/tokens
2. Click en: **Generate new token**
3. Dale un nombre (ej: "GitHub Actions")
4. Copia el token (solo se muestra una vez)

---

## ✅ PASO 5: Vincular Proyecto de Supabase

```powershell
cd "c:\Users\Salva\.cursor\CualquieraNomas"
supabase link --project-ref <TU_PROJECT_REF>
```

**Reemplaza `<TU_PROJECT_REF>`** con el Reference ID que copiaste.

**Ejemplo:**

```powershell
supabase link --project-ref hjtarzunzoedgpsniqc
```

**Te pedirá:**

- Database password (la contraseña de tu base de datos de Supabase)
- Si no la recuerdas, puedes resetearla en Settings > Database

**Tiempo estimado:** 1 minuto

---

## ✅ PASO 6: Configurar GitHub Secrets

1. Ve a tu repositorio en GitHub
2. Click en: **Settings** (en la parte superior del repo)
3. En el menú lateral: **Secrets and variables** > **Actions**
4. Click en: **New repository secret**

### Agregar estos 3 secrets:

#### Secret 1: `SUPABASE_ACCESS_TOKEN`

- **Name:** `SUPABASE_ACCESS_TOKEN`
- **Value:** El access token que copiaste en el Paso 3.2
- Click: **Add secret**

#### Secret 2: `SUPABASE_PROJECT_REF`

- **Name:** `SUPABASE_PROJECT_REF`
- **Value:** El Reference ID que copiaste en el Paso 3.1 (ej: `hjtarzunzoedgpbsniqc`)
- Click: **Add secret**

#### Secret 3: `SUPABASE_DB_PASSWORD` (Opcional pero recomendado)

- **Name:** `SUPABASE_DB_PASSWORD`
- **Value:** La contraseña de tu base de datos de Supabase
- Click: **Add secret**

**Tiempo estimado:** 3-5 minutos

---

## ✅ PASO 7: Verificar Configuración

### 7.1. Verificar Supabase CLI local

```powershell
cd "c:\Users\Salva\.cursor\CualquieraNomas"
supabase status
```

**Debería mostrar:** Estado de Supabase (si está corriendo localmente)

### 7.2. Verificar que el proyecto está vinculado

```powershell
cd "c:\Users\Salva\.cursor\CualquieraNomas"
cat supabase\.temp\project-ref
```

O simplemente intenta crear una migración de prueba:

```powershell
cd "c:\Users\Salva\.cursor\CualquieraNomas"
npm run supabase:migration:new test_connection
```

**Si funciona:** Se creará un archivo en `supabase/migrations/`

**Si falla:** Revisa que el proyecto esté vinculado correctamente

---

## ✅ PASO 8: Probar GitHub Actions (Opcional)

### 7.1. Crear una migración de prueba

```powershell
cd "c:\Users\Salva\.cursor\CualquieraNomas"
npm run supabase:migration:new test_github_actions
```

### 8.2. Editar la migración

Abre el archivo creado en `supabase/migrations/` y agrega:

```sql
-- Migración de prueba
SELECT 1;
```

### 7.3. Commit y Push

```powershell
cd "c:\Users\Salva\.cursor\CualquieraNomas"
git add supabase/migrations/
git commit -m "test: probar GitHub Actions"
git push origin main
```

### 8.4. Verificar en GitHub

1. Ve a tu repositorio en GitHub
2. Click en: **Actions** (pestaña superior)
3. Deberías ver el workflow ejecutándose
4. Click en el workflow para ver los logs

**Si todo está bien:** Verás ✅ en verde

**Si hay errores:** Revisa los logs para ver qué falta

---

## 🎉 ¡Listo!

Una vez completados estos pasos, podrás:

- ✅ Crear migraciones con: `npm run supabase:migration:new nombre`
- ✅ Las migraciones se aplicarán automáticamente al hacer push
- ✅ Todo queda versionado en Git

---

## 🐛 Troubleshooting

### Error: "Project not linked"

```powershell
supabase link --project-ref <TU_PROJECT_REF>
```

### Error: "Access token invalid"

1. Genera un nuevo token en Supabase Dashboard
2. Actualiza el secret `SUPABASE_ACCESS_TOKEN` en GitHub

### Error: "Permission denied" al ejecutar script

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error en GitHub Actions: "Secrets not found"

Verifica que los 3 secrets estén configurados en GitHub:

- Settings > Secrets and variables > Actions

---

## 📚 Siguiente Paso

Una vez configurado, avisa y procederemos con la **FASE 1: Base de Datos** para convertir el sistema a multi-tenant.
