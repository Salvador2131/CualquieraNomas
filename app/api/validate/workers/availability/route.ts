import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { validateWorkerAvailability } from "@/lib/business-rules";
import { getCurrentOrganizationId } from "@/lib/utils/api-organization-filter";

/**
 * Endpoint para validar disponibilidad de trabajadores antes de asignar
 * GET /api/validate/workers/availability?workerId=xxx&eventDate=2025-01-01&eventStartTime=14:00&eventEndTime=18:00&excludeEventId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId");
    const eventDate = searchParams.get("eventDate");
    const eventStartTime = searchParams.get("eventStartTime");
    const eventEndTime = searchParams.get("eventEndTime");
    const excludeEventId = searchParams.get("excludeEventId");

    // Validar parámetros requeridos
    if (!workerId || !eventDate || !eventStartTime || !eventEndTime) {
      return NextResponse.json(
        {
          message:
            "workerId, eventDate, eventStartTime y eventEndTime son requeridos",
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Obtener organization_id del usuario autenticado
    const organizationId = await getCurrentOrganizationId(request, supabase);
    if (!organizationId) {
      return NextResponse.json(
        { message: "No se pudo determinar la organización del usuario" },
        { status: 401 }
      );
    }

    // Validar disponibilidad usando reglas de negocio
    const availability = await validateWorkerAvailability(
      workerId,
      eventDate,
      eventStartTime,
      eventEndTime,
      excludeEventId || null,
      supabase,
      organizationId
    );

    return NextResponse.json({
      isAvailable: availability.isAvailable,
      conflicts: availability.conflicts,
      message: availability.isAvailable
        ? "El trabajador está disponible"
        : "El trabajador tiene conflictos de horario",
    });
  } catch (error) {
    console.error("Error validating worker availability:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
