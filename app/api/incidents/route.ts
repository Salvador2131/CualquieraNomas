import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { logCreate } from "@/lib/business-rules";
import { z } from "zod";

const createIncidentSchema = z.object({
  event_id: z.string().uuid("ID de evento inválido"),
  worker_id: z.string().uuid("ID de trabajador inválido"),
  incident_type: z.enum(["no_show", "late_arrival", "poor_performance", "other"]),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").max(1000, "La descripción es demasiado larga"),
});

/**
 * Obtener reportes de incidencia (SuperAdmin)
 * GET /api/incidents?status=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
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

    // Construir query
    let query = supabase
      .from("incident_reports")
      .select(
        `
        *,
        events:event_id (
          id,
          titulo,
          fecha_evento
        ),
        workers:worker_id (
          id,
          specialization,
          users:user_id (
            id,
            name,
            email
          )
        ),
        reported_by:reported_by_user_id (
          id,
          name,
          email
        ),
        reviewed_by:reviewed_by_user_id (
          id,
          name
        )
      `
      )
      .order("created_at", { ascending: false });

    // Filtrar por estado
    if (status) {
      query = query.eq("status", status);
    }

    const { data: incidents, error } = await query;

    if (error) {
      console.error("Error fetching incidents:", error);
      return NextResponse.json(
        { success: false, message: "Error al obtener reportes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      incidents: incidents || [],
      total: incidents?.length || 0,
    });
  } catch (error) {
    console.error("Error in get incidents:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * Crear reporte de incidencia
 * POST /api/incidents
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos
    const validation = createIncidentSchema.safeParse(body);
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

    const { event_id, worker_id, incident_type, description } = validation.data;
    const supabase = createClient();

    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar que el usuario es admin (solo empresas pueden reportar)
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", userInfo.userId)
      .single();

    if (user?.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Solo las empresas pueden reportar incidencias" },
        { status: 403 }
      );
    }

    // Verificar que el evento existe y pertenece a la organización
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, organization_id, titulo")
      .eq("id", event_id)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el trabajador está asignado al evento
    const { data: assignment } = await supabase
      .from("event_workers")
      .select("id")
      .eq("event_id", event_id)
      .eq("worker_id", worker_id)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "El trabajador no está asignado a este evento" },
        { status: 400 }
      );
    }

    // Crear reporte
    const { data: incident, error: createError } = await supabase
      .from("incident_reports")
      .insert({
        event_id,
        worker_id,
        reported_by_user_id: userInfo.userId,
        incident_type,
        description,
        status: "pending",
        organization_id: userInfo.organizationId,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating incident:", createError);
      return NextResponse.json(
        { success: false, message: "Error al crear reporte" },
        { status: 500 }
      );
    }

    // Registrar auditoría
    try {
      await logCreate(
        "incident",
        incident.id,
        userInfo.userId,
        supabase,
        { organization_id: userInfo.organizationId }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // Verificar si el trabajador tiene 3 o más reportes (suspensión automática)
    const { count: incidentCount } = await supabase
      .from("incident_reports")
      .select("*", { count: "exact", head: true })
      .eq("worker_id", worker_id)
      .eq("organization_id", userInfo.organizationId)
      .in("status", ["pending", "reviewed", "resolved"]);

    if ((incidentCount || 0) >= 3) {
      // Suspender trabajador por 30 días
      const suspensionEndDate = new Date();
      suspensionEndDate.setDate(suspensionEndDate.getDate() + 30);

      await supabase
        .from("workers")
        .update({
          is_active: false,
          status: "suspended",
          updated_at: new Date().toISOString(),
        })
        .eq("id", worker_id);

      // Notificar al trabajador sobre la suspensión
      try {
        const { data: worker } = await supabase
          .from("workers")
          .select("user_id")
          .eq("id", worker_id)
          .single();

        if (worker?.user_id) {
          const { notificationService } = await import("@/lib/services/notification-service");
          await notificationService.createNotification({
            destinatario_id: worker.user_id,
            destinatario_tipo: "worker",
            titulo: "Suspensión Temporal",
            mensaje: `Has recibido 3 reportes de incidencia. Tu cuenta ha sido suspendida por 30 días. Puedes contactar al administrador para más información.`,
            tipo: "warning",
            organization_id: userInfo.organizationId,
          });
        }
      } catch (notificationError) {
        console.error("Error sending suspension notification:", notificationError);
      }
    }

    // Notificar a SuperAdmin sobre nuevo reporte
    try {
      const { data: superAdmin } = await supabase
        .from("users")
        .select("id")
        .eq("role", "superadmin")
        .limit(1)
        .single();

      if (superAdmin) {
        const { notificationService } = await import("@/lib/services/notification-service");
        await notificationService.createNotification({
          destinatario_id: superAdmin.id,
          destinatario_tipo: "admin",
          titulo: "Nuevo Reporte de Incidencia",
          mensaje: `Se ha reportado una incidencia en el evento "${event.titulo}". Tipo: ${incident_type}. Revisa el reporte para tomar acción.`,
          tipo: "warning",
          organization_id: userInfo.organizationId,
        });
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Reporte de incidencia creado exitosamente",
      incident,
      suspended: (incidentCount || 0) >= 3,
    });
  } catch (error) {
    console.error("Error in create incident:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
