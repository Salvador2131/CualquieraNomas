# 🚀 Guía de Supabase CLI + GitHub Actions

Esta guía explica cómo usar Supabase CLI para gestionar migraciones de base de datos automáticamente con GitHub Actions.

---

## 📋 Requisitos Previos

1. **Cuenta de Supabase** con proyecto creado
2. **GitHub** con repositorio configurado
3. **Node.js** instalado localmente

---

## 🔧 Configuración Inicial

### Paso 1: Instalar Supabase CLI

**Método Oficial:** Instalar como dependencia de desarrollo del proyecto.

```bash
npm install
```

Esto instalará `supabase` automáticamente (ya está en `package.json` como `devDependency`).

**Verificar instalación:**

```bash
npx supabase --version
```

O usar los scripts de npm:

```bash
npm run supabase:status
```

**Nota:** Los scripts en `package.json` ya están configurados para usar `supabase` desde `node_modules`.

### Paso 2: Inicializar Supabase (si no está inicializado)

```bash
npm run supabase:init
```

Esto creará la estructura de directorios necesaria.

### Paso 3: Vincular tu proyecto de Supabase

**Opción A: Con variables de entorno**

```bash
export SUPABASE_PROJECT_REF="tu-project-ref"
export SUPABASE_ACCESS_TOKEN="tu-access-token"
npm run supabase:link
```

**Opción B: Manual**

```bash
supabase link --project-ref <tu-project-ref>
```

**Obtener Project Ref:**

1. Ve a tu proyecto en [supabase.com/dashboard](https://supabase.com/dashboard)
2. Settings > General
3. Copia el "Reference ID"

**Obtener Access Token:**

1. Ve a [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
2. Crea un nuevo token
3. Cópialo (solo se muestra una vez)

---

## 🔐 Configurar GitHub Secrets

Ve a tu repositorio en GitHub: **Settings > Secrets and variables > Actions**

Agrega estos secrets:

1. **`SUPABASE_ACCESS_TOKEN`**

   - Valor: Tu access token de Supabase

2. **`SUPABASE_PROJECT_REF`**

   - Valor: El Reference ID de tu proyecto (ej: `hjtarzunzoedgpsniqc`)

3. **`SUPABASE_DB_PASSWORD`** (opcional, si usas password)
   - Valor: Contraseña de la base de datos

---

## 📝 Crear Migraciones

### Crear una nueva migración

```bash
npm run supabase:migration:new nombre_descriptivo
```

Ejemplo:

```bash
npm run supabase:migration:new add_organizations_table
```

Esto creará un archivo en `supabase/migrations/` con timestamp:

```
supabase/migrations/20240101120000_add_organizations_table.sql
```

### Escribir la migración

Edita el archivo SQL creado con tus cambios:

```sql
-- Ejemplo: supabase/migrations/20240101120000_add_organizations_table.sql
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Aplicar migración localmente (opcional)

```bash
npm run supabase:migration:up
```

---

## 🔄 Flujo de Trabajo

### 1. Crear migración localmente

```bash
npm run supabase:migration:new mi_cambio
```

### 2. Editar el archivo SQL

Edita `supabase/migrations/[timestamp]_mi_cambio.sql`

### 3. Commit y Push

```bash
git add supabase/migrations/
git commit -m "feat: agregar tabla organizations"
git push origin main
```

### 4. GitHub Actions ejecuta automáticamente

- GitHub Actions detecta cambios en `supabase/migrations/`
- Ejecuta las migraciones en Supabase
- Verifica el estado

### 5. Verificar en GitHub Actions

Ve a: **Actions** tab en tu repositorio de GitHub

---

## 🛠️ Comandos Disponibles

| Comando                                   | Descripción                          |
| ----------------------------------------- | ------------------------------------ |
| `npm run supabase:init`                   | Inicializar Supabase CLI             |
| `npm run supabase:link`                   | Vincular proyecto de Supabase        |
| `npm run supabase:migration:new <nombre>` | Crear nueva migración                |
| `npm run supabase:migration:up`           | Aplicar migraciones pendientes       |
| `npm run supabase:migration:down`         | Revertir última migración            |
| `npm run supabase:migration:list`         | Listar migraciones                   |
| `npm run supabase:db:reset`               | Resetear base de datos (CUIDADO)     |
| `npm run supabase:db:diff`                | Ver diferencias entre local y remoto |
| `npm run supabase:status`                 | Ver estado de Supabase local         |

---

## 📁 Estructura de Directorios

```
proyecto/
├── supabase/
│   ├── config.toml          # Configuración de Supabase CLI
│   ├── migrations/           # Migraciones SQL (versionadas)
│   │   ├── 20240101120000_add_organizations.sql
│   │   └── 20240102120000_add_tenant_id.sql
│   └── seed.sql             # Datos de prueba (opcional)
├── .github/
│   └── workflows/
│       └── supabase-migrations.yml  # GitHub Actions workflow
└── package.json
```

---

## ⚠️ Importante

### Seguridad

- **NUNCA** subas `.env.local` a Git
- Los secrets de GitHub están encriptados
- Las migraciones son versionadas y reversibles

### Buenas Prácticas

1. **Nombres descriptivos**: `add_organizations_table` no `migration_1`
2. **Una migración = un cambio lógico**
3. **Siempre prueba localmente** antes de hacer push
4. **Revisa el SQL** antes de commitear
5. **Usa transacciones** cuando sea posible

### Ejemplo de Migración Segura

```sql
BEGIN;

-- Crear tabla
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);

-- Agregar comentario
COMMENT ON TABLE organizations IS 'Tabla de organizaciones para multi-tenant';

COMMIT;
```

---

## 🐛 Troubleshooting

### Error: "Project not linked"

```bash
npm run supabase:link
```

### Error: "Access token invalid"

1. Verifica que el token esté en GitHub Secrets
2. Genera un nuevo token en Supabase Dashboard
3. Actualiza el secret en GitHub

### Error: "Migration failed"

1. Revisa los logs en GitHub Actions
2. Verifica el SQL manualmente en Supabase Dashboard
3. Si es necesario, crea una migración de rollback

### Ver migraciones aplicadas

```bash
npm run supabase:migration:list
```

---

## 📚 Recursos

- [Documentación Supabase CLI](https://supabase.com/docs/reference/cli)
- [Guía de Migraciones](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**Última actualización:** $(date)
