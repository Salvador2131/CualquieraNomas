import { NextRequest, NextResponse } from "next/server";
import { validateQuoteCalculation } from "@/lib/business-rules";

/**
 * Endpoint para validar cálculos de cotizaciones antes de guardar
 * POST /api/validate/quotes
 * Body: { services: [...], subtotal: number, taxes: number, total: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar que tenga la estructura correcta
    if (
      !body.services ||
      !Array.isArray(body.services) ||
      body.subtotal === undefined ||
      body.taxes === undefined ||
      body.total === undefined
    ) {
      return NextResponse.json(
        {
          message:
            "El body debe contener: services (array), subtotal, taxes y total",
        },
        { status: 400 }
      );
    }

    // Validar usando reglas de negocio
    const validation = validateQuoteCalculation({
      services: body.services,
      subtotal: body.subtotal,
      taxes: body.taxes,
      total: body.total,
    });

    return NextResponse.json({
      isValid: validation.isValid,
      errors: validation.errors,
      message: validation.isValid
        ? "La cotización es válida"
        : "La cotización tiene errores de cálculo",
    });
  } catch (error) {
    console.error("Error validating quote:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
