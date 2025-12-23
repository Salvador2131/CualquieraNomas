/**
 * Reglas de Negocio: Gestión de Cotizaciones
 *
 * Este módulo contiene todas las validaciones relacionadas con:
 * - Expiración de cotizaciones
 * - Validación de fechas
 * - Auto-marcado de expiración
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationResult } from "./financial";

/**
 * Valida la fecha de expiración de una cotización
 */
export function validateQuoteExpiration(
  expirationDate: string,
  quoteDate: string
): ValidationResult {
  const errors: string[] = [];

  try {
    const expiration = new Date(expirationDate);
    const created = new Date(quoteDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        `La cotización debe tener al menos ${MIN_VALIDITY_DAYS} días de validez. Validez actual: ${validityDays.toFixed(
          1
        )} días`
      );
    }

    // 4. Validez máxima: 90 días
    const MAX_VALIDITY_DAYS = 90;
    if (validityDays > MAX_VALIDITY_DAYS) {
      errors.push(
        `La cotización no puede tener más de ${MAX_VALIDITY_DAYS} días de validez. Validez actual: ${validityDays.toFixed(
          1
        )} días`
      );
    }
  } catch (error) {
    errors.push(
      `Error al validar fecha de expiración: ${
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
 * Marca automáticamente las cotizaciones expiradas
 */
export async function expireOldQuotes(
  supabase: SupabaseClient,
  organizationId?: string
): Promise<{
  expiredCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const today = new Date().toISOString();

  try {
    // Buscar cotizaciones enviadas que han expirado
    let quotesQuery = supabase
      .from("quotes")
      .select("id")
      .eq("status", "sent")
      .lt("expiration_date", today);

    // Aplicar filtro de organización si se proporciona
    if (organizationId) {
      quotesQuery = quotesQuery.eq("organization_id", organizationId);
    }

    const { data: expiredQuotes, error: findError } = await quotesQuery;

    if (findError) {
      errors.push(
        `Error al buscar cotizaciones expiradas: ${findError.message}`
      );
      return { expiredCount: 0, errors };
    }

    if (!expiredQuotes || expiredQuotes.length === 0) {
      return { expiredCount: 0, errors: [] };
    }

    // Actualizar estado a expirado
    let updateQuery = supabase
      .from("quotes")
      .update({ status: "expired" })
      .eq("status", "sent")
      .lt("expiration_date", today);

    // Aplicar filtro de organización si se proporciona
    if (organizationId) {
      updateQuery = updateQuery.eq("organization_id", organizationId);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      errors.push(`Error al expirar cotizaciones: ${updateError.message}`);
      return { expiredCount: 0, errors };
    }

    return {
      expiredCount: expiredQuotes.length,
      errors: [],
    };
  } catch (error) {
    errors.push(
      `Error inesperado al expirar cotizaciones: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
    return { expiredCount: 0, errors };
  }
}

/**
 * Verifica si una cotización está expirada
 */
export function isQuoteExpired(
  expirationDate: string,
  currentStatus: string
): boolean {
  if (currentStatus === "expired" || currentStatus === "accepted") {
    return currentStatus === "expired";
  }

  const expiration = new Date(expirationDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return expiration < today;
}

/**
 * Calcula los días restantes hasta la expiración
 */
export function getDaysUntilExpiration(expirationDate: string): number {
  const expiration = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiration.setHours(0, 0, 0, 0);

  const diffTime = expiration.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Obtiene el estado de una cotización considerando su expiración
 */
export function getQuoteStatusWithExpiration(
  status: string,
  expirationDate: string
): {
  status: string;
  isExpired: boolean;
  daysUntilExpiration: number;
  warning: string | null;
} {
  const isExpired = isQuoteExpired(expirationDate, status);
  const daysUntilExpiration = getDaysUntilExpiration(expirationDate);

  let finalStatus = status;
  if (isExpired && status === "sent") {
    finalStatus = "expired";
  }

  let warning: string | null = null;
  if (!isExpired && daysUntilExpiration <= 7 && status === "sent") {
    warning = `Esta cotización expira en ${daysUntilExpiration} día${
      daysUntilExpiration !== 1 ? "s" : ""
    }`;
  }

  return {
    status: finalStatus,
    isExpired,
    daysUntilExpiration,
    warning,
  };
}

/**
 * Valida que una cotización pueda ser aceptada
 */
export function canAcceptQuote(
  status: string,
  expirationDate: string
): ValidationResult {
  const errors: string[] = [];

  if (status === "accepted") {
    errors.push("Esta cotización ya ha sido aceptada");
  }

  if (status === "rejected") {
    errors.push("Esta cotización ha sido rechazada y no puede ser aceptada");
  }

  if (status === "expired") {
    errors.push("Esta cotización ha expirado y no puede ser aceptada");
  }

  if (isQuoteExpired(expirationDate, status)) {
    errors.push("Esta cotización ha expirado");
  }

  if (status !== "sent" && status !== "draft") {
    errors.push(
      `Solo se pueden aceptar cotizaciones con estado "sent" o "draft". Estado actual: ${status}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida que una cotización pueda ser rechazada
 */
export function canRejectQuote(status: string): ValidationResult {
  const errors: string[] = [];

  if (status === "rejected") {
    errors.push("Esta cotización ya ha sido rechazada");
  }

  if (status === "accepted") {
    errors.push("Esta cotización ya ha sido aceptada y no puede ser rechazada");
  }

  if (status === "expired") {
    errors.push("Esta cotización ha expirado y no puede ser rechazada");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
