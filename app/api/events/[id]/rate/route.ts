import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { logCreate } from "@/lib/business-rules";
import { z } from "zod";

const rateEventSchema = z.object({
  worker_id: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z
    .string()
    .min(10, "El comentario debe tener al menos 10 caracteres"),
});

/**
 * Calificar trabajador después de evento
 * POST /api/events/[id]/rate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();

    // Validar datos
    const validation = rateEventSchema.safeParse(body);
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

    const { worker_id, score, comment } = validation.data;
    const supabase = createClient();

    // Verificar autenticación y obtener info del usuario
    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar que el evento existe y está completado
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, estado, organization_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el evento esté completado
    if (event.estado !== "completed" && event.estado !== "completado") {
      return NextResponse.json(
        {
          success: false,
          message: "Solo se pueden calificar eventos completados",
        },
        { status: 400 }
      );
    }

    // Verificar que el trabajador esté asignado al evento
    const { data: assignment, error: assignmentError } = await supabase
      .from("event_workers")
      .select("id, worker_id, event_id")
      .eq("event_id", eventId)
      .eq("worker_id", worker_id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        {
          success: false,
          message: "El trabajador no está asignado a este evento",
        },
        { status: 400 }
      );
    }

    // Verificar que no se haya calificado ya
    const { data: existingRating, error: existingError } = await supabase
      .from("event_ratings")
      .select("id")
      .eq("event_id", eventId)
      .eq("worker_id", worker_id)
      .eq("rated_by_user_id", userInfo.userId)
      .single();

    if (existingRating) {
      return NextResponse.json(
        {
          success: false,
          message: "Ya has calificado a este trabajador para este evento",
        },
        { status: 400 }
      );
    }

    // Crear calificación
    const { data: rating, error: ratingError } = await supabase
      .from("event_ratings")
      .insert({
        event_id: eventId,
        worker_id,
        rated_by_user_id: userInfo.userId,
        score,
        comment,
        organization_id: userInfo.organizationId,
      })
      .select()
      .single();

    if (ratingError) {
      console.error("Error creating rating:", ratingError);
      return NextResponse.json(
        { success: false, message: "Error al crear calificación" },
        { status: 500 }
      );
    }

    // Registrar auditoría
    try {
      await logCreate("rating", rating.id, userInfo.userId, supabase, {
        organization_id: userInfo.organizationId,
      });
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // El trigger SQL actualizará automáticamente el rating promedio del trabajador
    // También enviar notificación al trabajador
    try {
      const { data: worker } = await supabase
        .from("workers")
        .select("user_id")
        .eq("id", worker_id)
        .single();

      if (worker?.user_id) {
        const { notificationService } = await import(
          "@/lib/services/notification-service"
        );
        await notificationService.createNotification({
          destinatario_id: worker.user_id,
          destinatario_tipo: "worker",
          titulo: "Nueva Calificación Recibida",
          mensaje: `Has recibido una calificación de ${score}/5 estrellas por tu trabajo en el evento.`,
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
      message: "Calificación creada exitosamente",
      rating,
    });
  } catch (error) {
    console.error("Error in rate event:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * Obtener calificaciones de un evento
 * GET /api/events/[id]/rate
 */
export async function GET(
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

    const { data: ratings, error } = await supabase
      .from("event_ratings")
      .select(
        `
        *,
        workers:worker_id (
          id,
          specialization,
          users:user_id (
            id,
            name
          )
        ),
        users:rated_by_user_id (
          id,
          name
        )
      `
      )
      .eq("event_id", eventId)
      .eq("organization_id", userInfo.organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ratings:", error);
      return NextResponse.json(
        { success: false, message: "Error al obtener calificaciones" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ratings: ratings || [],
    });
  } catch (error) {
    console.error("Error in get ratings:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
