/**
 * Reglas de Negocio: Operaciones Transaccionales
 *
 * Este módulo contiene todas las funcionalidades relacionadas con:
 * - Operaciones atómicas (todo o nada)
 * - Rollback en caso de error
 * - Transacciones complejas
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { validateWorkerAvailability } from "./assignments";
import { validateEventDates, validateEventStateTransition } from "./events";
import { logCreate, logUpdate } from "./audit";

export interface CreateEventWithAssignmentsInput {
  eventData: {
    titulo: string;
    descripcion?: string;
    fecha_evento: string;
    hora_inicio: string;
    hora_fin: string;
    ubicacion: string;
    tipo_evento: string;
    numero_invitados: number;
    presupuesto_total?: number;
    estado?: string;
    checklist?: Record<string, any>;
    preregistration_id?: string;
  };
  workerIds: string[];
  userId: string;
}

export interface TransactionResult<T = any> {
  success: boolean;
  data?: T;
  errors: string[];
  rollbackActions?: Array<() => Promise<void>>;
}

/**
 * Crea un evento con asignaciones de trabajadores en una transacción
 */
export async function createEventWithAssignments(
  input: CreateEventWithAssignmentsInput,
  supabase: SupabaseClient
): Promise<TransactionResult<{ eventId: string }>> {
  const errors: string[] = [];
  const rollbackActions: Array<() => Promise<void>> = [];

  try {
    // 1. Validar datos del evento
    const dateValidation = validateEventDates(
      input.eventData.fecha_evento,
      input.eventData.hora_inicio,
      input.eventData.hora_fin
    );
    if (!dateValidation.isValid) {
      errors.push(...dateValidation.errors);
    }

    // 2. Validar cada trabajador
    for (const workerId of input.workerIds) {
      const availability = await validateWorkerAvailability(
        workerId,
        input.eventData.fecha_evento,
        input.eventData.hora_inicio,
        input.eventData.hora_fin,
        null, // No excluir ningún evento (es creación nueva)
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
      return { success: false, errors, rollbackActions: [] };
    }

    // 3. Crear evento
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        ...input.eventData,
        estado: input.eventData.estado || "planificando",
      })
      .select()
      .single();

    if (eventError || !event) {
      errors.push(
        `Error al crear evento: ${
          eventError?.message || "No se pudo crear el evento"
        }`
      );
      return { success: false, errors, rollbackActions: [] };
    }

    // Agregar acción de rollback
    rollbackActions.push(async () => {
      await supabase.from("events").delete().eq("id", event.id);
    });

    // 4. Crear asignaciones
    const assignments = input.workerIds.map((workerId) => ({
      event_id: event.id,
      worker_id: workerId,
      role: "worker",
      assigned_at: new Date().toISOString(),
    }));

    const { data: createdAssignments, error: assignmentError } = await supabase
      .from("event_workers")
      .insert(assignments)
      .select();

    if (assignmentError) {
      // Rollback: eliminar evento creado
      await supabase.from("events").delete().eq("id", event.id);
      errors.push(`Error al asignar trabajadores: ${assignmentError.message}`);
      return { success: false, errors, rollbackActions: [] };
    }

    // Agregar acciones de rollback para asignaciones
    if (createdAssignments) {
      rollbackActions.push(async () => {
        const assignmentIds = createdAssignments.map((a) => a.id);
        await supabase.from("event_workers").delete().in("id", assignmentIds);
      });
    }

    // 5. Registrar auditoría
    try {
      await logCreate("event", event.id, input.userId, event, supabase);
    } catch (auditError) {
      // No fallar la transacción por error de auditoría
      console.error("Error al registrar auditoría:", auditError);
    }

    return {
      success: true,
      data: { eventId: event.id },
      errors: [],
      rollbackActions,
    };
  } catch (error) {
    // Ejecutar rollback si hay acciones pendientes
    for (const rollback of rollbackActions) {
      try {
        await rollback();
      } catch (rollbackError) {
        console.error("Error en rollback:", rollbackError);
      }
    }

    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Error desconocido"],
      rollbackActions: [],
    };
  }
}

/**
 * Actualiza un evento y valida transiciones de estado
 */
export async function updateEventWithStateValidation(
  eventId: string,
  updates: {
    estado?: string;
    [key: string]: any;
  },
  currentEventData: {
    estado: string;
    [key: string]: any;
  },
  userId: string,
  supabase: SupabaseClient
): Promise<TransactionResult<{ eventId: string }>> {
  const errors: string[] = [];

  try {
    // 1. Si se está cambiando el estado, validar transición
    if (updates.estado && updates.estado !== currentEventData.estado) {
      const stateValidation = validateEventStateTransition(
        currentEventData.estado,
        updates.estado
      );
      if (!stateValidation.isValid) {
        errors.push(...stateValidation.errors);
        return { success: false, errors };
      }
    }

    // 2. Actualizar evento
    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update(updates)
      .eq("id", eventId)
      .select()
      .single();

    if (updateError || !updatedEvent) {
      errors.push(
        `Error al actualizar evento: ${
          updateError?.message || "No se pudo actualizar"
        }`
      );
      return { success: false, errors };
    }

    // 3. Registrar auditoría
    try {
      await logUpdate(
        "event",
        eventId,
        userId,
        currentEventData,
        updatedEvent,
        supabase
      );
    } catch (auditError) {
      console.error("Error al registrar auditoría:", auditError);
    }

    return {
      success: true,
      data: { eventId },
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Error desconocido"],
    };
  }
}

/**
 * Ejecuta rollback de una transacción
 */
export async function rollbackTransaction(
  rollbackActions: Array<() => Promise<void>>
): Promise<void> {
  for (const rollback of rollbackActions) {
    try {
      await rollback();
    } catch (error) {
      console.error("Error en rollback:", error);
      // Continuar con otros rollbacks aunque uno falle
    }
  }
}
