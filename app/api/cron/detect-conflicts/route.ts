import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { detectScheduleConflicts } from "@/lib/business-rules";

/**
 * Endpoint para cron job que detecta conflictos automáticamente
 * POST /api/cron/detect-conflicts
 *
 * Este endpoint puede ser llamado por:
 * - Vercel Cron Jobs
 * - GitHub Actions
 * - Servicios externos de cron
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que la request viene de un servicio autorizado
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const supabase = createClient();

    // Obtener todos los eventos confirmados o en progreso
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, fecha_evento, hora_inicio, hora_fin, organization_id")
      .in("estado", ["planificando", "confirmado", "en_progreso"]);

    if (eventsError) {
      return NextResponse.json(
        { message: "Error al obtener eventos", error: eventsError.message },
        { status: 500 }
      );
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        success: true,
        conflictsDetected: 0,
        message: "No hay eventos para verificar",
      });
    }

    // Detectar conflictos para cada evento (agrupado por organización)
    const conflictsByOrg: Record<string, any[]> = {};
    let totalConflicts = 0;

    for (const event of events) {
      if (!event.organization_id) continue;

      const conflicts = await detectScheduleConflicts(
        event.id,
        event.fecha_evento,
        event.hora_inicio,
        event.hora_fin,
        supabase,
        event.organization_id
      );

      if (conflicts.length > 0) {
        if (!conflictsByOrg[event.organization_id]) {
          conflictsByOrg[event.organization_id] = [];
        }
        conflictsByOrg[event.organization_id].push(...conflicts);
        totalConflicts += conflicts.length;
      }
    }

    // Crear registros de conflictos detectados
    const conflictInserts: any[] = [];
    for (const [orgId, conflicts] of Object.entries(conflictsByOrg)) {
      for (const conflict of conflicts) {
        conflictInserts.push({
          conflict_type: "schedule_overlap",
          worker_id: conflict.workerId,
          event_id: conflict.conflictingEventId,
          severity: "high",
          status: "detected",
          conflict_details: {
            message: `Trabajador ${conflict.workerName} tiene conflicto de horario`,
            conflicting_event: conflict.conflictingEventTitle,
            conflicting_date: conflict.conflictingEventDate,
            conflicting_time: `${conflict.conflictingEventStart}-${conflict.conflictingEventEnd}`,
            new_event_time: `${conflict.newEventStart}-${conflict.newEventEnd}`,
          },
          organization_id: orgId,
        });
      }
    }

    if (conflictInserts.length > 0) {
      const { error: insertError } = await supabase
        .from("conflicts")
        .insert(conflictInserts);

      if (insertError) {
        console.error("Error creating conflict records:", insertError);
      }
    }

    return NextResponse.json({
      success: true,
      conflictsDetected: totalConflicts,
      conflictsByOrganization: Object.keys(conflictsByOrg).length,
      message: `Se detectaron ${totalConflicts} conflicto(s) en ${
        Object.keys(conflictsByOrg).length
      } organización(es)`,
    });
  } catch (error) {
    console.error("Error detecting conflicts:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al detectar conflictos",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * También permitir GET para facilitar testing
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
