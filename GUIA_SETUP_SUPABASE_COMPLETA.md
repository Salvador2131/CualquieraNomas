# 🗄️ GUÍA COMPLETA PARA CONFIGURAR SUPABASE

## 📋 PASOS PARA CONFIGURAR TU BASE DE DATOS

### 1️⃣ VERIFICAR ESTADO ACTUAL

**Ejecuta en Supabase SQL Editor:**

```sql
-- Copia y pega el contenido de: scripts/0_CONSULTAR_ESTADO_ACTUAL.sql
```

**Esto te mostrará:**

- ✅ Qué tablas ya tienes
- ❌ Qué tablas faltan
- 📊 Índices y triggers existentes
- 🔒 Estado de RLS

---

### 2️⃣ INSTALAR BASE DE DATOS (SI FALTA)

**Si NO tienes las tablas base, ejecuta:**

```sql
-- Copia y pega el contenido de: scripts/1_INSTALAR_TODO_EN_ORDEN.sql
```

**Este script crea:**

- ✅ Extensión `uuid-ossp`
- ✅ Tabla `users`
- ✅ Tabla `workers`
- ✅ Tabla `employers`
- ✅ Tabla `events`
- ✅ Tabla `event_workers`
- ✅ Tabla `worker_salaries` (con constraint UNIQUE)
- ✅ Tabla `preregistrations`
- ✅ Todos los índices
- ✅ Todos los triggers

---

### 3️⃣ INSTALAR SISTEMAS AVANZADOS (OPCIONAL)

**Si quieres todas las funciones, ejecuta en orden:**

#### A. Sistema de Calendario

```sql
-- Ejecuta: scripts/add-calendar-system.sql
```

#### B. Sistema de Documentos

```sql
-- Ejecuta: scripts/add-documents-system.sql
```

#### C. Sistema de Notificaciones

```sql
-- Ejecuta: scripts/add-notifications-system.sql
```

#### D. Sistema de Mensajería

```sql
-- Ejecuta: scripts/add-messaging-system.sql
```

#### E. Sistema de Evaluaciones

```sql
-- Ejecuta: scripts/add-evaluations-system.sql
```

#### F. Sistema de Penalizaciones

```sql
-- Ejecuta: scripts/add-penalties-system.sql
```

---

### 4️⃣ INSERTAR DATOS DE PRUEBA (OPCIONAL)

**Para tener datos de prueba, ejecuta:**

```sql
-- Ejecuta: scripts/seed-data.sql
-- O: scripts/insert-data-corrected.sql
```

**Esto creará:**

- 👥 Usuarios de prueba
- 👷 Trabajadores de ejemplo
- 🏢 Empleadores de ejemplo
- 📅 Eventos de ejemplo

---

## 🎯 QUÉ HACER SI...

### ...Las tablas ya existen pero falta algo

**Usa el script de consulta primero:**

```sql
-- Ejecuta: scripts/0_CONSULTAR_ESTADO_ACTUAL.sql
```

**Luego ejecuta los scripts específicos que falten:**

- Si falta `worker_salaries`: No hace falta, ya está en el script 1
- Si falta constraint UNIQUE: Ejecuta `scripts/add-unique-salary-constraint.sql`

---

### ...Quieres empezar desde cero

**1. Borra todo (¡CUIDADO!):**

```sql
-- ⚠️ SOLO si quieres empezar de cero
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

**2. Ejecuta todo:**

```sql
-- Ejecuta: scripts/1_INSTALAR_TODO_EN_ORDEN.sql
```

---

## 📊 RESUMEN DE SCRIPTS

### Scripts Principales:

1. **`0_CONSULTAR_ESTADO_ACTUAL.sql`** ← EJECUTA ESTO PRIMERO
   - Ver estado actual
   - Qué tablas faltan
2. **`1_INSTALAR_TODO_EN_ORDEN.sql`** ← EJECUTA ESTO DESPUÉS
   - Crea todas las tablas base
   - Crea índices y triggers
3. **`add-unique-salary-constraint.sql`**
   - Añade constraint UNIQUE a worker_salaries

### Scripts Adicionales (Opcionales):

- `add-calendar-system.sql`
- `add-documents-system.sql`
- `add-notifications-system.sql`
- `add-messaging-system.sql`
- `add-evaluations-system.sql`
- `add-penalties-system.sql`

---

## 🔗 ENLACE A TU SUPABASE

**SQL Editor:** https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc/editor

---

## 📝 CHECKLIST DE INSTALACIÓN

### Paso 1: Verificar

- [ ] Ejecutar `0_CONSULTAR_ESTADO_ACTUAL.sql`
- [ ] Revisar resultados
- [ ] Anotar qué tablas faltan

### Paso 2: Instalar Base

- [ ] Ejecutar `1_INSTALAR_TODO_EN_ORDEN.sql`
- [ ] Verificar que no hay errores
- [ ] Confirmar creación de tablas

### Paso 3: Instalar Avanzados (Opcional)

- [ ] Ejecutar scripts adicionales según necesites
- [ ] Verificar que se crearon correctamente

### Paso 4: Probar

- [ ] Conectar desde la app
- [ ] Verificar que dashboard carga
- [ ] Probar CRUD básico

---

## ⚙️ VARIABLES DE ENTORNO NECESARIAS

**Ya configuradas en `.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpsniqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gZ0f-x1z89Xs9LR5mVpYbw_HEaRvjGz
SUPABASE_SERVICE_ROLE_KEY=ADJYApVe1nGwmpkDs6UaDAYPrl4fbBVnudCati08FfiawMgCvdmblJZVFLMD+9f+Uw+k497GmkFjLUV58PQ+aw==
```

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE CONFIGURAR SUPABASE

1. **Crear archivos faltantes:**

   - `app/employers/page.tsx`
   - `app/quote/page.tsx`
   - `app/settings/page.tsx`

2. **Implementar APIs faltantes:**

   - `app/api/employers/route.ts`
   - `app/api/quotes/route.ts`

3. **Probar conexión:**

   ```bash
   npm run dev
   ```

4. **Verificar dashboard:**
   - Ve a: http://localhost:3000/dashboard
