import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { logUpdate } from "@/lib/business-rules";

/**
 * Otorgar acceso gratuito a trabajador
 * PUT /api/superadmin/workers/[id]/free-access
 * Body: { months: number, reason?: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { months, reason } = body;

    if (!months || months <= 0) {
      return NextResponse.json(
        { message: "El campo 'months' es requerido y debe ser mayor a 0" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verificar que el usuario es superadmin
    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", userInfo.userId)
      .single();

    if (!user || user.role !== "superadmin") {
      return NextResponse.json(
        {
          message:
            "Acceso denegado. Solo superadmins pueden otorgar acceso gratuito.",
        },
        { status: 403 }
      );
    }

    // Obtener datos actuales del trabajador
    const { data: oldWorker } = await supabase
      .from("workers")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldWorker) {
      return NextResponse.json(
        { message: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Calcular fecha de expiración
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    // Actualizar trabajador
    const { data: updatedWorker, error } = await supabase
      .from("workers")
      .update({
        subscription_type: "free",
        subscription_end_date: endDate.toISOString(),
        approved_by_admin: true,
        approved_by_user_id: userInfo.userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        users:user_id (
          id,
          name,
          email
        )
      `
      )
      .single();

    if (error) {
      console.error("Error granting free access:", error);
      return NextResponse.json(
        { message: "Error al otorgar acceso gratuito" },
        { status: 500 }
      );
    }

    // Registrar auditoría
    try {
      await logUpdate(
        "worker",
        id,
        userInfo.userId,
        oldWorker,
        updatedWorker,
        supabase,
        {
          organization_id: userInfo.organizationId,
          metadata: {
            action: "grant_free_access",
            months,
            reason: reason || "Cortesía del administrador",
          },
        }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // Enviar notificación al trabajador
    if (updatedWorker.users) {
      try {
        const { notificationService } = await import(
          "@/lib/services/notification-service"
        );
        await notificationService.createNotification({
          destinatario_id: updatedWorker.users.id,
          destinatario_tipo: "worker",
          titulo: "Acceso Gratuito Otorgado",
          mensaje: `Has recibido acceso gratuito por ${months} ${
            months === 1 ? "mes" : "meses"
          }. ${reason ? `Razón: ${reason}` : ""}`,
          tipo: "success",
          organization_id: oldWorker.organization_id,
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Acceso gratuito otorgado por ${months} ${
        months === 1 ? "mes" : "meses"
      }`,
      worker: updatedWorker,
      subscriptionEndDate: endDate.toISOString(),
    });
  } catch (error) {
    console.error("Error in grant free access:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
