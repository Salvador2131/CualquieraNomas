/**
 * Reglas de Negocio: Prevención de Conflictos
 *
 * Este módulo contiene todas las funcionalidades relacionadas con:
 * - Detección de conflictos de horarios
 * - Validación de solapamientos
 * - Resolución de conflictos
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { Conflict, AvailabilityCheck } from "./assignments";

export interface ScheduleConflict {
  workerId: string;
  workerName?: string;
  conflictingEventId: string;
  conflictingEventTitle?: string;
  conflictingEventDate: string;
  conflictingEventStart: string;
  conflictingEventEnd: string;
  newEventDate: string;
  newEventStart: string;
  newEventEnd: string;
}

/**
 * Detecta conflictos de horarios para un evento
 */
export async function detectScheduleConflicts(
  eventId: string,
  eventDate: string,
  eventStartTime: string,
  eventEndTime: string,
  supabase: SupabaseClient
): Promise<ScheduleConflict[]> {
  const conflicts: ScheduleConflict[] = [];

  try {
    // 1. Obtener evento con trabajadores asignados
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
        id,
        titulo,
        fecha_evento,
        hora_inicio,
        hora_fin,
        event_workers!inner(
          worker_id,
          workers!inner(
            id,
            name
          )
        )
      `
      )
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return conflicts;
    }

    // 2. Para cada trabajador, verificar otros eventos
    for (const assignment of event.event_workers || []) {
      const workerId = assignment.worker_id;
      const workerName = assignment.workers?.name;

      const { data: otherEvents, error: otherEventsError } = await supabase
        .from("event_workers")
        .select(
          `
          event_id,
          events!inner(
            id,
            titulo,
            fecha_evento,
            hora_inicio,
            hora_fin,
            estado
          )
        `
        )
        .eq("worker_id", workerId)
        .neq("event_id", eventId)
        .in("events.estado", ["planificando", "confirmado", "en_progreso"]);

      if (otherEventsError) {
        continue;
      }

      // 3. Verificar solapamientos
      otherEvents?.forEach((other: any) => {
        const otherEvent = other.events;
        if (!otherEvent) return;

        if (
          otherEvent.fecha_evento === eventDate &&
          hasTimeOverlap(
            eventStartTime,
            eventEndTime,
            otherEvent.hora_inicio,
            otherEvent.hora_fin
          )
        ) {
          conflicts.push({
            workerId,
            workerName,
            conflictingEventId: otherEvent.id,
            conflictingEventTitle: otherEvent.titulo,
            conflictingEventDate: otherEvent.fecha_evento,
            conflictingEventStart: otherEvent.hora_inicio,
            conflictingEventEnd: otherEvent.hora_fin,
            newEventDate: eventDate,
            newEventStart: eventStartTime,
            newEventEnd: eventEndTime,
          });
        }
      });
    }

    return conflicts;
  } catch (error) {
    console.error("Error al detectar conflictos:", error);
    return conflicts;
  }
}

/**
 * Verifica si dos rangos de tiempo se solapan
 */
export function hasTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  // Solapamiento si:
  // - El inicio de uno está dentro del rango del otro
  // - O uno contiene completamente al otro
  return s1 < e2 && e1 > s2;
}

/**
 * Convierte una hora en formato HH:MM a minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Calcula la duración del solapamiento en minutos
 */
export function calculateOverlapDuration(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): number {
  if (!hasTimeOverlap(start1, end1, start2, end2)) {
    return 0;
  }

  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  const overlapStart = Math.max(s1, s2);
  const overlapEnd = Math.min(e1, e2);

  return overlapEnd - overlapStart;
}

/**
 * Detecta conflictos antes de asignar un trabajador a un evento
 */
export async function detectWorkerConflict(
  workerId: string,
  eventDate: string,
  eventStartTime: string,
  eventEndTime: string,
  excludeEventId: string | null,
  supabase: SupabaseClient
): Promise<ScheduleConflict[]> {
  const conflicts: ScheduleConflict[] = [];

  try {
    // Buscar otros eventos del trabajador en la misma fecha
    let query = supabase
      .from("event_workers")
      .select(
        `
        event_id,
        events!inner(
          id,
          titulo,
          fecha_evento,
          hora_inicio,
          hora_fin,
          estado
        ),
        workers!inner(
          id,
          name
        )
      `
      )
      .eq("worker_id", workerId)
      .eq("events.fecha_evento", eventDate)
      .in("events.estado", ["planificando", "confirmado", "en_progreso"]);

    if (excludeEventId) {
      query = query.neq("event_id", excludeEventId);
    }

    const { data: assignments, error } = await query;

    if (error) {
      return conflicts;
    }

    // Verificar solapamientos
    assignments?.forEach((assignment: any) => {
      const event = assignment.events;
      const worker = assignment.workers;

      if (
        event &&
        hasTimeOverlap(
          eventStartTime,
          eventEndTime,
          event.hora_inicio,
          event.hora_fin
        )
      ) {
        conflicts.push({
          workerId,
          workerName: worker?.name,
          conflictingEventId: event.id,
          conflictingEventTitle: event.titulo,
          conflictingEventDate: event.fecha_evento,
          conflictingEventStart: event.hora_inicio,
          conflictingEventEnd: event.hora_fin,
          newEventDate: eventDate,
          newEventStart: eventStartTime,
          newEventEnd: eventEndTime,
        });
      }
    });

    return conflicts;
  } catch (error) {
    console.error("Error al detectar conflicto de trabajador:", error);
    return conflicts;
  }
}

/**
 * Valida si se pueden resolver conflictos automáticamente
 */
export function canAutoResolveConflict(
  conflict: ScheduleConflict,
  toleranceMinutes: number = 30
): boolean {
  const overlapDuration = calculateOverlapDuration(
    conflict.newEventStart,
    conflict.newEventEnd,
    conflict.conflictingEventStart,
    conflict.conflictingEventEnd
  );

  // Si el solapamiento es menor a la tolerancia, se puede resolver automáticamente
  return overlapDuration <= toleranceMinutes;
}

/**
 * Obtiene un resumen de conflictos para un evento
 */
export async function getEventConflictsSummary(
  eventId: string,
  supabase: SupabaseClient
): Promise<{
  totalConflicts: number;
  conflicts: ScheduleConflict[];
  canAutoResolve: boolean;
}> {
  const { data: event } = await supabase
    .from("events")
    .select("id, fecha_evento, hora_inicio, hora_fin")
    .eq("id", eventId)
    .single();

  if (!event) {
    return {
      totalConflicts: 0,
      conflicts: [],
      canAutoResolve: true,
    };
  }

  const conflicts = await detectScheduleConflicts(
    eventId,
    event.fecha_evento,
    event.hora_inicio,
    event.hora_fin,
    supabase
  );

  const canAutoResolve = conflicts.every((conflict) =>
    canAutoResolveConflict(conflict)
  );

  return {
    totalConflicts: conflicts.length,
    conflicts,
    canAutoResolve,
  };
}
