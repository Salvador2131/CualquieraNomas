import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config/env";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { z } from "zod";

const confirmPaymentSchema = z.object({
  subscription_id: z.string().uuid(),
  payment_id: z.string().optional(), // ID de pago de Flow/Webpay
});

/**
 * Confirmar pago manualmente (para desarrollo/testing)
 * POST /api/payments/confirm
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos
    const validation = confirmPaymentSchema.safeParse(body);
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

    const { subscription_id, payment_id } = validation.data;
    const supabase = createClient();

    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener suscripción
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscription_id)
      .eq("user_id", userInfo.userId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { success: false, message: "Suscripción no encontrada" },
        { status: 404 }
      );
    }

    // Simular confirmación de pago (en producción esto vendría del webhook)
    // Llamar al webhook internamente
    const webhookResponse = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/payments/webhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription_id,
          payment_id: payment_id || `test_${Date.now()}`,
          status: "approved",
          amount: subscription.amount,
        }),
      }
    );

    const webhookData = await webhookResponse.json();

    if (!webhookResponse.ok || !webhookData.success) {
      return NextResponse.json(
        { success: false, message: "Error al confirmar pago" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pago confirmado exitosamente",
    });
  } catch (error) {
    console.error("Error in confirm payment:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
