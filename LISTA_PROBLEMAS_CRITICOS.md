# 📋 LISTA COMPLETA DE PROBLEMAS Y DEFECTOS CRÍTICOS

**Proyecto:** ERP Sistema de Gestión para Banquetes  
**Fecha:** 2024  
**Estado:** Prioridad de corrección antes de continuar desarrollo

---

## 🔴 1. EXPLICACIÓN: ¿Por qué `ignoreBuilds` está habilitado?

### Ubicación: `next.config.mjs`

```javascript
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true },
```

### Razón (hipótesis):

Este es un **indicador de problemas de desarrollo**:

- El código tiene errores de TypeScript/ESLint que impiden compilar
- Se deshabilitó la verificación para poder hacer build rápidamente
- Esto oculta errores que se acumulan en producción

### Impacto:

- ✅ Puede compilar y ejecutar
- ❌ Errores ocultos se manifiestan en runtime
- ❌ Sin protección de tipos en compilación
- ❌ Código roto puede pasar a producción

---

## 🔴 2. CONFIGURACIÓN DE SUPABASE

### Ubicación de configuración:

1. **Variables de entorno:** `.env.local` (no existe en repo, debe crearse)
2. **Referencia:** `env.example` (contiene todas las variables necesarias)
3. **Cliente Supabase:** `lib/supabase.ts`
4. **Schemas SQL:** Carpeta `scripts/` (múltiples archivos)

### Dónde está la BD en la nube:

- **Supabase Cloud:** https://supabase.com
- Las credenciales de conexión deben configurarse en `.env.local`
- La BD física está en Supabase Cloud (PostgreSQL managed)

### Variables requeridas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

---

## 🔴 3. PROBLEMAS CRÍTICOS DE SEGURIDAD

### 🚨 SEVERIDAD CRÍTICA ALTA

#### 3.1 Falta autenticación real en APIs

**Archivo:** Múltiples endpoints en `app/api/`
**Problema:**

- El middleware solo verifica cookies del cliente
- No hay verificación de tokens JWT en las APIs
- Cualquiera con acceso a la red puede llamar endpoints

**Archivos afectados:**

- `app/api/workers/salary/route.ts` - NO protegido
- `app/api/dashboard/route.ts` - NO protegido
- `app/api/workers/route.ts` - Parcialmente protegido
- Y muchos más...

**Ejemplo:**

```typescript
// workers/salary/route.ts - SIN protección
export async function GET(request: NextRequest) {
  // ❌ Cualquiera puede acceder sin autenticación
  const supabase = createClient();
  // ...
}
```

#### 3.2 Configuración insegura de Next.js

**Archivo:** `next.config.mjs`
**Problema:**

- Ignora errores de TypeScript en compilación
- Ignora errores de ESLint
- Permite imágenes sin optimizar

```javascript
// Líneas 4-10
eslint: { ignoreDuringBuilds: true },  // ❌ Peligroso
typescript: { ignoreBuildErrors: true },  // ❌ Peligroso
images: { unoptimized: true },  // ⚠️ Performance
```

#### 3.3 Variables de entorno sin validación

**Archivo:** `lib/supabase.ts` - Líneas 3-8
**Problema:**

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}
```

- ✅ Valida existencia pero NO valida formato
- ❌ No valida credenciales al iniciar
- ❌ Error solo aparece en runtime

#### 3.4 Autenticación basada solo en cookies

**Archivos:**

- `middleware.ts` - Líneas 36-40
- `app/api/auth/login/route.ts` - Líneas 64-76

**Problema:**

```typescript
// middleware.ts - Línea 36
const userSession = request.cookies.get("user-session");

// login/route.ts - Líneas 64-76
response.cookies.set("user-session", JSON.stringify({...}), {
  httpOnly: true,  // ✅ Bien
  secure: process.env.NODE_ENV === "production", // ⚠️ Ojo
  sameSite: "lax",  // ⚠️ Debería ser "strict"
  maxAge: 60 * 60 * 24 * 7, // 7 días sin refresh
});
```

- ❌ Sin token refresh
- ❌ Sin expiración incremental
- ⚠️ sameSite debería ser "strict" para producción

---

### 🚨 SEVERIDAD CRÍTICA MEDIA

#### 3.5 Sin protección CSRF

**Archivo:** Global
**Problema:** No hay protección contra Cross-Site Request Forgery
**Riesgo:** Ataques de estado de sesión

#### 3.6 Sin rate limiting efectivo

**Archivo:** `lib/middleware/rate-limit.ts`
**Problema:** Rate limit existe pero no está implementado en endpoints
**Riesgo:** DDoS, fuerza bruta

#### 3.7 Sin hasheo de passwords

**Archivo:** No implementado
**Problema:** Depende totalmente de Supabase Auth

- No hay control sobre política de passwords
- No se valida fortaleza de passwords

---

## 🟡 4. PROBLEMAS DE CALIDAD DE CÓDIGO

### 🔶 CRÍTICOS

#### 4.1 Inconsistencia en patrones de API

**Problema:** Múltiples estilos de implementación

**Estilo 1 - Sin seguridad:**

```typescript
// app/api/workers/salary/route.ts
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    // Sin middleware, sin validación
  }
}
```

**Estilo 2 - Con middleware:**

```typescript
// app/api/workers/route.ts
export const GET = withErrorHandling(async (request: NextRequest) => {
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) return securityResponse;
  // ...
});
```

**Estilo 3 - Sin request:**

```typescript
// app/api/dashboard/route.ts
export async function GET() {
  // Sin request, sin headers, sin seguridad
}
```

**Solución:** Estandarizar un solo patrón en todos los endpoints

---

#### 4.2 Bugs críticos en paginación

**Archivo:** `app/api/workers/salary/route.ts` - Líneas 54-57

```typescript
// Obtener total de registros para paginación
const { count } = await supabase
  .from("worker_salaries")
  .select("*", { count: "exact", head: true });
// ❌ PROBLEMA: No aplica los mismos filtros que la query principal
```

**Problema:**

- Query principal filtra por `workerId`, `month`, `year`
- Count NO aplica esos filtros
- Resultado: Paginación incorrecta (ej: filtra por worker 5, pero cuenta todos)

**Afecta:**

- Paginación muestra números incorrectos
- Total de páginas incorrecto
- UX confusa

**Corrección necesaria:**

```typescript
let countQuery = supabase
  .from("worker_salaries")
  .select("*", { count: "exact", head: true });

if (workerId) countQuery = countQuery.eq("worker_id", workerId);
if (month) countQuery = countQuery.eq("month", parseInt(month));
if (year) countQuery = countQuery.eq("year", parseInt(year));

const { count } = await countQuery;
```

---

#### 4.3 Validación de parámetros insuficiente

**Archivo:** `app/api/workers/salary/route.ts` - Líneas 10-11

```typescript
const page = parseInt(searchParams.get("page") || "1");
const limit = parseInt(searchParams.get("limit") || "10");
const offset = (page - 1) * limit;
```

**Problemas:**

- No valida si `parseInt` retorna `NaN` (ej: `page=abc` → `NaN`)
- No valida valores negativos (ej: `page=-5`)
- No valida límites razonables (ej: `limit=10000`)
- `offset` puede ser negativo con `page=-1`

**Corrección:**

```typescript
const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
const limit = Math.min(
  100,
  Math.max(1, parseInt(searchParams.get("limit") || "10"))
);
const offset = (page - 1) * limit;
```

---

#### 4.4 Validación de sessionData sin verificación de campos

**Archivo:** `middleware.ts` - Líneas 44-58

```typescript
try {
  const sessionData = JSON.parse(userSession.value);

  if (
    pathname.startsWith("/worker-dashboard") &&
    sessionData.role !== "worker"
  ) {
    // ❌ Asume que role existe, puede ser undefined
  }
} catch (error) {
  // ❌ Solo redirige, no loguea el error
}
```

**Problemas:**

- Asume que `sessionData.role` existe
- Si el campo no existe, el acceso se bloquea sin razón
- No loguea errores de parsing
- Dificulta debugging

**Corrección:**

```typescript
try {
  const sessionData = JSON.parse(userSession.value);

  // ✅ Validar que role existe
  if (!sessionData || !sessionData.role) {
    securityLogger.warn("Invalid session data structure", { pathname });
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (
    pathname.startsWith("/worker-dashboard") &&
    sessionData.role !== "worker"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
} catch (error) {
  securityLogger.error("Session parsing error", { error, pathname });
  return NextResponse.redirect(new URL("/auth/login", request.url));
}
```

---

#### 4.5 Manejo de errores inconsistente

**Problema:** Tres formas diferentes de manejar errores

**Forma 1 - console.error:**

```typescript
// app/api/workers/salary/route.ts
catch (error) {
  console.error("Error fetching salaries:", error);
}
```

**Forma 2 - apiLogger:**

```typescript
// app/api/workers/route.ts
catch (error) {
  apiLogger.error("Error fetching workers", { error, ... });
}
```

**Forma 3 - Sin logging:**

```typescript
// app/api/dashboard/route.ts
catch (error) {
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  // No loguea nada
}
```

**Solución:** Estandarizar uso de `apiLogger` en todos los endpoints

---

#### 4.6 Sin validación de inputs numéricos

**Archivo:** `app/api/workers/salary/route.ts` - Líneas 112-119

```typescript
hours_worked: hours_worked || 0,  // ❌ Permite negativos
overtime_hours: overtime_hours || 0,  // ❌ Permite negativos
```

**Problema:**

- Acepta números negativos
- No valida límites razonables
- Datos incorrectos en base de datos

**Ejemplo de data inválida:**

```typescript
// POST con body:
{
  "worker_id": "123",
  "month": 2,
  "year": 2024,
  "hours_worked": -50,  // ❌ Inválido pero se acepta
  "overtime_hours": -100  // ❌ Inválido pero se acepta
}
```

**Corrección:**

```typescript
// Validar antes de insertar
if (hours_worked < 0 || hours_worked > 400) {
  return NextResponse.json(
    { message: "Las horas trabajadas deben estar entre 0 y 400" },
    { status: 400 }
  );
}

if (overtime_hours < 0 || overtime_hours > 100) {
  return NextResponse.json(
    { message: "Las horas extra deben estar entre 0 y 100" },
    { status: 400 }
  );
}
```

---

## 🟢 5. PROBLEMAS DE ARQUITECTURA Y DISEÑO

#### 5.1 Endpoint PUT no persistente

**Archivo:** `app/api/workers/salary/route.ts` - Líneas 210-266

**Problema:**

```typescript
// PUT calcula el salario pero NO lo guarda
const totalSalary = baseSalary + overtimePay;

return NextResponse.json({
  message: "Salario calculado exitosamente",
  calculation: { ... }
  // ❌ Solo retorna cálculo, no lo guarda en DB
});
```

**Flujo inválido:**

1. Cliente llama PUT para calcular
2. Cliente llama POST para guardar
3. Riesgo de inconsistencias

**Solución:** PUT debe poder persistir opcionalmente

---

#### 5.2 Sin verificación de duplicados

**Archivo:** `app/api/workers/salary/route.ts` - Líneas 77-155

**Problema:**

- POST puede crear salarios duplicados para mismo worker/mes/año
- No hay validación `UNIQUE` en tabla o código

**Ejemplo:**

```typescript
// POST 1
POST /api/workers/salary
{ worker_id: "123", month: 1, year: 2024, ... }

// POST 2 (duplicado)
POST /api/workers/salary
{ worker_id: "123", month: 1, year: 2024, ... }
// ❌ Se crea registro duplicado
```

**Solución:** Validar existencia antes de insertar

---

#### 5.3 Falta constraint UNIQUE en base de datos

**Archivo:** `scripts/create-tables.sql` - Tabla `worker_salaries`

**Problema:**

```sql
-- Tabla actual NO tiene UNIQUE constraint
CREATE TABLE IF NOT EXISTS worker_salaries (
    worker_id UUID REFERENCES workers(id),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    -- ❌ Falta UNIQUE(worker_id, month, year)
);
```

**Solución:**

```sql
ALTER TABLE worker_salaries
ADD CONSTRAINT unique_salary_per_month
UNIQUE (worker_id, month, year);
```

---

## 🟢 6. PROBLEMAS DE PERFORMANCE

#### 6.1 Query de conteo separada (N+1)

**Archivo:** `app/api/workers/salary/route.ts` - Líneas 44 y 54-57

**Problema:**

```typescript
// Query 1: Obtener datos con filtros
const { data: salaries, error } = await query;

// Query 2: Contar registros SIN filtros
const { count } = await supabase
  .from("worker_salaries")
  .select("*", { count: "exact", head: true });
```

- Dos queries separadas
- Count no aplica filtros (bug adicional)
- Más lento que hacerlo en una sola query

---

#### 6.2 Sin caché de queries frecuentes

**Archivos:** Todos los endpoints

**Problema:**

- Cada request hace queries a Supabase
- Dashboard puede hacer 10+ queries cada vez
- Sin caché, sobrecarga innecesaria

---

#### 6.3 Dashboard con múltiples queries separadas

**Archivo:** `app/api/dashboard/stats/route.ts`

**Problema:**

```typescript
// Hace 5+ queries separadas
const usersCount = await supabase.from("users").select(...);
const workersCount = await supabase.from("workers").select(...);
const eventsCount = await supabase.from("events").select(...);
// ...
```

**Solución:** Usar una sola query con agregaciones o materialized views

---

## 🟢 7. PROBLEMAS DE FUNCIONALIDAD

#### 7.1 Módulos incompletos

**Documents:**

- Tabla existe en DB
- Endpoints existen pero no implementados completamente
- Sin UI para gestión

**Messaging:**

- Tablas de conversaciones y mensajes existen
- Endpoints no implementados
- Sin chat UI

**Integrations:**

- Solo estructura de tablas
- Sin implementación real
- Sin documentación

**Reports:**

- Estructura básica
- Sin generación real de reportes
- Sin exportación

---

## 📊 RESUMEN DE PROBLEMAS POR SEVERIDAD

### 🔴 CRÍTICOS (Corregir PRIMERO)

1. ❌ Falta autenticación real en APIs
2. ❌ Bug de paginación en workers/salary
3. ❌ Configuración insegura next.config.mjs
4. ❌ Validación insuficiente de parámetros
5. ❌ Sin verificación de sessionData.role
6. ❌ Variables de entorno sin validación

### 🟡 IMPORTANTES (Corregir DESPUÉS)

7. ⚠️ Inconsistencia en patrones de API (3 estilos diferentes)
8. ⚠️ Manejo de errores inconsistente (3 formas)
9. ⚠️ Sin validación de inputs numéricos
10. ⚠️ Endpoint PUT no persistente
11. ⚠️ Sin verificación de duplicados
12. ⚠️ Sin rate limiting efectivo

### 🟢 MEJORAS (Corregir LUEGO)

13. 🔵 Sin caché de queries
14. 🔵 Dashboard con queries múltiples
15. 🔵 Módulos incompletos (documents, messaging)
16. 🔵 Sin protección CSRF

---

## 📝 CHECKLIST DE CORRECCIÓN SUGERIDA

### Sprint 1 (1-2 días)

- [ ] Eliminar `ignoreBuilds` de next.config.mjs
- [ ] Corregir todos los errores de TypeScript expuestos
- [ ] Corregir bug de paginación en workers/salary
- [ ] Añadir validación de parámetros en todos los endpoints
- [ ] Validar estructura de sessionData en middleware

### Sprint 2 (2-3 días)

- [ ] Estandarizar patrones de API (elegir un estilo)
- [ ] Implementar autenticación JWT en todas las APIs
- [ ] Unificar manejo de errores (solo apiLogger)
- [ ] Validar inputs numéricos (no negativos, límites)

### Sprint 3 (1-2 días)

- [ ] Añadir constraint UNIQUE en worker_salaries
- [ ] Implementar verificación de duplicados en POST
- [ ] Mejorar endpoint PUT para persistir opcionalmente
- [ ] Implementar rate limiting efectivo

### Sprint 4 (1-2 días)

- [ ] Implementar caché básico
- [ ] Optimizar queries del dashboard
- [ ] Añadir protección CSRF
- [ ] Documentación de API

---

## 📈 ESTIMACIÓN DE TIEMPO

- **Sprint 1:** 1-2 días
- **Sprint 2:** 2-3 días
- **Sprint 3:** 1-2 días
- **Sprint 4:** 1-2 días

**Total:** 5-9 días de trabajo para estabilizar base del proyecto

---

**Estado actual:** ⚠️ BASE DE PROYECTO INESTABLE - NO PRODUCCIÓN
