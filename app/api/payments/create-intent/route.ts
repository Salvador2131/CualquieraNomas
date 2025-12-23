import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { z } from "zod";

const createPaymentIntentSchema = z.object({
  subscription_type: z.enum(["worker", "company"]),
  plan: z.string().optional(), // Para empresas: "inicio" o "crecimiento"
  months: z.number().int().min(1).max(12).default(1),
});

// Precios en CLP
const PRICING = {
  worker: {
    monthly: 2000, // $2.000 CLP/mes
  },
  company: {
    inicio: 29900, // $29.900 CLP/mes
    crecimiento: 0, // Post-MVP
  },
};

/**
 * Crear intención de pago
 * POST /api/payments/create-intent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos
    const validation = createPaymentIntentSchema.safeParse(body);
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

    const { subscription_type, plan, months } = validation.data;
    const supabase = createClient();

    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Calcular monto
    let amount = 0;
    if (subscription_type === "worker") {
      amount = PRICING.worker.monthly * months;
    } else if (subscription_type === "company") {
      if (!plan || plan === "inicio") {
        amount = PRICING.company.inicio * months;
      } else {
        return NextResponse.json(
          { success: false, message: "Plan no disponible aún" },
          { status: 400 }
        );
      }
    }

    // Verificar que el usuario no tenga una suscripción activa
    if (subscription_type === "worker") {
      const { data: worker } = await supabase
        .from("workers")
        .select("id, subscription_type, subscription_end_date")
        .eq("user_id", userInfo.userId)
        .eq("organization_id", userInfo.organizationId)
        .single();

      if (worker && worker.subscription_type === "paid") {
        const endDate = worker.subscription_end_date
          ? new Date(worker.subscription_end_date)
          : null;
        if (endDate && endDate > new Date()) {
          return NextResponse.json(
            {
              success: false,
              message: "Ya tienes una suscripción activa",
            },
            { status: 400 }
          );
        }
      }
    } else if (subscription_type === "company") {
      const { data: employer } = await supabase
        .from("employers")
        .select("id, subscription_status, subscription_end_date")
        .eq("user_id", userInfo.userId)
        .eq("organization_id", userInfo.organizationId)
        .single();

      if (employer && employer.subscription_status === "active") {
        const endDate = employer.subscription_end_date
          ? new Date(employer.subscription_end_date)
          : null;
        if (endDate && endDate > new Date()) {
          return NextResponse.json(
            {
              success: false,
              message: "Ya tienes una suscripción activa",
            },
            { status: 400 }
          );
        }
      }
    }

    // Crear registro de suscripción pendiente
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const { data: subscription, error: createError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userInfo.userId,
        subscription_type,
        plan: plan || (subscription_type === "worker" ? "monthly" : "inicio"),
        amount,
        status: "pending",
        payment_method: "webpay", // Por ahora Webpay, luego Flow
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        organization_id: userInfo.organizationId,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating subscription:", createError);
      return NextResponse.json(
        { success: false, message: "Error al crear suscripción" },
        { status: 500 }
      );
    }

    // TODO: Integrar con Flow/Webpay aquí
    // Por ahora, retornamos datos simulados
    const paymentIntent = {
      id: subscription.id,
      amount,
      currency: "CLP",
      subscription_id: subscription.id,
      // En producción, estos vendrían de Flow/Webpay
      payment_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/subscription/payment/${subscription.id}`,
      // Simulado: en producción sería la URL de Flow/Webpay
    };

    return NextResponse.json({
      success: true,
      payment_intent: paymentIntent,
      message:
        "Intención de pago creada. Redirige al usuario a la URL de pago.",
    });
  } catch (error) {
    console.error("Error in create payment intent:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
