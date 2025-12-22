# 🛡️ LÓGICAS DE NEGOCIO CRÍTICAS - RECOMENDACIONES

**Objetivo:** Asegurar la integridad, seguridad y operación correcta del sistema ERP para banquetes.

---

## 📋 ÍNDICE

1. [Validaciones Financieras](#1-validaciones-financieras)
2. [Control de Asignaciones](#2-control-de-asignaciones)
3. [Validaciones de Eventos](#3-validaciones-de-eventos)
4. [Control de Salarios](#4-control-de-salarios)
5. [Gestión de Cotizaciones](#5-gestión-de-cotizaciones)
6. [Prevención de Conflictos](#6-prevención-de-conflictos)
7. [Auditoría y Trazabilidad](#7-auditoría-y-trazabilidad)
8. [Control de Acceso por Rol](#8-control-de-acceso-por-rol)
9. [Validaciones de Estado](#9-validaciones-de-estado)
10. [Reglas de Negocio Transaccionales](#10-reglas-de-negocio-transaccionales)

---

## 1. VALIDACIONES FINANCIERAS

### 1.1. Validación de Cotizaciones

**Problema:** Cotizaciones pueden tener cálculos incorrectos o valores negativos.

**Solución:**

```typescript
// lib/business-rules/financial.ts

export function validateQuoteCalculation(quote: QuoteInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 1. Validar que subtotal = suma de servicios
  const calculatedSubtotal = quote.services.reduce(
    (sum, service) => sum + service.total,
    0
  );

  if (Math.abs(calculatedSubtotal - quote.subtotal) > 0.01) {
    errors.push(
      `Subtotal calculado (${calculatedSubtotal}) no coincide con subtotal ingresado (${quote.subtotal})`
    );
  }

  // 2. Validar que cada servicio tenga cálculo correcto
  quote.services.forEach((service, index) => {
    const calculatedTotal = service.quantity * service.unit_price;
    if (Math.abs(calculatedTotal - service.total) > 0.01) {
      errors.push(
        `Servicio ${
          index + 1
        }: Total calculado (${calculatedTotal}) no coincide con total ingresado (${
          service.total
        })`
      );
    }
  });

  // 3. Validar IVA (19% en Chile)
  const expectedTax = quote.subtotal * 0.19;
  if (Math.abs(expectedTax - quote.taxes) > 0.01) {
    errors.push(
      `IVA calculado (${expectedTax}) no coincide con IVA ingresado (${quote.taxes})`
    );
  }

  // 4. Validar total final
  const expectedTotal = quote.subtotal + quote.taxes;
  if (Math.abs(expectedTotal - quote.total) > 0.01) {
    errors.push(
      `Total calculado (${expectedTotal}) no coincide con total ingresado (${quote.total})`
    );
  }

  // 5. Validar que no haya valores negativos
  if (quote.subtotal < 0) errors.push("Subtotal no puede ser negativo");
  if (quote.taxes < 0) errors.push("IVA no puede ser negativo");
  if (quote.total < 0) errors.push("Total no puede ser negativo");

  quote.services.forEach((service, index) => {
    if (service.unit_price < 0) {
      errors.push(
        `Servicio ${index + 1}: Precio unitario no puede ser negativo`
      );
    }
    if (service.quantity < 1) {
      errors.push(`Servicio ${index + 1}: Cantidad debe ser al menos 1`);
    }
  });

  // 6. Validar monto mínimo
  const MIN_QUOTE_AMOUNT = 1000; // $1,000 mínimo
  if (quote.total < MIN_QUOTE_AMOUNT) {
    errors.push(`El monto total debe ser al menos $${MIN_QUOTE_AMOUNT}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### 1.2. Validación de Pagos

```typescript
// lib/business-rules/payments.ts

export async function validatePayment(
  payment: PaymentInput,
  event: Event
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // 1. Validar que el pago no exceda el monto del evento
  if (payment.amount > event.presupuesto_total) {
    errors.push(
      `El pago (${payment.amount}) excede el presupuesto del evento (${event.presupuesto_total})`
    );
  }

  // 2. Validar que no se paguen montos negativos
  if (payment.amount <= 0) {
    errors.push("El monto del pago debe ser mayor a 0");
  }

  // 3. Validar que el evento esté en estado válido para recibir pagos
  const validStatuses = ["confirmado", "en_progreso", "completado"];
  if (!validStatuses.includes(event.estado)) {
    errors.push(
      `No se pueden recibir pagos para eventos en estado: ${event.estado}`
    );
  }

  // 4. Validar fecha de pago (no puede ser futura)
  const paymentDate = new Date(payment.payment_date);
  const today = new Date();
  if (paymentDate > today) {
    errors.push("La fecha de pago no puede ser futura");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

---

## 2. CONTROL DE ASIGNACIONES

### 2.1. Validar Disponibilidad de Trabajadores

**Problema:** Trabajadores pueden estar asignados a múltiples eventos simultáneos.

**Solución:**

```typescript
// lib/business-rules/assignments.ts

export async function validateWorkerAvailability(
  workerId: string,
  eventDate: string,
  eventStartTime: string,
  eventEndTime: string,
  supabase: SupabaseClient
): Promise<{ isAvailable: boolean; conflicts: Conflict[] }> {
  const conflicts: Conflict[] = [];

  // 1. Buscar eventos existentes del trabajador en la misma fecha
  const { data: existingEvents, error } = await supabase
    .from("event_workers")
    .select(
      `
      event_id,
      events!inner(
        id,
        fecha_evento,
        hora_inicio,
        hora_fin,
        estado
      )
    `
    )
    .eq("worker_id", workerId)
    .eq("events.estado", "confirmado"); // Solo eventos confirmados

  if (error) {
    throw new Error(`Error al verificar disponibilidad: ${error.message}`);
  }

  // 2. Verificar solapamientos de horarios
  const newEventStart = new Date(`${eventDate}T${eventStartTime}`);
  const newEventEnd = new Date(`${eventDate}T${eventEndTime}`);

  existingEvents?.forEach((assignment: any) => {
    const existingEvent = assignment.events;
    const existingStart = new Date(
      `${existingEvent.fecha_evento}T${existingEvent.hora_inicio}`
    );
    const existingEnd = new Date(
      `${existingEvent.fecha_evento}T${existingEvent.hora_fin}`
    );

    // Verificar solapamiento
    if (
      (newEventStart >= existingStart && newEventStart < existingEnd) ||
      (newEventEnd > existingStart && newEventEnd <= existingEnd) ||
      (newEventStart <= existingStart && newEventEnd >= existingEnd)
    ) {
      conflicts.push({
        type: "schedule_overlap",
        eventId: existingEvent.id,
        message: `El trabajador ya está asignado a un evento que se solapa: ${existingEvent.fecha_evento} ${existingEvent.hora_inicio}-${existingEvent.hora_fin}`,
      });
    }
  });

  // 3. Verificar que el trabajador esté activo
  const { data: worker } = await supabase
    .from("workers")
    .select("is_active, status")
    .eq("id", workerId)
    .single();

  if (!worker?.is_active || worker?.status !== "active") {
    conflicts.push({
      type: "worker_inactive",
      message: "El trabajador no está activo",
    });
  }

  return {
    isAvailable: conflicts.length === 0,
    conflicts,
  };
}
```

### 2.2. Validar Capacidad de Evento

```typescript
// lib/business-rules/events.ts

export function validateEventCapacity(
  event: EventInput,
  assignedWorkers: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Ratio trabajadores/invitados recomendado: 1 trabajador por cada 20 invitados
  const RECOMMENDED_RATIO = 20;
  const requiredWorkers = Math.ceil(event.numero_invitados / RECOMMENDED_RATIO);

  if (assignedWorkers < requiredWorkers) {
    errors.push(
      `Se requieren al menos ${requiredWorkers} trabajadores para ${event.numero_invitados} invitados. Actualmente asignados: ${assignedWorkers}`
    );
  }

  // Validar mínimo de trabajadores
  const MIN_WORKERS = 2;
  if (assignedWorkers < MIN_WORKERS) {
    errors.push(
      `Se requiere un mínimo de ${MIN_WORKERS} trabajadores para cualquier evento`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

---

## 3. VALIDACIONES DE EVENTOS

### 3.1. Validar Transiciones de Estado

**Problema:** Eventos pueden cambiar de estado de forma inválida (ej: de "cancelado" a "en_progreso").

**Solución:**

```typescript
// lib/business-rules/event-states.ts

const VALID_STATE_TRANSITIONS: Record<string, string[]> = {
  planificando: ["confirmado", "cancelado"],
  confirmado: ["en_progreso", "cancelado"],
  en_progreso: ["completado", "cancelado"],
  completado: [], // Estado final
  cancelado: [], // Estado final
};

export function validateEventStateTransition(
  currentState: string,
  newState: string
): { isValid: boolean; error?: string } {
  // No se puede cambiar de un estado final
  if (currentState === "completado" || currentState === "cancelado") {
    return {
      isValid: false,
      error: `No se puede cambiar el estado de un evento ${currentState}`,
    };
  }

  // Verificar transición válida
  const validTransitions = VALID_STATE_TRANSITIONS[currentState] || [];
  if (!validTransitions.includes(newState)) {
    return {
      isValid: false,
      error: `No se puede cambiar de "${currentState}" a "${newState}". Transiciones válidas: ${validTransitions.join(
        ", "
      )}`,
    };
  }

  return { isValid: true };
}
```

### 3.2. Validar Fechas de Eventos

```typescript
// lib/business-rules/event-dates.ts

export function validateEventDates(
  eventDate: string,
  startTime: string,
  endTime: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const eventDateTime = new Date(`${eventDate}T${startTime}`);
  const endDateTime = new Date(`${eventDate}T${endTime}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. El evento no puede ser en el pasado
  if (eventDateTime < today) {
    errors.push("La fecha del evento no puede ser en el pasado");
  }

  // 2. Hora de fin debe ser después de hora de inicio
  if (endDateTime <= eventDateTime) {
    errors.push("La hora de fin debe ser después de la hora de inicio");
  }

  // 3. Duración mínima del evento (2 horas)
  const MIN_DURATION_HOURS = 2;
  const durationHours =
    (endDateTime.getTime() - eventDateTime.getTime()) / (1000 * 60 * 60);
  if (durationHours < MIN_DURATION_HOURS) {
    errors.push(`La duración mínima del evento es ${MIN_DURATION_HOURS} horas`);
  }

  // 4. Duración máxima del evento (24 horas)
  const MAX_DURATION_HOURS = 24;
  if (durationHours > MAX_DURATION_HOURS) {
    errors.push(`La duración máxima del evento es ${MAX_DURATION_HOURS} horas`);
  }

  // 5. No se pueden crear eventos con menos de 24 horas de anticipación
  const MIN_ADVANCE_HOURS = 24;
  const hoursUntilEvent =
    (eventDateTime.getTime() - today.getTime()) / (1000 * 60 * 60);
  if (hoursUntilEvent < MIN_ADVANCE_HOURS) {
    errors.push(
      `Los eventos deben crearse con al menos ${MIN_ADVANCE_HOURS} horas de anticipación`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

---

## 4. CONTROL DE SALARIOS

### 4.1. Validar Duplicados de Salarios

**Ya implementado parcialmente, pero mejorar:**

```typescript
// lib/business-rules/salaries.ts

export async function validateSalaryEntry(
  workerId: string,
  month: number,
  year: number,
  hoursWorked: number,
  hourlyRate: number,
  supabase: SupabaseClient
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // 1. Verificar duplicado (ya existe)
  const { data: existing } = await supabase
    .from("worker_salaries")
    .select("id")
    .eq("worker_id", workerId)
    .eq("month", month)
    .eq("year", year)
    .single();

  if (existing) {
    errors.push(
      `Ya existe un registro de salario para este trabajador en ${month}/${year}`
    );
  }

  // 2. Validar rangos
  if (month < 1 || month > 12) {
    errors.push("El mes debe estar entre 1 y 12");
  }

  if (year < 2020 || year > new Date().getFullYear() + 1) {
    errors.push("El año está fuera del rango válido");
  }

  // 3. Validar horas trabajadas (máximo 200 horas/mes)
  const MAX_HOURS_PER_MONTH = 200;
  if (hoursWorked > MAX_HOURS_PER_MONTH) {
    errors.push(
      `Las horas trabajadas (${hoursWorked}) exceden el máximo permitido (${MAX_HOURS_PER_MONTH})`
    );
  }

  if (hoursWorked <= 0) {
    errors.push("Las horas trabajadas deben ser mayores a 0");
  }

  // 4. Validar tarifa horaria
  const MIN_HOURLY_RATE = 5000; // $5,000 CLP mínimo
  const MAX_HOURLY_RATE = 100000; // $100,000 CLP máximo
  if (hourlyRate < MIN_HOURLY_RATE) {
    errors.push(
      `La tarifa horaria (${hourlyRate}) está por debajo del mínimo (${MIN_HOURLY_RATE})`
    );
  }
  if (hourlyRate > MAX_HOURLY_RATE) {
    errors.push(
      `La tarifa horaria (${hourlyRate}) excede el máximo permitido (${MAX_HOURLY_RATE})`
    );
  }

  // 5. Validar que el cálculo sea correcto
  const expectedSalary = hoursWorked * hourlyRate;
  // El salario se calculará automáticamente, pero podemos validar aquí

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

---

## 5. GESTIÓN DE COTIZACIONES

### 5.1. Validar Expiración de Cotizaciones

```typescript
// lib/business-rules/quotes.ts

export function validateQuoteExpiration(
  expirationDate: string,
  quoteDate: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const expiration = new Date(expirationDate);
  const created = new Date(quoteDate);
  const today = new Date();

  // 1. Fecha de expiración debe ser futura
  if (expiration <= today) {
    errors.push("La fecha de expiración debe ser futura");
  }

  // 2. Fecha de expiración debe ser después de la fecha de creación
  if (expiration <= created) {
    errors.push(
      "La fecha de expiración debe ser posterior a la fecha de creación"
    );
  }

  // 3. Validez mínima: 7 días
  const MIN_VALIDITY_DAYS = 7;
  const validityDays =
    (expiration.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  if (validityDays < MIN_VALIDITY_DAYS) {
    errors.push(
      `La cotización debe tener al menos ${MIN_VALIDITY_DAYS} días de validez`
    );
  }

  // 4. Validez máxima: 90 días
  const MAX_VALIDITY_DAYS = 90;
  if (validityDays > MAX_VALIDITY_DAYS) {
    errors.push(
      `La cotización no puede tener más de ${MAX_VALIDITY_DAYS} días de validez`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### 5.2. Auto-marcar Cotizaciones Expiradas

```typescript
// lib/business-rules/quotes.ts

export async function expireOldQuotes(supabase: SupabaseClient) {
  const today = new Date().toISOString();

  const { error } = await supabase
    .from("quotes")
    .update({ status: "expired" })
    .eq("status", "sent")
    .lt("expiration_date", today);

  if (error) {
    throw new Error(`Error al expirar cotizaciones: ${error.message}`);
  }
}

// Ejecutar diariamente con un cron job o función serverless
```

---

## 6. PREVENCIÓN DE CONFLICTOS

### 6.1. Detectar Conflictos de Horarios Automáticamente

```typescript
// lib/business-rules/conflicts.ts

export async function detectScheduleConflicts(
  eventId: string,
  supabase: SupabaseClient
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  // 1. Obtener evento con trabajadores asignados
  const { data: event } = await supabase
    .from("events")
    .select(
      `
      id,
      fecha_evento,
      hora_inicio,
      hora_fin,
      event_workers!inner(
        worker_id,
        workers!inner(
          id,
          user_id
        )
      )
    `
    )
    .eq("id", eventId)
    .single();

  if (!event) return conflicts;

  // 2. Para cada trabajador, verificar otros eventos
  for (const assignment of event.event_workers || []) {
    const workerId = assignment.worker_id;

    const { data: otherEvents } = await supabase
      .from("event_workers")
      .select(
        `
        event_id,
        events!inner(
          id,
          fecha_evento,
          hora_inicio,
          hora_fin,
          estado
        )
      `
      )
      .eq("worker_id", workerId)
      .neq("event_id", eventId)
      .eq("events.estado", "confirmado");

    // 3. Verificar solapamientos
    otherEvents?.forEach((other: any) => {
      const otherEvent = other.events;
      if (
        otherEvent.fecha_evento === event.fecha_evento &&
        hasTimeOverlap(
          event.hora_inicio,
          event.hora_fin,
          otherEvent.hora_inicio,
          otherEvent.hora_fin
        )
      ) {
        conflicts.push({
          type: "schedule_overlap",
          workerId,
          eventId: otherEvent.id,
          message: `Trabajador tiene conflicto de horario con evento ${otherEvent.id}`,
        });
      }
    });
  }

  return conflicts;
}

function hasTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && e1 > s2;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
```

---

## 7. AUDITORÍA Y TRAZABILIDAD

### 7.1. Sistema de Auditoría

```typescript
// lib/business-rules/audit.ts

export async function logAuditEvent(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  changes: Record<string, any>,
  supabase: SupabaseClient
) {
  const { error } = await supabase.from("audit_logs").insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    user_id: userId,
    changes: changes,
    ip_address: null, // Se puede obtener del request
    user_agent: null, // Se puede obtener del request
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error al registrar auditoría:", error);
    // No lanzar error para no interrumpir el flujo principal
  }
}

// Uso en APIs:
export const POST = async (request: NextRequest) => {
  // ... lógica de creación
  await logAuditEvent(
    "CREATE",
    "event",
    newEventId,
    userId,
    { before: null, after: newEvent },
    supabase
  );
};
```

### 7.2. Tabla de Auditoría (SQL)

```sql
-- scripts/add-audit-system.sql

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, VIEW
    entity_type VARCHAR(50) NOT NULL, -- event, worker, quote, etc.
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    changes JSONB, -- { before: {...}, after: {...} }
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 8. CONTROL DE ACCESO POR ROL

### 8.1. Middleware de Autorización

```typescript
// lib/business-rules/authorization.ts

export function requireRole(
  allowedRoles: string[],
  userRole: string
): { authorized: boolean; error?: string } {
  if (!allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      error: `Acceso denegado. Roles permitidos: ${allowedRoles.join(", ")}`,
    };
  }
  return { authorized: true };
}

// Uso en APIs:
export const DELETE = async (request: NextRequest) => {
  const session = getSession(request);
  const auth = requireRole(["admin"], session.role);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }
  // ... resto del código
};
```

### 8.2. Reglas de Acceso por Entidad

```typescript
// lib/business-rules/entity-access.ts

const ENTITY_ACCESS_RULES: Record<string, string[]> = {
  workers: {
    view: ["admin", "worker"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
  events: {
    view: ["admin", "worker"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
  quotes: {
    view: ["admin"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
  // Workers solo pueden ver sus propios datos
  "workers.self": {
    view: ["admin", "worker"],
    update: ["worker"], // Solo sus propios datos
  },
};

export function canAccessEntity(
  entity: string,
  action: string,
  userRole: string,
  userId?: string,
  entityUserId?: string
): boolean {
  // Si es acceso a datos propios
  if (entity.includes(".self") && userId === entityUserId) {
    return true;
  }

  const rules = ENTITY_ACCESS_RULES[entity];
  if (!rules) return false;

  const allowedRoles = rules[action];
  if (!allowedRoles) return false;

  return allowedRoles.includes(userRole);
}
```

---

## 9. VALIDACIONES DE ESTADO

### 9.1. Validar Preregistro → Evento

```typescript
// lib/business-rules/preregistrations.ts

export async function validatePreregistrationToEvent(
  preregistrationId: string,
  supabase: SupabaseClient
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  const { data: prereg } = await supabase
    .from("preregistrations")
    .select("*")
    .eq("id", preregistrationId)
    .single();

  if (!prereg) {
    errors.push("Preregistro no encontrado");
    return { isValid: false, errors };
  }

  // 1. Solo preregistros aprobados pueden convertirse en eventos
  if (prereg.status !== "approved") {
    errors.push(
      `Solo preregistros aprobados pueden convertirse en eventos. Estado actual: ${prereg.status}`
    );
  }

  // 2. Verificar que no haya un evento ya creado
  const { data: existingEvent } = await supabase
    .from("events")
    .select("id")
    .eq("preregistration_id", preregistrationId)
    .single();

  if (existingEvent) {
    errors.push("Ya existe un evento creado para este preregistro");
  }

  // 3. Validar que la fecha del evento no haya pasado
  const eventDate = new Date(prereg.event_date);
  const today = new Date();
  if (eventDate < today) {
    errors.push("La fecha del evento del preregistro ya pasó");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

---

## 10. REGLAS DE NEGOCIO TRANSACCIONALES

### 10.1. Transacción: Crear Evento con Asignaciones

```typescript
// lib/business-rules/transactions.ts

export async function createEventWithAssignments(
  eventData: EventInput,
  workerIds: string[],
  supabase: SupabaseClient
): Promise<{ success: boolean; eventId?: string; errors: string[] }> {
  const errors: string[] = [];

  // 1. Validar datos del evento
  const dateValidation = validateEventDates(
    eventData.fecha_evento,
    eventData.hora_inicio,
    eventData.hora_fin
  );
  if (!dateValidation.isValid) {
    errors.push(...dateValidation.errors);
  }

  // 2. Validar cada trabajador
  for (const workerId of workerIds) {
    const availability = await validateWorkerAvailability(
      workerId,
      eventData.fecha_evento,
      eventData.hora_inicio,
      eventData.hora_fin,
      supabase
    );
    if (!availability.isAvailable) {
      errors.push(
        ...availability.conflicts.map(
          (c) => `Trabajador ${workerId}: ${c.message}`
        )
      );
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // 3. Crear evento en transacción
  try {
    // Iniciar transacción (Supabase no tiene transacciones explícitas,
    // pero podemos usar un enfoque de "todo o nada")

    // 3.1. Crear evento
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        ...eventData,
        estado: "planificando",
      })
      .select()
      .single();

    if (eventError || !event) {
      throw new Error(`Error al crear evento: ${eventError?.message}`);
    }

    // 3.2. Crear asignaciones
    const assignments = workerIds.map((workerId) => ({
      event_id: event.id,
      worker_id: workerId,
      role: "worker", // o determinar según lógica
      assigned_at: new Date().toISOString(),
    }));

    const { error: assignmentError } = await supabase
      .from("event_workers")
      .insert(assignments);

    if (assignmentError) {
      // Rollback: eliminar evento creado
      await supabase.from("events").delete().eq("id", event.id);
      throw new Error(
        `Error al asignar trabajadores: ${assignmentError.message}`
      );
    }

    // 3.3. Registrar auditoría
    await logAuditEvent(
      "CREATE",
      "event",
      event.id,
      "current-user-id", // Obtener del contexto
      { before: null, after: event },
      supabase
    );

    return { success: true, eventId: event.id, errors: [] };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Error desconocido"],
    };
  }
}
```

---

## 📝 IMPLEMENTACIÓN RECOMENDADA

### Prioridad Alta (Implementar Primero)

1. ✅ **Validaciones Financieras** (Cotizaciones y Pagos)
2. ✅ **Control de Asignaciones** (Disponibilidad de trabajadores)
3. ✅ **Validaciones de Estado** (Transiciones válidas)
4. ✅ **Control de Acceso** (Por rol)

### Prioridad Media

5. ⚠️ **Auditoría y Trazabilidad**
6. ⚠️ **Prevención de Conflictos**
7. ⚠️ **Validaciones de Fechas**

### Prioridad Baja

8. ⚪ **Auto-expiración de Cotizaciones**
9. ⚪ **Validaciones de Capacidad**

---

## 🚀 PRÓXIMOS PASOS

1. **Crear archivo de reglas de negocio:**

   ```bash
   lib/business-rules/
   ├── financial.ts
   ├── assignments.ts
   ├── events.ts
   ├── salaries.ts
   ├── quotes.ts
   ├── conflicts.ts
   ├── audit.ts
   ├── authorization.ts
   └── transactions.ts
   ```

2. **Integrar en APIs existentes:**

   - Agregar validaciones antes de crear/actualizar
   - Implementar transacciones donde sea necesario
   - Agregar logging de auditoría

3. **Crear tests unitarios:**

   - Probar cada regla de negocio
   - Validar casos edge

4. **Documentar reglas:**
   - Documentar cada regla en el código
   - Crear guía de reglas de negocio para usuarios

---

**Última Actualización:** $(date)
