import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { logUpdate } from "@/lib/business-rules";
import { z } from "zod";

const resolveIncidentSchema = z.object({
  status: z.enum(["reviewed", "resolved", "dismissed"]),
  notes: z.string().optional(),
});

/**
 * Resolver o revisar reporte de incidencia
 * PUT /api/incidents/[id]/resolve
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: incidentId } = await params;
    const body = await request.json();

    // Validar datos
    const validation = resolveIncidentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Datos inválidos",
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { status, notes } = validation.data;
    const supabase = createClient();

    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar que es superadmin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", userInfo.userId)
      .single();

    if (user?.role !== "superadmin") {
      return NextResponse.json(
        { success: false, message: "No tienes permiso para esta acción" },
        { status: 403 }
      );
    }

    // Obtener reporte
    const { data: oldIncident, error: incidentError } = await supabase
      .from("incident_reports")
      .select(
        `
        *,
        workers:worker_id (
          id,
          user_id,
          users:user_id (
            id,
            name,
            email
          )
        ),
        events:event_id (
          id,
          titulo
        )
      `
      )
      .eq("id", incidentId)
      .single();

    if (incidentError || !oldIncident) {
      return NextResponse.json(
        { success: false, message: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar reporte
    const updateData: any = {
      status,
      reviewed_by_user_id: userInfo.userId,
      reviewed_at: new Date().toISOString(),
    };

    const { data: updatedIncident, error: updateError } = await supabase
      .from("incident_reports")
      .update(updateData)
      .eq("id", incidentId)
      .select(
        `
        *,
        workers:worker_id (
          id,
          users:user_id (
            id,
            name,
            email
          )
        ),
        events:event_id (
          id,
          titulo
        ),
        reviewed_by:reviewed_by_user_id (
          id,
          name
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating incident:", updateError);
      return NextResponse.json(
        { success: false, message: "Error al actualizar reporte" },
        { status: 500 }
      );
    }

    // Registrar auditoría
    try {
      await logUpdate(
        "incident",
        incidentId,
        userInfo.userId,
        oldIncident,
        updatedIncident,
        supabase,
        { organization_id: userInfo.organizationId }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // Notificar al trabajador si el reporte fue resuelto o desestimado
    if ((status === "resolved" || status === "dismissed") && oldIncident.workers?.users?.id) {
      try {
        const { notificationService } = await import("@/lib/services/notification-service");
        await notificationService.createNotification({
          destinatario_id: oldIncident.workers.users.id,
          destinatario_tipo: "worker",
          titulo: status === "resolved" ? "Reporte de Incidencia Resuelto" : "Reporte de Incidencia Desestimado",
          mensaje: status === "resolved"
            ? `El reporte de incidencia sobre tu participación en el evento "${oldIncident.events?.titulo}" ha sido resuelto. ${notes ? `Notas: ${notes}` : ""}`
            : `El reporte de incidencia sobre tu participación en el evento "${oldIncident.events?.titulo}" ha sido desestimado. ${notes ? `Notas: ${notes}` : ""}`,
          tipo: status === "resolved" ? "warning" : "success",
          organization_id: userInfo.organizationId,
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reporte ${status === "resolved" ? "resuelto" : status === "dismissed" ? "desestimado" : "revisado"} exitosamente`,
      incident: updatedIncident,
    });
  } catch (error) {
    console.error("Error in resolve incident:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
