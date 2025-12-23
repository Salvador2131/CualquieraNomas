import { NextRequest, NextResponse } from "next/server";
import { validateEventDates } from "@/lib/business-rules";

/**
 * Endpoint para validar fechas y horarios de eventos antes de crear/actualizar
 * POST /api/validate/events/dates
 * Body: { eventDate: string, startTime: string, endTime: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventDate, startTime, endTime } = body;

    // Validar parámetros requeridos
    if (!eventDate || !startTime || !endTime) {
      return NextResponse.json(
        {
          message: "eventDate, startTime y endTime son requeridos",
        },
        { status: 400 }
      );
    }

    // Validar usando reglas de negocio
    const validation = validateEventDates(eventDate, startTime, endTime);

    return NextResponse.json({
      isValid: validation.isValid,
      errors: validation.errors,
      message: validation.isValid
        ? "Las fechas y horarios son válidos"
        : "Las fechas y horarios tienen errores",
    });
  } catch (error) {
    console.error("Error validating event dates:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
