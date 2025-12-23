import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

/**
 * Obtener suscripciones del usuario autenticado
 * GET /api/subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener suscripciones
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userInfo.userId)
      .eq("organization_id", userInfo.organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return NextResponse.json(
        { success: false, message: "Error al obtener suscripciones" },
        { status: 500 }
      );
    }

    // Obtener estado actual de suscripción del usuario
    let currentSubscription = null;
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", userInfo.userId)
      .single();

    if (user?.role === "worker") {
      const { data: worker } = await supabase
        .from("workers")
        .select("subscription_type, subscription_end_date, approved_by_admin")
        .eq("user_id", userInfo.userId)
        .eq("organization_id", userInfo.organizationId)
        .single();

      if (worker) {
        currentSubscription = {
          type: "worker",
          subscription_type: worker.subscription_type,
          subscription_end_date: worker.subscription_end_date,
          approved: worker.approved_by_admin,
        };
      }
    } else if (user?.role === "admin") {
      const { data: employer } = await supabase
        .from("employers")
        .select("subscription_status, subscription_plan, subscription_end_date")
        .eq("user_id", userInfo.userId)
        .eq("organization_id", userInfo.organizationId)
        .single();

      if (employer) {
        currentSubscription = {
          type: "company",
          subscription_status: employer.subscription_status,
          subscription_plan: employer.subscription_plan,
          subscription_end_date: employer.subscription_end_date,
        };
      }
    }

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || [],
      current: currentSubscription,
    });
  } catch (error) {
    console.error("Error in get subscriptions:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
