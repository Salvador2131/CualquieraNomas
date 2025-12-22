/**
 * Reglas de Negocio: Control de Asignaciones
 *
 * Este módulo contiene todas las validaciones relacionadas con:
 * - Disponibilidad de trabajadores
 * - Conflictos de horarios
 * - Capacidad de eventos
 * - Asignaciones múltiples
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationResult } from "./financial";

export interface Conflict {
  type: "schedule_overlap" | "worker_inactive" | "capacity_insufficient";
  eventId?: string;
  workerId?: string;
  message: string;
}

export interface AvailabilityCheck {
  isAvailable: boolean;
  conflicts: Conflict[];
}

/**
 * Valida la disponibilidad de un trabajador para un evento
 */
export async function validateWorkerAvailability(
  workerId: string,
  eventDate: string,
  eventStartTime: string,
  eventEndTime: string,
  excludeEventId: string | null,
  supabase: SupabaseClient,
  organizationId?: string
): Promise<AvailabilityCheck> {
  const conflicts: Conflict[] = [];

  try {
    // 1. Verificar que el trabajador existe y está activo
    let workerQuery = supabase
      .from("workers")
      .select("id, is_active, status, user_id, organization_id")
      .eq("id", workerId);
    
    // Aplicar filtro de organización si se proporciona
    if (organizationId) {
      workerQuery = workerQuery.eq("organization_id", organizationId);
    }
    
    const { data: worker, error: workerError } = await workerQuery.single();

    if (workerError || !worker) {
      conflicts.push({
        type: "worker_inactive",
        workerId,
        message: `Trabajador no encontrado: ${
          workerError?.message || "ID inválido"
        }`,
      });
      return { isAvailable: false, conflicts };
    }

    if (!worker.is_active || worker.status !== "active") {
      conflicts.push({
        type: "worker_inactive",
        workerId,
        message: "El trabajador no está activo",
      });
      return { isAvailable: false, conflicts };
    }

    // 2. Buscar eventos existentes del trabajador en la misma fecha
    let query = supabase
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
      .in("events.estado", ["planificando", "confirmado", "en_progreso"]);

    // Excluir el evento actual si se está editando
    if (excludeEventId) {
      query = query.neq("event_id", excludeEventId);
    }

    const { data: existingAssignments, error: assignmentError } = await query;

    if (assignmentError) {
      conflicts.push({
        type: "schedule_overlap",
        workerId,
        message: `Error al verificar disponibilidad: ${assignmentError.message}`,
      });
      return { isAvailable: false, conflicts };
    }

    // 3. Verificar solapamientos de horarios
    const newEventStart = new Date(`${eventDate}T${eventStartTime}`);
    const newEventEnd = new Date(`${eventDate}T${eventEndTime}`);

    existingAssignments?.forEach((assignment: any) => {
      const existingEvent = assignment.events;
      if (!existingEvent) return;

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
          workerId,
          message: `El trabajador ya está asignado a un evento que se solapa: ${existingEvent.fecha_evento} ${existingEvent.hora_inicio}-${existingEvent.hora_fin}`,
        });
      }
    });

    return {
      isAvailable: conflicts.length === 0,
      conflicts,
    };
  } catch (error) {
    return {
      isAvailable: false,
      conflicts: [
        {
          type: "schedule_overlap",
          workerId,
          message: `Error inesperado: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`,
        },
      ],
    };
  }
}

/**
 * Valida la capacidad de un evento según el número de trabajadores asignados
 */
export function validateEventCapacity(
  guestCount: number,
  assignedWorkersCount: number
): ValidationResult {
  const errors: string[] = [];

  // Ratio trabajadores/invitados recomendado: 1 trabajador por cada 20 invitados
  const RECOMMENDED_RATIO = 20;
  const requiredWorkers = Math.ceil(guestCount / RECOMMENDED_RATIO);

  if (assignedWorkersCount < requiredWorkers) {
    errors.push(
      `Se requieren al menos ${requiredWorkers} trabajadores para ${guestCount} invitados. Actualmente asignados: ${assignedWorkersCount}`
    );
  }

  // Validar mínimo de trabajadores
  const MIN_WORKERS = 2;
  if (assignedWorkersCount < MIN_WORKERS) {
    errors.push(
      `Se requiere un mínimo de ${MIN_WORKERS} trabajadores para cualquier evento`
    );
  }

  // Validar máximo de trabajadores (opcional, para evitar sobre-asignación)
  const MAX_WORKERS_RATIO = 5; // 1 trabajador por cada 5 invitados máximo
  const maxWorkers = Math.ceil(guestCount / MAX_WORKERS_RATIO);
  if (assignedWorkersCount > maxWorkers) {
    errors.push(
      `Demasiados trabajadores asignados. Para ${guestCount} invitados, el máximo recomendado es ${maxWorkers} trabajadores. Actualmente asignados: ${assignedWorkersCount}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida múltiples trabajadores a la vez
 */
export async function validateMultipleWorkers(
  workerIds: string[],
  eventDate: string,
  eventStartTime: string,
  eventEndTime: string,
  excludeEventId: string | null,
  supabase: SupabaseClient
): Promise<{
  allAvailable: boolean;
  results: Array<{
    workerId: string;
    isAvailable: boolean;
    conflicts: Conflict[];
  }>;
}> {
  const results = await Promise.all(
    workerIds.map(async (workerId) => {
      const availability = await validateWorkerAvailability(
        workerId,
        eventDate,
        eventStartTime,
        eventEndTime,
        excludeEventId,
        supabase
      );
      return {
        workerId,
        ...availability,
      };
    })
  );

  const allAvailable = results.every((result) => result.isAvailable);

  return {
    allAvailable,
    results,
  };
}

/**
 * Verifica si un trabajador tiene la especialización requerida para un evento
 */
export async function validateWorkerSpecialization(
  workerId: string,
  requiredSpecialization: string | null,
  supabase: SupabaseClient
): Promise<ValidationResult> {
  const errors: string[] = [];

  if (!requiredSpecialization) {
    return { isValid: true, errors: [] };
  }

  const { data: worker, error } = await supabase
    .from("workers")
    .select("specialization")
    .eq("id", workerId)
    .single();

  if (error || !worker) {
    errors.push(`Trabajador no encontrado: ${error?.message || "ID inválido"}`);
    return { isValid: false, errors };
  }

  if (worker.specialization !== requiredSpecialization) {
    errors.push(
      `El trabajador tiene especialización "${worker.specialization}" pero se requiere "${requiredSpecialization}"`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
