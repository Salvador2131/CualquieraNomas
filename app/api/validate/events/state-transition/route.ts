import { NextRequest, NextResponse } from "next/server";
import { validateEventStateTransition } from "@/lib/business-rules";

/**
 * Endpoint para validar transiciones de estado de eventos
 * POST /api/validate/events/state-transition
 * Body: { currentState: string, newState: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentState, newState } = body;

    // Validar parámetros requeridos
    if (!currentState || !newState) {
      return NextResponse.json(
        {
          message: "currentState y newState son requeridos",
        },
        { status: 400 }
      );
    }

    // Validar usando reglas de negocio
    const validation = validateEventStateTransition(currentState, newState);

    return NextResponse.json({
      isValid: validation.isValid,
      errors: validation.errors,
      message: validation.isValid
        ? "La transición de estado es válida"
        : "La transición de estado no es válida",
    });
  } catch (error) {
    console.error("Error validating state transition:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
