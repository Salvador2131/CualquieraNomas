import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { logUpdate } from "@/lib/business-rules";
import { z } from "zod";

const acceptAssignmentSchema = z.object({
  accepted: z.boolean(),
});

/**
 * Aceptar o rechazar asignación de evento
 * PUT /api/workers/assignments/[id]/accept
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const body = await request.json();

    // Validar datos
    const validation = acceptAssignmentSchema.safeParse(body);
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

    const { accepted } = validation.data;
    const supabase = createClient();

    // Verificar autenticación
    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener asignación
    const { data: assignment, error: assignmentError } = await supabase
      .from("event_workers")
      .select(
        `
        *,
        workers:worker_id (
          user_id
        ),
        events:event_id (
          id,
          titulo,
          fecha_evento,
          hora_inicio,
          hora_fin,
          ubicacion
        )
      `
      )
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { success: false, message: "Asignación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el trabajador es el dueño de esta asignación
    if (assignment.workers?.user_id !== userInfo.userId) {
      return NextResponse.json(
        { success: false, message: "No tienes permiso para esta acción" },
        { status: 403 }
      );
    }

    // Verificar que la asignación esté en estado "assigned"
    if (assignment.status !== "assigned") {
      return NextResponse.json(
        {
          success: false,
          message: `Esta asignación ya fue ${
            assignment.status === "accepted" ? "aceptada" : "rechazada"
          }`,
        },
        { status: 400 }
      );
    }

    // Actualizar asignación
    const updateData: any = {
      status: accepted ? "accepted" : "rejected",
    };

    if (accepted) {
      updateData.accepted_at = new Date().toISOString();
    }

    const { data: updatedAssignment, error: updateError } = await supabase
      .from("event_workers")
      .update(updateData)
      .eq("id", assignmentId)
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
        ),
        events:event_id (
          id,
          titulo
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating assignment:", updateError);
      return NextResponse.json(
        { success: false, message: "Error al actualizar asignación" },
        { status: 500 }
      );
    }

    // Registrar auditoría
    try {
      await logUpdate(
        "event_worker",
        assignmentId,
        userInfo.userId,
        assignment,
        updatedAssignment,
        supabase,
        { organization_id: userInfo.organizationId }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // Si acepta, crear chat grupal automáticamente
    if (accepted) {
      try {
        // Obtener todos los trabajadores aceptados del evento
        const { data: acceptedWorkers } = await supabase
          .from("event_workers")
          .select("workers:worker_id (user_id)")
          .eq("event_id", assignment.event_id)
          .eq("status", "accepted");

        // Obtener empresa (creador del evento)
        const { data: event } = await supabase
          .from("events")
          .select("organization_id")
          .eq("id", assignment.event_id)
          .single();

        if (event) {
          // Obtener usuario admin de la organización (empresa)
          const { data: adminUser } = await supabase
            .from("users")
            .select("id")
            .eq("organization_id", event.organization_id)
            .eq("role", "admin")
            .limit(1)
            .single();

          // Crear mensaje inicial en el chat
          if (adminUser) {
            await supabase.from("event_chats").insert({
              event_id: assignment.event_id,
              user_id: adminUser.id,
              message: `Chat grupal creado para el evento "${assignment.events?.titulo}". Todos los trabajadores asignados pueden participar aquí.`,
              organization_id: event.organization_id,
            });
          }
        }
      } catch (chatError) {
        console.error("Error creating chat:", chatError);
        // No fallar si el chat no se crea
      }

      // Notificar a la empresa
      try {
        const { data: event } = await supabase
          .from("events")
          .select("organization_id")
          .eq("id", assignment.event_id)
          .single();

        if (event) {
          const { data: adminUser } = await supabase
            .from("users")
            .select("id")
            .eq("organization_id", event.organization_id)
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
              titulo: "Trabajador Aceptó Asignación",
              mensaje: `${
                assignment.workers?.users?.name || "Un trabajador"
              } ha aceptado la asignación al evento "${
                assignment.events?.titulo
              }".`,
              tipo: "success",
              evento_id: assignment.event_id,
              organization_id: event.organization_id,
            });
          }
        }
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: accepted
        ? "Asignación aceptada exitosamente"
        : "Asignación rechazada",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Error in accept assignment:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
