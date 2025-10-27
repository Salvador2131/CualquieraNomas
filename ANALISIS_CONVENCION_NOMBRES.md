# 📝 ANÁLISIS DE CONVENCIONES DE NOMBRES

## 🔍 ANÁLISIS DE TUS TABLAS EXISTENTES

### ✅ CONVENCIONES QUE YA USAS (Inglés):

**Tablas:**

- users, workers, employers, events, event_workers

**Columnas:**

- id, user_id, email, full_name, phone
- created_at, updated_at (snake_case, inglés)
- status, availability_status
- hourly_rate, total_events, total_spent
- event_date, start_time, end_time

**Observación:** Tienes la estructura PRINCIPAL en inglés ✅

### ⚠️ EXCEPCIÓN (Español):

- preregistrations tiene: nombre_completo, telefono, estado

---

## 💡 RECOMENDACIÓN

### ✅ USAR INGLÉS (Recomendado)

**Razones:**

1. ✅ Tu código ya está en inglés (TypeScript, React)
2. ✅ Next.js y Supabase usan inglés
3. ✅ Es el estándar de la industria
4. ✅ Más fácil para colaboración
5. ✅ Mejor integración con librerías

**Tu esquema actual está 95% en inglés, mantener inglés es consistente.**

---

## 🔧 QUÉ HACER

### Opción 1: Mantener INGLÉS (Recomendado) ✅

- Mantener todas las tablas en inglés
- Usar snake_case consistente
- Empleadores/eventos ya en inglés

**Tabla preregistrations necesita ajustes:**

- nombre_completo → full_name ✅
- telefono → phone ✅
- estado → status ✅
- mantener fecha_estimada → estimated_date ✅

### Opción 2: Cambiar todo a ESPAÑOL (No recomendado) ❌

Requiere:

- ⚠️ Refactorizar todo el código
- ⚠️ Cambiar queries en APIs
- ⚠️ Reescribir schemas Zod
- ⚠️ 20+ horas de trabajo
- ⚠️ Alto riesgo de errores

---

## 🎯 DECISIÓN

**Mi recomendación: MANTENER INGLÉS** ✅

Motivos:

1. Ya tienes 95% en inglés
2. Código en inglés es más limpio
3. Mejor para desarrollo futuro
4. Más fácil de mantener

**¿Qué hacer con preregistrations?**

- Opción A: Cambiar español→inglés en Supabase
- Opción B: Dejarlo como está (solo esa tabla en español)

---

## 📋 MI RECOMENDACIÓN FINAL

### ✅ Continuar con INGLÉS

1. Mantener snake_case
2. Nombres descriptivos en inglés
3. Consistencia total
4. Mejor para escalabilidad

**Ajustar únicamente preregistrations** (opcional)

```sql
-- Si quieres hacer preregistrations en inglés:
ALTER TABLE preregistrations RENAME COLUMN nombre_completo TO full_name;
ALTER TABLE preregistrations RENAME COLUMN telefono TO phone;
ALTER TABLE preregistrations RENAME COLUMN tipo_evento TO event_type;
ALTER TABLE preregistrations RENAME COLUMN fecha_estimada TO estimated_date;
ALTER TABLE preregistrations RENAME COLUMN numero_invitados TO guest_count;
ALTER TABLE preregistrations RENAME COLUMN presupuesto_estimado TO estimated_budget;
ALTER TABLE preregistrations RENAME COLUMN mensaje TO message;
ALTER TABLE preregistrations RENAME COLUMN estado TO status;
```

**O dejar preregistrations como está** (es la única excepción)

---

## ✅ DECISIÓN

**Voy a crear el script 2_CREAR_TABLAS_FALTANTES.sql usando inglés** para ser consistente con tus otras 5 tablas.

¿Estás de acuerdo o prefieres español?
