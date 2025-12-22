/**
 * Reglas de Negocio: Validaciones Financieras
 *
 * Este módulo contiene todas las validaciones relacionadas con:
 * - Cotizaciones
 * - Pagos
 * - Cálculos financieros
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface QuoteInput {
  services: Array<{
    name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  taxes: number;
  total: number;
}

export interface PaymentInput {
  amount: number;
  payment_date: string;
  event_id: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida que los cálculos de una cotización sean correctos
 */
export function validateQuoteCalculation(quote: QuoteInput): ValidationResult {
  const errors: string[] = [];
  const TOLERANCE = 0.01; // Tolerancia para comparaciones de punto flotante

  // 1. Validar que subtotal = suma de servicios
  const calculatedSubtotal = quote.services.reduce(
    (sum, service) => sum + service.total,
    0
  );

  if (Math.abs(calculatedSubtotal - quote.subtotal) > TOLERANCE) {
    errors.push(
      `Subtotal calculado (${calculatedSubtotal.toFixed(
        2
      )}) no coincide con subtotal ingresado (${quote.subtotal.toFixed(2)})`
    );
  }

  // 2. Validar que cada servicio tenga cálculo correcto
  quote.services.forEach((service, index) => {
    const calculatedTotal = service.quantity * service.unit_price;
    if (Math.abs(calculatedTotal - service.total) > TOLERANCE) {
      errors.push(
        `Servicio "${service.name}": Total calculado (${calculatedTotal.toFixed(
          2
        )}) no coincide con total ingresado (${service.total.toFixed(2)})`
      );
    }
  });

  // 3. Validar IVA (19% en Chile)
  const IVA_RATE = 0.19;
  const expectedTax = quote.subtotal * IVA_RATE;
  if (Math.abs(expectedTax - quote.taxes) > TOLERANCE) {
    errors.push(
      `IVA calculado (${expectedTax.toFixed(
        2
      )}) no coincide con IVA ingresado (${quote.taxes.toFixed(
        2
      )}). Debe ser ${(IVA_RATE * 100).toFixed(0)}% del subtotal.`
    );
  }

  // 4. Validar total final
  const expectedTotal = quote.subtotal + quote.taxes;
  if (Math.abs(expectedTotal - quote.total) > TOLERANCE) {
    errors.push(
      `Total calculado (${expectedTotal.toFixed(
        2
      )}) no coincide con total ingresado (${quote.total.toFixed(2)})`
    );
  }

  // 5. Validar que no haya valores negativos
  if (quote.subtotal < 0) {
    errors.push("Subtotal no puede ser negativo");
  }
  if (quote.taxes < 0) {
    errors.push("IVA no puede ser negativo");
  }
  if (quote.total < 0) {
    errors.push("Total no puede ser negativo");
  }

  quote.services.forEach((service, index) => {
    if (service.unit_price < 0) {
      errors.push(
        `Servicio "${service.name}": Precio unitario no puede ser negativo`
      );
    }
    if (service.quantity < 1) {
      errors.push(`Servicio "${service.name}": Cantidad debe ser al menos 1`);
    }
    if (service.total < 0) {
      errors.push(`Servicio "${service.name}": Total no puede ser negativo`);
    }
  });

  // 6. Validar monto mínimo de cotización
  const MIN_QUOTE_AMOUNT = 1000; // $1,000 CLP mínimo
  if (quote.total < MIN_QUOTE_AMOUNT) {
    errors.push(
      `El monto total (${
        quote.total
      }) debe ser al menos $${MIN_QUOTE_AMOUNT.toLocaleString()} CLP`
    );
  }

  // 7. Validar que haya al menos un servicio
  if (quote.services.length === 0) {
    errors.push("Debe haber al menos un servicio en la cotización");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida un pago contra un evento
 */
export async function validatePayment(
  payment: PaymentInput,
  eventId: string,
  supabase: SupabaseClient,
  organizationId?: string
): Promise<ValidationResult> {
  const errors: string[] = [];

  // 1. Obtener información del evento
  let eventQuery = supabase
    .from("events")
    .select("presupuesto_total, estado, organization_id")
    .eq("id", eventId);
  
  // Aplicar filtro de organización si se proporciona
  if (organizationId) {
    eventQuery = eventQuery.eq("organization_id", organizationId);
  }
  
  const { data: event, error: eventError } = await eventQuery.single();

  if (eventError || !event) {
    errors.push(
      `Evento no encontrado: ${eventError?.message || "ID inválido"}`
    );
    return { isValid: false, errors };
  }

  // 2. Validar que el pago no exceda el monto del evento
  if (payment.amount > event.presupuesto_total) {
    errors.push(
      `El pago ($${payment.amount.toLocaleString()}) excede el presupuesto del evento ($${event.presupuesto_total.toLocaleString()})`
    );
  }

  // 3. Validar que no se paguen montos negativos o cero
  if (payment.amount <= 0) {
    errors.push("El monto del pago debe ser mayor a 0");
  }

  // 4. Validar monto mínimo
  const MIN_PAYMENT_AMOUNT = 100; // $100 CLP mínimo
  if (payment.amount < MIN_PAYMENT_AMOUNT) {
    errors.push(
      `El monto del pago debe ser al menos $${MIN_PAYMENT_AMOUNT.toLocaleString()} CLP`
    );
  }

  // 5. Validar que el evento esté en estado válido para recibir pagos
  const validStatuses = ["confirmado", "en_progreso", "completado"];
  if (!validStatuses.includes(event.estado)) {
    errors.push(
      `No se pueden recibir pagos para eventos en estado: "${
        event.estado
      }". Estados válidos: ${validStatuses.join(", ")}`
    );
  }

  // 6. Validar fecha de pago (no puede ser futura)
  const paymentDate = new Date(payment.payment_date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Fin del día actual

  if (paymentDate > today) {
    errors.push("La fecha de pago no puede ser futura");
  }

  // 7. Validar que la fecha no sea muy antigua (más de 1 año)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (paymentDate < oneYearAgo) {
    errors.push("La fecha de pago no puede ser de hace más de 1 año");
  }

  // 8. Verificar pagos previos para no exceder el total
  const { data: previousPayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("event_id", eventId);

  const totalPaid =
    previousPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const newTotal = totalPaid + payment.amount;

  if (newTotal > event.presupuesto_total) {
    errors.push(
      `El pago haría que el total pagado ($${newTotal.toLocaleString()}) exceda el presupuesto del evento ($${event.presupuesto_total.toLocaleString()})`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calcula automáticamente los valores de una cotización
 */
export function calculateQuoteValues(services: QuoteInput["services"]): {
  subtotal: number;
  taxes: number;
  total: number;
} {
  const IVA_RATE = 0.19;

  // Calcular subtotal
  const subtotal = services.reduce((sum, service) => {
    const serviceTotal = service.quantity * service.unit_price;
    return sum + serviceTotal;
  }, 0);

  // Calcular IVA
  const taxes = subtotal * IVA_RATE;

  // Calcular total
  const total = subtotal + taxes;

  return {
    subtotal: Math.round(subtotal * 100) / 100, // Redondear a 2 decimales
    taxes: Math.round(taxes * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
