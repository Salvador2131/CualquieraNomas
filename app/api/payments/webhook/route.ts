import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { logUpdate } from "@/lib/business-rules";

/**
 * Webhook para recibir confirmaciones de pago de Flow/Webpay
 * POST /api/payments/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient();

    // TODO: Validar firma del webhook de Flow/Webpay
    // Por ahora, aceptamos cualquier payload para desarrollo

    const {
      subscription_id,
      payment_id,
      status, // 'approved', 'rejected', 'pending'
      amount,
    } = body;

    if (!subscription_id) {
      return NextResponse.json(
        { success: false, message: "subscription_id requerido" },
        { status: 400 }
      );
    }

    // Obtener suscripción
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscription_id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { success: false, message: "Suscripción no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar estado de suscripción
    const updateData: any = {
      payment_id,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved" || status === "completed") {
      updateData.status = "active";

      // Actualizar perfil del usuario según tipo
      if (subscription.subscription_type === "worker") {
        await supabase
          .from("workers")
          .update({
            subscription_type: "paid",
            subscription_end_date: subscription.end_date,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", subscription.user_id)
          .eq("organization_id", subscription.organization_id);

        // Notificar al trabajador
        try {
          const { notificationService } = await import(
            "@/lib/services/notification-service"
          );
          await notificationService.createNotification({
            destinatario_id: subscription.user_id,
            destinatario_tipo: "worker",
            titulo: "Pago Confirmado",
            mensaje: `Tu suscripción ha sido activada exitosamente. Tienes acceso completo hasta el ${new Date(
              subscription.end_date
            ).toLocaleDateString()}.`,
            tipo: "success",
            organization_id: subscription.organization_id,
          });
        } catch (notificationError) {
          console.error("Error sending notification:", notificationError);
        }
      } else if (subscription.subscription_type === "company") {
        await supabase
          .from("employers")
          .update({
            subscription_status: "active",
            subscription_plan: subscription.plan,
            subscription_end_date: subscription.end_date,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", subscription.user_id)
          .eq("organization_id", subscription.organization_id);

        // Notificar a la empresa
        try {
          const { notificationService } = await import(
            "@/lib/services/notification-service"
          );
          await notificationService.createNotification({
            destinatario_id: subscription.user_id,
            destinatario_tipo: "admin",
            titulo: "Pago Confirmado",
            mensaje: `Tu suscripción ha sido activada exitosamente. Plan: ${
              subscription.plan
            }. Válida hasta el ${new Date(
              subscription.end_date
            ).toLocaleDateString()}.`,
            tipo: "success",
            organization_id: subscription.organization_id,
          });
        } catch (notificationError) {
          console.error("Error sending notification:", notificationError);
        }
      }
    } else if (status === "rejected" || status === "failed") {
      updateData.status = "cancelled";
    }

    const { data: updatedSubscription, error: updateError } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", subscription_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      return NextResponse.json(
        { success: false, message: "Error al actualizar suscripción" },
        { status: 500 }
      );
    }

    // Registrar auditoría
    try {
      await logUpdate(
        "subscription",
        subscription_id,
        subscription.user_id,
        subscription,
        updatedSubscription,
        supabase,
        { organization_id: subscription.organization_id }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Webhook procesado exitosamente",
    });
  } catch (error) {
    console.error("Error in payment webhook:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
