import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { detectScheduleConflicts } from "@/lib/business-rules";
import { getCurrentOrganizationId } from "@/lib/utils/api-organization-filter";

/**
 * Endpoint para detectar conflictos de horarios en tiempo real
 * GET /api/validate/conflicts?eventId=xxx&eventDate=2025-01-01&eventStartTime=14:00&eventEndTime=18:00
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const eventDate = searchParams.get("eventDate");
    const eventStartTime = searchParams.get("eventStartTime");
    const eventEndTime = searchParams.get("eventEndTime");

    // Validar parámetros requeridos
    if (!eventId || !eventDate || !eventStartTime || !eventEndTime) {
      return NextResponse.json(
        {
          message:
            "eventId, eventDate, eventStartTime y eventEndTime son requeridos",
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

    // Detectar conflictos usando reglas de negocio
    const conflicts = await detectScheduleConflicts(
      eventId,
      eventDate,
      eventStartTime,
      eventEndTime,
      supabase,
      organizationId
    );

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflictsCount: conflicts.length,
      conflicts,
      message:
        conflicts.length > 0
          ? `Se detectaron ${conflicts.length} conflicto(s) de horario`
          : "No se detectaron conflictos de horario",
    });
  } catch (error) {
    console.error("Error detecting conflicts:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
