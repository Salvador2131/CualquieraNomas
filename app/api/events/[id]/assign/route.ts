import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { validateWorkerAvailability } from "@/lib/business-rules";
import { logCreate } from "@/lib/business-rules";
import { z } from "zod";

const assignWorkersSchema = z.object({
  worker_ids: z
    .array(z.string().uuid())
    .min(1, "Debe asignar al menos un trabajador"),
  roles: z.record(z.string().uuid(), z.string().optional()).optional(),
  payment_agreed: z.record(z.string().uuid(), z.number().optional()).optional(),
});

/**
 * Asignar trabajadores a un evento
 * POST /api/events/[id]/assign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();

    // Validar datos
    const validation = assignWorkersSchema.safeParse(body);
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

    const { worker_ids, roles, payment_agreed } = validation.data;
    const supabase = createClient();

    // Verificar autenticación
    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar que el evento existe y pertenece a la organización
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        "id, fecha_evento, hora_inicio, hora_fin, estado, organization_id"
      )
      .eq("id", eventId)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el evento no esté completado o cancelado
    if (event.estado === "completed" || event.estado === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          message:
            "No se pueden asignar trabajadores a eventos completados o cancelados",
        },
        { status: 400 }
      );
    }

    // Validar disponibilidad de cada trabajador
    const assignments = [];
    const errors = [];

    for (const workerId of worker_ids) {
      // Verificar disponibilidad
      const availability = await validateWorkerAvailability(
        workerId,
        event.fecha_evento,
        event.hora_inicio || "",
        event.hora_fin || "",
        eventId,
        supabase,
        userInfo.organizationId
      );

      if (!availability.isAvailable) {
        errors.push({
          worker_id: workerId,
          errors: availability.conflicts.map((c) => c.message),
        });
        continue;
      }

      // Verificar que no esté ya asignado
      const { data: existing } = await supabase
        .from("event_workers")
        .select("id")
        .eq("event_id", eventId)
        .eq("worker_id", workerId)
        .single();

      if (existing) {
        errors.push({
          worker_id: workerId,
          errors: ["El trabajador ya está asignado a este evento"],
        });
        continue;
      }

      assignments.push({
        event_id: eventId,
        worker_id: workerId,
        role: roles?.[workerId] || null,
        status: "assigned",
        assigned_by_user_id: userInfo.userId,
        payment_agreed: payment_agreed?.[workerId] || null,
        organization_id: userInfo.organizationId,
      });
    }

    if (errors.length > 0 && assignments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo asignar ningún trabajador",
          errors,
        },
        { status: 400 }
      );
    }

    // Crear asignaciones
    const { data: createdAssignments, error: assignError } = await supabase
      .from("event_workers")
      .insert(assignments)
      .select(
        `
        *,
        workers:worker_id (
          id,
          specialization,
          users:user_id (
            id,
            name,
            email
          )
        )
      `
      );

    if (assignError) {
      console.error("Error creating assignments:", assignError);
      return NextResponse.json(
        { success: false, message: "Error al crear asignaciones" },
        { status: 500 }
      );
    }

    // Registrar auditoría y enviar notificaciones
    for (const assignment of createdAssignments || []) {
      try {
        await logCreate(
          "event_worker",
          assignment.id,
          userInfo.userId,
          supabase,
          { organization_id: userInfo.organizationId }
        );

        // Enviar notificación al trabajador
        if (assignment.workers?.users?.id) {
          const { notificationService } = await import(
            "@/lib/services/notification-service"
          );
          await notificationService.createNotification({
            destinatario_id: assignment.workers.users.id,
            destinatario_tipo: "worker",
            titulo: "Nueva Asignación de Evento",
            mensaje: `Has sido asignado a un evento. Revisa los detalles y confirma tu disponibilidad.`,
            tipo: "info",
            evento_id: eventId,
            organization_id: userInfo.organizationId,
          });
        }
      } catch (error) {
        console.error("Error in post-assignment actions:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${assignments.length} trabajador(es) asignado(s) exitosamente`,
      assignments: createdAssignments,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in assign workers:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
