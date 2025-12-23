import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { logUpdate } from "@/lib/business-rules";

/**
 * Aprobar trabajador
 * POST /api/superadmin/workers/[id]/approve
 * Body: { approved: boolean, subscription_type?: 'free'|'paid'|'trial', subscription_months?: number, reason?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      approved,
      subscription_type = "free",
      subscription_months,
      reason,
    } = body;

    if (approved === undefined) {
      return NextResponse.json(
        { message: "El campo 'approved' es requerido" },
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
            "Acceso denegado. Solo superadmins pueden aprobar trabajadores.",
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

    // Preparar datos de actualización
    const updateData: any = {
      approved_by_admin: approved,
      approved_by_user_id: userInfo.userId,
      approved_at: new Date().toISOString(),
    };

    if (!approved) {
      // Si se rechaza, guardar razón
      updateData.rejection_reason = reason || "Rechazado por administrador";
    } else {
      // Si se aprueba, configurar suscripción
      updateData.subscription_type = subscription_type;

      if (subscription_months && subscription_months > 0) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + subscription_months);
        updateData.subscription_end_date = endDate.toISOString();
      } else if (subscription_type === "free") {
        // Suscripción gratuita sin fecha de expiración (o con fecha muy lejana)
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 10); // 10 años por defecto
        updateData.subscription_end_date = endDate.toISOString();
      }
    }

    // Actualizar trabajador
    const { data: updatedWorker, error } = await supabase
      .from("workers")
      .update(updateData)
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
      console.error("Error approving worker:", error);
      return NextResponse.json(
        { message: "Error al aprobar trabajador" },
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
        { organization_id: userInfo.organizationId }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // Enviar notificación al trabajador (si está aprobado)
    if (approved && updatedWorker.users) {
      try {
        const { notificationService } = await import(
          "@/lib/services/notification-service"
        );
        await notificationService.createNotification({
          destinatario_id: updatedWorker.users.id,
          destinatario_tipo: "worker",
          titulo: approved
            ? "¡Tu perfil ha sido aprobado!"
            : "Tu perfil ha sido rechazado",
          mensaje: approved
            ? `Tu perfil de trabajador ha sido aprobado. ${
                subscription_months
                  ? `Tienes acceso gratuito por ${subscription_months} meses.`
                  : "Ya puedes comenzar a trabajar."
              }`
            : `Tu perfil ha sido rechazado. Razón: ${
                reason || "No especificada"
              }`,
          tipo: approved ? "success" : "warning",
          organization_id: oldWorker.organization_id,
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: approved
        ? "Trabajador aprobado exitosamente"
        : "Trabajador rechazado",
      worker: updatedWorker,
    });
  } catch (error) {
    console.error("Error in approve worker:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
