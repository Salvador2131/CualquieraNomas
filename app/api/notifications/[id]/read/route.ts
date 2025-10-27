import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "ID de notificación es requerido" },
        { status: 400 }
      );
    }

    const success = await notificationService.markAsRead(id);

    if (!success) {
      return NextResponse.json(
        { message: "Error al marcar la notificación como leída" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Notificación marcada como leída",
    });
  } catch (error) {
    console.error("Error in notification read API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
