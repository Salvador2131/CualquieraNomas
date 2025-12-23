import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { logCreate } from "@/lib/business-rules";

/**
 * Trabajador postula a un evento
 * POST /api/events/[id]/apply
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = createClient();

    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener worker_id del usuario
    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("id, approved_by_admin")
      .eq("user_id", userInfo.userId)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (workerError || !worker) {
      return NextResponse.json(
        { success: false, message: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    if (!worker.approved_by_admin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Debes estar aprobado por el administrador para postular a eventos",
        },
        { status: 403 }
      );
    }

    // Verificar que el evento existe
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, estado, organization_id")
      .eq("id", eventId)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el evento esté en estado válido para postular
    if (event.estado === "completed" || event.estado === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          message: "No se puede postular a eventos completados o cancelados",
        },
        { status: 400 }
      );
    }

    // Verificar que no esté ya asignado o postulado
    const { data: existing } = await supabase
      .from("event_workers")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("worker_id", worker.id)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Ya estás ${
            existing.status === "assigned" ? "asignado" : "postulado"
          } a este evento`,
        },
        { status: 400 }
      );
    }

    // Verificar límite de postulaciones simultáneas (máximo 3)
    const { count: activeApplications } = await supabase
      .from("event_workers")
      .select("*", { count: "exact", head: true })
      .eq("worker_id", worker.id)
      .eq("organization_id", userInfo.organizationId)
      .in("status", ["assigned", "accepted"]);

    if ((activeApplications || 0) >= 3) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ya tienes 3 postulaciones activas. Completa o cancela alguna antes de postular a otro evento.",
        },
        { status: 400 }
      );
    }

    // Crear postulación (status = "assigned" para que la empresa la vea)
    const { data: application, error: applyError } = await supabase
      .from("event_workers")
      .insert({
        event_id: eventId,
        worker_id: worker.id,
        status: "assigned", // Estado inicial, empresa puede aceptar/rechazar
        organization_id: userInfo.organizationId,
      })
      .select(
        `
        *,
        events:event_id (
          id,
          titulo
        )
      `
      )
      .single();

    if (applyError) {
      console.error("Error creating application:", applyError);
      return NextResponse.json(
        { success: false, message: "Error al postular al evento" },
        { status: 500 }
      );
    }

    // Registrar auditoría
    try {
      await logCreate(
        "event_worker",
        application.id,
        userInfo.userId,
        supabase,
        {
          organization_id: userInfo.organizationId,
          metadata: { action: "worker_application" },
        }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // Notificar a la empresa
    try {
      const { data: adminUser } = await supabase
        .from("users")
        .select("id")
        .eq("organization_id", userInfo.organizationId)
        .eq("role", "admin")
        .limit(1)
        .single();

      if (adminUser) {
        const { notificationService } = await import(
          "@/lib/services/notification-service"
        );
        await notificationService.createNotification({
          destinatario_id: adminUser.id,
          destinatario_tipo: "admin",
          titulo: "Nueva Postulación de Trabajador",
          mensaje: `Un trabajador ha postulado al evento "${application.events?.titulo}". Revisa la postulación y asigna si es apropiado.`,
          tipo: "info",
          evento_id: eventId,
          organization_id: userInfo.organizationId,
        });
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Postulación enviada exitosamente",
      application,
    });
  } catch (error) {
    console.error("Error in apply to event:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
