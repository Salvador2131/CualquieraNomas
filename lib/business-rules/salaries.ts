/**
 * Reglas de Negocio: Control de Salarios
 *
 * Este módulo contiene todas las validaciones relacionadas con:
 * - Validación de entradas de salarios
 * - Prevención de duplicados
 * - Validación de rangos y límites
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationResult } from "./financial";

export interface SalaryInput {
  worker_id: string;
  month: number;
  year: number;
  hours_worked: number;
  hourly_rate: number;
}

/**
 * Valida una entrada de salario antes de insertarla
 */
export async function validateSalaryEntry(
  salary: SalaryInput,
  supabase: SupabaseClient
): Promise<ValidationResult> {
  const errors: string[] = [];

  // 1. Verificar duplicado (ya existe)
  const { data: existing, error: duplicateError } = await supabase
    .from("worker_salaries")
    .select("id")
    .eq("worker_id", salary.worker_id)
    .eq("month", salary.month)
    .eq("year", salary.year)
    .single();

  if (existing) {
    errors.push(
      `Ya existe un registro de salario para este trabajador en ${salary.month}/${salary.year}`
    );
  }

  if (duplicateError && duplicateError.code !== "PGRST116") {
    // PGRST116 es "no rows returned", que es esperado si no hay duplicado
    errors.push(`Error al verificar duplicados: ${duplicateError.message}`);
  }

  // 2. Validar rangos de mes
  if (salary.month < 1 || salary.month > 12) {
    errors.push("El mes debe estar entre 1 y 12");
  }

  // 3. Validar rango de año
  const currentYear = new Date().getFullYear();
  const MIN_YEAR = 2020;
  const MAX_YEAR = currentYear + 1; // Permitir año siguiente para planificación

  if (salary.year < MIN_YEAR || salary.year > MAX_YEAR) {
    errors.push(
      `El año debe estar entre ${MIN_YEAR} y ${MAX_YEAR}. Año ingresado: ${salary.year}`
    );
  }

  // 4. Validar que no sea un mes/año futuro (excepto el mes actual o siguiente)
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const salaryDate = new Date(salary.year, salary.month - 1, 1);
  const maxFutureDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  if (salaryDate > maxFutureDate) {
    errors.push(
      `No se puede registrar un salario para un mes/año más de 1 mes en el futuro. Fecha ingresada: ${salary.month}/${salary.year}`
    );
  }

  // 5. Validar horas trabajadas (máximo 200 horas/mes)
  const MAX_HOURS_PER_MONTH = 200;
  if (salary.hours_worked > MAX_HOURS_PER_MONTH) {
    errors.push(
      `Las horas trabajadas (${salary.hours_worked}) exceden el máximo permitido (${MAX_HOURS_PER_MONTH} horas/mes)`
    );
  }

  if (salary.hours_worked <= 0) {
    errors.push("Las horas trabajadas deben ser mayores a 0");
  }

  if (!Number.isInteger(salary.hours_worked)) {
    errors.push("Las horas trabajadas deben ser un número entero");
  }

  // 6. Validar tarifa horaria
  const MIN_HOURLY_RATE = 5000; // $5,000 CLP mínimo
  const MAX_HOURLY_RATE = 100000; // $100,000 CLP máximo

  if (salary.hourly_rate < MIN_HOURLY_RATE) {
    errors.push(
      `La tarifa horaria ($${salary.hourly_rate.toLocaleString()}) está por debajo del mínimo ($${MIN_HOURLY_RATE.toLocaleString()} CLP)`
    );
  }

  if (salary.hourly_rate > MAX_HOURLY_RATE) {
    errors.push(
      `La tarifa horaria ($${salary.hourly_rate.toLocaleString()}) excede el máximo permitido ($${MAX_HOURLY_RATE.toLocaleString()} CLP)`
    );
  }

  // 7. Verificar que el trabajador existe
  const { data: worker, error: workerError } = await supabase
    .from("workers")
    .select("id, hourly_rate")
    .eq("id", salary.worker_id)
    .single();

  if (workerError || !worker) {
    errors.push(
      `Trabajador no encontrado: ${workerError?.message || "ID inválido"}`
    );
  } else {
    // 8. Validar que la tarifa horaria no difiera mucho de la tarifa base del trabajador
    if (worker.hourly_rate) {
      const RATE_TOLERANCE = 0.5; // 50% de diferencia permitida
      const rateDifference = Math.abs(
        (salary.hourly_rate - worker.hourly_rate) / worker.hourly_rate
      );

      if (rateDifference > RATE_TOLERANCE) {
        errors.push(
          `La tarifa horaria ingresada ($${salary.hourly_rate.toLocaleString()}) difiere significativamente de la tarifa base del trabajador ($${worker.hourly_rate.toLocaleString()}). Diferencia: ${(
            rateDifference * 100
          ).toFixed(1)}%`
        );
      }
    }
  }

  // 9. Validar cálculo de salario total
  const expectedSalary = salary.hours_worked * salary.hourly_rate;
  const MAX_SALARY_PER_MONTH = 20000000; // $20,000,000 CLP máximo

  if (expectedSalary > MAX_SALARY_PER_MONTH) {
    errors.push(
      `El salario calculado ($${expectedSalary.toLocaleString()}) excede el máximo permitido ($${MAX_SALARY_PER_MONTH.toLocaleString()} CLP/mes)`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calcula el salario total basado en horas trabajadas y tarifa horaria
 */
export function calculateSalary(
  hoursWorked: number,
  hourlyRate: number
): number {
  return Math.round(hoursWorked * hourlyRate * 100) / 100; // Redondear a 2 decimales
}

/**
 * Valida un rango de fechas para consulta de salarios
 */
export function validateSalaryDateRange(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): ValidationResult {
  const errors: string[] = [];

  // Validar meses
  if (startMonth < 1 || startMonth > 12) {
    errors.push("El mes de inicio debe estar entre 1 y 12");
  }
  if (endMonth < 1 || endMonth > 12) {
    errors.push("El mes de fin debe estar entre 1 y 12");
  }

  // Validar años
  const currentYear = new Date().getFullYear();
  if (startYear < 2020 || startYear > currentYear + 1) {
    errors.push(`El año de inicio debe estar entre 2020 y ${currentYear + 1}`);
  }
  if (endYear < 2020 || endYear > currentYear + 1) {
    errors.push(`El año de fin debe estar entre 2020 y ${currentYear + 1}`);
  }

  // Validar que la fecha de inicio sea anterior a la fecha de fin
  const startDate = new Date(startYear, startMonth - 1, 1);
  const endDate = new Date(endYear, endMonth - 1, 1);

  if (startDate > endDate) {
    errors.push(
      "La fecha de inicio debe ser anterior o igual a la fecha de fin"
    );
  }

  // Validar que el rango no sea mayor a 12 meses
  const monthsDiff = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  const MAX_RANGE_MONTHS = 12;

  if (monthsDiff > MAX_RANGE_MONTHS) {
    errors.push(
      `El rango de fechas no puede ser mayor a ${MAX_RANGE_MONTHS} meses. Rango actual: ${monthsDiff} meses`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
