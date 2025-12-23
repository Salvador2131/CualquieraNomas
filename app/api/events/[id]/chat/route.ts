import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { z } from "zod";

const sendMessageSchema = z.object({
  message: z.string().min(1, "El mensaje no puede estar vacío").max(1000, "El mensaje es demasiado largo"),
});

/**
 * Obtener mensajes del chat de un evento
 * GET /api/events/[id]/chat
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

    // Verificar que el evento existe y pertenece a la organización
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, organization_id")
      .eq("id", eventId)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene acceso al evento
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", userInfo.userId)
      .single();

    let hasAccess = false;

    // Admin siempre tiene acceso
    if (user?.role === "admin" || user?.role === "superadmin") {
      hasAccess = true;
    } else {
      // Verificar si es trabajador asignado
      const { data: worker } = await supabase
        .from("workers")
        .select("id")
        .eq("user_id", userInfo.userId)
        .single();

      if (worker) {
        const { data: assignment } = await supabase
          .from("event_workers")
          .select("id")
          .eq("event_id", eventId)
          .eq("worker_id", worker.id)
          .in("status", ["assigned", "accepted"])
          .single();

        hasAccess = !!assignment;
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: "No tienes acceso a este chat" },
        { status: 403 }
      );
    }

    // Obtener mensajes
    const { data: messages, error } = await supabase
      .from("event_chats")
      .select(
        `
        id,
        message,
        created_at,
        users:user_id (
          id,
          name,
          email
        )
      `
      )
      .eq("event_id", eventId)
      .eq("organization_id", userInfo.organizationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { success: false, message: "Error al obtener mensajes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    });
  } catch (error) {
    console.error("Error in get chat messages:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * Enviar mensaje al chat de un evento
 * POST /api/events/[id]/chat
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();

    // Validar datos
    const validation = sendMessageSchema.safeParse(body);
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

    const { message } = validation.data;
    const supabase = createClient();

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
      .select("id, organization_id, titulo")
      .eq("id", eventId)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene acceso al evento
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", userInfo.userId)
      .single();

    let hasAccess = false;

    if (user?.role === "admin" || user?.role === "superadmin") {
      hasAccess = true;
    } else {
      const { data: worker } = await supabase
        .from("workers")
        .select("id")
        .eq("user_id", userInfo.userId)
        .single();

      if (worker) {
        const { data: assignment } = await supabase
          .from("event_workers")
          .select("id")
          .eq("event_id", eventId)
          .eq("worker_id", worker.id)
          .in("status", ["assigned", "accepted"])
          .single();

        hasAccess = !!assignment;
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: "No tienes acceso a este chat" },
        { status: 403 }
      );
    }

    // Crear mensaje
    const { data: chatMessage, error: createError } = await supabase
      .from("event_chats")
      .insert({
        event_id: eventId,
        user_id: userInfo.userId,
        message,
        organization_id: userInfo.organizationId,
      })
      .select(
        `
        id,
        message,
        created_at,
        users:user_id (
          id,
          name,
          email
        )
      `
      )
      .single();

    if (createError) {
      console.error("Error creating message:", createError);
      return NextResponse.json(
        { success: false, message: "Error al enviar mensaje" },
        { status: 500 }
      );
    }

    // Notificar a otros participantes del evento (excepto al remitente)
    try {
      // Obtener todos los participantes del evento
      const { data: participants } = await supabase
        .from("event_workers")
        .select("workers:worker_id (user_id)")
        .eq("event_id", eventId)
        .eq("status", "accepted");

      // Obtener admin de la organización
      const { data: admin } = await supabase
        .from("users")
        .select("id")
        .eq("organization_id", userInfo.organizationId)
        .eq("role", "admin")
        .limit(1)
        .single();

      const userIdsToNotify = new Set<string>();

      if (admin?.id && admin.id !== userInfo.userId) {
        userIdsToNotify.add(admin.id);
      }

      if (participants) {
        participants.forEach((p: any) => {
          if (p.workers?.user_id && p.workers.user_id !== userInfo.userId) {
            userIdsToNotify.add(p.workers.user_id);
          }
        });
      }

      // Enviar notificaciones
      const { notificationService } = await import("@/lib/services/notification-service");
      for (const userId of userIdsToNotify) {
        await notificationService.createNotification({
          destinatario_id: userId,
          destinatario_tipo: user?.role === "admin" ? "admin" : "worker",
          titulo: "Nuevo Mensaje en Chat de Evento",
          mensaje: `${user?.name || "Un usuario"} escribió en el chat del evento "${event.titulo}": ${message.substring(0, 50)}${message.length > 50 ? "..." : ""}`,
          tipo: "info",
          evento_id: eventId,
          organization_id: userInfo.organizationId,
        });
      }
    } catch (notificationError) {
      console.error("Error sending notifications:", notificationError);
      // No fallar si las notificaciones fallan
    }

    return NextResponse.json({
      success: true,
      message: "Mensaje enviado exitosamente",
      chatMessage,
    });
  } catch (error) {
    console.error("Error in send chat message:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
