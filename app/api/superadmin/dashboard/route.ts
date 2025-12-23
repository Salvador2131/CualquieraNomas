import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

/**
 * Dashboard SuperAdmin
 * GET /api/superadmin/dashboard
 * Solo accesible para usuarios con role = 'superadmin'
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar que el usuario es superadmin
    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { message: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar rol superadmin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userInfo.userId)
      .single();

    if (userError || !user || user.role !== "superadmin") {
      return NextResponse.json(
        { message: "Acceso denegado. Solo superadmins pueden acceder." },
        { status: 403 }
      );
    }

    // Obtener estadísticas generales
    const [
      { count: totalCompanies },
      { count: totalWorkers },
      { count: activeWorkers },
      { count: approvedWorkers },
      { count: pendingWorkers },
      { count: freeWorkers },
      { count: paidWorkers },
      { data: recentEvents },
      { data: pendingApprovals },
      { data: upcomingRenewals },
    ] = await Promise.all([
      // Total empresas
      supabase
        .from("employers")
        .select("*", { count: "exact", head: true })
        .eq("subscription_status", "active"),

      // Total trabajadores
      supabase
        .from("workers")
        .select("*", { count: "exact", head: true }),

      // Trabajadores activos (con acceso)
      supabase
        .from("workers")
        .select("*", { count: "exact", head: true })
        .eq("approved_by_admin", true)
        .or("subscription_end_date.is.null,subscription_end_date.gt.now()"),

      // Trabajadores aprobados
      supabase
        .from("workers")
        .select("*", { count: "exact", head: true })
        .eq("approved_by_admin", true),

      // Trabajadores pendientes de aprobación
      supabase
        .from("workers")
        .select("*", { count: "exact", head: true })
        .eq("approved_by_admin", false),

      // Trabajadores con suscripción gratuita
      supabase
        .from("workers")
        .select("*", { count: "exact", head: true })
        .eq("subscription_type", "free")
        .eq("approved_by_admin", true),

      // Trabajadores pagando
      supabase
        .from("workers")
        .select("*", { count: "exact", head: true })
        .eq("subscription_type", "paid")
        .eq("approved_by_admin", true),

      // Eventos recientes (últimos 30 días)
      supabase
        .from("events")
        .select("id, titulo, fecha_evento, estado")
        .gte("fecha_evento", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("fecha_evento", { ascending: false })
        .limit(10),

      // Trabajadores pendientes de aprobación (con detalles)
      supabase
        .from("workers")
        .select(
          `
          id,
          specialization,
          created_at,
          users:user_id (
            id,
            name,
            email,
            phone
          )
        `
        )
        .eq("approved_by_admin", false)
        .order("created_at", { ascending: false })
        .limit(10),

      // Próximas renovaciones (suscripciones que expiran en 7 días)
      supabase
        .from("workers")
        .select(
          `
          id,
          subscription_type,
          subscription_end_date,
          users:user_id (
            id,
            name,
            email
          )
        `
        )
        .eq("approved_by_admin", true)
        .gte("subscription_end_date", new Date().toISOString())
        .lte(
          "subscription_end_date",
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("subscription_end_date", { ascending: true })
        .limit(10),
    ]);

    // Calcular ingresos del mes actual (de trabajadores pagando)
    const { data: paidSubscriptions } = await supabase
      .from("subscriptions")
      .select("amount")
      .eq("subscription_type", "worker")
      .eq("status", "active")
      .gte("start_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const totalIncome = paidSubscriptions?.reduce((sum, sub) => sum + (Number(sub.amount) || 0), 0) || 0;

    // Calcular eventos del mes actual
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: eventsThisMonth } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCompanies: totalCompanies || 0,
          totalWorkers: totalWorkers || 0,
          activeWorkers: activeWorkers || 0,
          approvedWorkers: approvedWorkers || 0,
          pendingWorkers: pendingWorkers || 0,
          freeWorkers: freeWorkers || 0,
          paidWorkers: paidWorkers || 0,
          eventsThisMonth: eventsThisMonth || 0,
          totalIncome: totalIncome,
        },
        pendingActions: {
          workersToApprove: pendingApprovals || [],
          upcomingRenewals: upcomingRenewals || [],
        },
        recentActivity: {
          recentEvents: recentEvents || [],
        },
      },
    });
  } catch (error) {
    console.error("Error in superadmin dashboard:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
