/**
 * Reglas de Negocio: Validaciones de Eventos
 *
 * Este módulo contiene todas las validaciones relacionadas con:
 * - Fechas y horarios
 * - Transiciones de estado
 * - Validación de datos de eventos
 */

import { ValidationResult } from "./financial";

export interface EventDateInput {
  fecha_evento: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface EventStateTransition {
  currentState: string;
  newState: string;
}

/**
 * Mapa de transiciones de estado válidas
 */
const VALID_STATE_TRANSITIONS: Record<string, string[]> = {
  planificando: ["confirmado", "cancelado"],
  confirmado: ["en_progreso", "cancelado"],
  en_progreso: ["completado", "cancelado"],
  completado: [], // Estado final
  cancelado: [], // Estado final
};

/**
 * Valida las fechas y horarios de un evento
 */
export function validateEventDates(
  eventDate: string,
  startTime: string,
  endTime: string
): ValidationResult {
  const errors: string[] = [];

  try {
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
      errors.push(
        `La duración mínima del evento es ${MIN_DURATION_HOURS} horas. Duración actual: ${durationHours.toFixed(
          1
        )} horas`
      );
    }

    // 4. Duración máxima del evento (24 horas)
    const MAX_DURATION_HOURS = 24;
    if (durationHours > MAX_DURATION_HOURS) {
      errors.push(
        `La duración máxima del evento es ${MAX_DURATION_HOURS} horas. Duración actual: ${durationHours.toFixed(
          1
        )} horas`
      );
    }

    // 5. No se pueden crear eventos con menos de 24 horas de anticipación
    const MIN_ADVANCE_HOURS = 24;
    const hoursUntilEvent =
      (eventDateTime.getTime() - today.getTime()) / (1000 * 60 * 60);
    if (hoursUntilEvent < MIN_ADVANCE_HOURS) {
      errors.push(
        `Los eventos deben crearse con al menos ${MIN_ADVANCE_HOURS} horas de anticipación. Tiempo restante: ${hoursUntilEvent.toFixed(
          1
        )} horas`
      );
    }

    // 6. Validar formato de hora (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      errors.push(
        `Formato de hora de inicio inválido: "${startTime}". Debe ser HH:MM (ej: 14:30)`
      );
    }
    if (!timeRegex.test(endTime)) {
      errors.push(
        `Formato de hora de fin inválido: "${endTime}". Debe ser HH:MM (ej: 18:00)`
      );
    }

    // 7. Validar que las horas estén en rango válido (6:00 AM - 2:00 AM siguiente día)
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    const startMinute = parseInt(startTime.split(":")[1]);
    const endMinute = parseInt(endTime.split(":")[1]);

    if (startHour < 6 && startHour >= 2) {
      errors.push(
        "La hora de inicio debe estar entre las 6:00 AM y las 2:00 AM del día siguiente"
      );
    }

    // 8. Validar que el evento no termine después de las 2:00 AM del día siguiente
    if (endHour > 2 && endHour < 6) {
      // Si termina entre 2 AM y 6 AM, es del día siguiente, lo cual está permitido
      // Pero validamos que no sea más de 24 horas después del inicio
      const nextDayEnd = new Date(endDateTime);
      nextDayEnd.setDate(nextDayEnd.getDate() + 1);
      const totalHours =
        (nextDayEnd.getTime() - eventDateTime.getTime()) / (1000 * 60 * 60);
      if (totalHours > MAX_DURATION_HOURS) {
        errors.push(
          "El evento no puede extenderse más de 24 horas desde su inicio"
        );
      }
    }
  } catch (error) {
    errors.push(
      `Error al validar fechas: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida una transición de estado de evento
 */
export function validateEventStateTransition(
  currentState: string,
  newState: string
): ValidationResult {
  const errors: string[] = [];

  // No se puede cambiar de un estado final
  if (currentState === "completado" || currentState === "cancelado") {
    errors.push(
      `No se puede cambiar el estado de un evento ${currentState}. Los eventos completados o cancelados no pueden modificarse.`
    );
    return { isValid: false, errors };
  }

  // Verificar transición válida
  const validTransitions = VALID_STATE_TRANSITIONS[currentState] || [];
  if (!validTransitions.includes(newState)) {
    errors.push(
      `No se puede cambiar de "${currentState}" a "${newState}". Transiciones válidas desde "${currentState}": ${
        validTransitions.join(", ") || "ninguna"
      }`
    );
  }

  // Validar que no se intente cambiar al mismo estado
  if (currentState === newState) {
    errors.push(
      `El evento ya está en estado "${currentState}". No es necesario cambiar el estado.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida que un evento tenga todos los datos requeridos para cambiar a un estado específico
 */
export function validateEventDataForState(
  event: {
    fecha_evento?: string;
    hora_inicio?: string;
    hora_fin?: string;
    ubicacion?: string;
    numero_invitados?: number;
    presupuesto_total?: number;
    trabajadores_asignados?: string[];
  },
  targetState: string
): ValidationResult {
  const errors: string[] = [];

  // Para eventos confirmados o en progreso, se requieren más datos
  if (targetState === "confirmado" || targetState === "en_progreso") {
    if (!event.fecha_evento) {
      errors.push("La fecha del evento es requerida para confirmar");
    }
    if (!event.hora_inicio) {
      errors.push("La hora de inicio es requerida para confirmar");
    }
    if (!event.hora_fin) {
      errors.push("La hora de fin es requerida para confirmar");
    }
    if (!event.ubicacion) {
      errors.push("La ubicación es requerida para confirmar");
    }
    if (!event.numero_invitados || event.numero_invitados < 1) {
      errors.push("El número de invitados es requerido para confirmar");
    }
    if (!event.presupuesto_total || event.presupuesto_total <= 0) {
      errors.push("El presupuesto es requerido para confirmar");
    }
    if (
      !event.trabajadores_asignados ||
      event.trabajadores_asignados.length === 0
    ) {
      errors.push(
        "Se requiere al menos un trabajador asignado para confirmar el evento"
      );
    }
  }

  // Para eventos en progreso, se requieren datos adicionales
  if (targetState === "en_progreso") {
    // Validar que la fecha del evento sea hoy o en el pasado
    if (event.fecha_evento) {
      const eventDate = new Date(event.fecha_evento);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate > today) {
        errors.push(
          "No se puede marcar un evento como 'en progreso' si la fecha es futura"
        );
      }
    }
  }

  // Para eventos completados, validar que la fecha haya pasado
  if (targetState === "completado") {
    if (event.fecha_evento) {
      const eventDate = new Date(event.fecha_evento);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (eventDate > today) {
        errors.push(
          "No se puede marcar un evento como 'completado' si la fecha es futura"
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida el número de invitados
 */
export function validateGuestCount(guestCount: number): ValidationResult {
  const errors: string[] = [];

  const MIN_GUESTS = 1;
  const MAX_GUESTS = 10000;

  if (guestCount < MIN_GUESTS) {
    errors.push(`Debe haber al menos ${MIN_GUESTS} invitado`);
  }

  if (guestCount > MAX_GUESTS) {
    errors.push(
      `El número máximo de invitados es ${MAX_GUESTS}. Número ingresado: ${guestCount}`
    );
  }

  if (!Number.isInteger(guestCount)) {
    errors.push("El número de invitados debe ser un número entero");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida el presupuesto de un evento
 */
export function validateEventBudget(budget: number): ValidationResult {
  const errors: string[] = [];

  const MIN_BUDGET = 1000; // $1,000 CLP mínimo
  const MAX_BUDGET = 100000000; // $100,000,000 CLP máximo

  if (budget < MIN_BUDGET) {
    errors.push(
      `El presupuesto mínimo es $${MIN_BUDGET.toLocaleString()} CLP. Presupuesto ingresado: $${budget.toLocaleString()}`
    );
  }

  if (budget > MAX_BUDGET) {
    errors.push(
      `El presupuesto máximo es $${MAX_BUDGET.toLocaleString()} CLP. Presupuesto ingresado: $${budget.toLocaleString()}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
