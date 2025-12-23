import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Obtener información del usuario y organización (opcional para desarrollo)
    let organizationId: string | undefined;
    try {
      const userInfo = await getCurrentUserInfo(request, supabase);
      organizationId = userInfo?.organizationId;
    } catch (authError) {
      // Si no hay usuario autenticado, continuar sin filtro de organización
      // Esto permite que el endpoint funcione en desarrollo
      console.warn("No se pudo obtener información del usuario, continuando sin filtro de organización");
    }

    // Obtener conteos básicos (filtrados por organización si aplica)
    let usersQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true });
    
    let workersQuery = supabase
      .from("workers")
      .select("*", { count: "exact", head: true });
    
    let employersQuery = supabase
      .from("employers")
      .select("*", { count: "exact", head: true });
    
    let eventsQuery = supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    // Aplicar filtro de organización si existe
    if (organizationId) {
      usersQuery = usersQuery.eq("organization_id", organizationId);
      workersQuery = workersQuery.eq("organization_id", organizationId);
      employersQuery = employersQuery.eq("organization_id", organizationId);
      eventsQuery = eventsQuery.eq("organization_id", organizationId);
    }

    const [
      { count: usersCount },
      { count: workersCount },
      { count: employersCount },
      { count: eventsCount },
    ] = await Promise.all([
      usersQuery,
      workersQuery,
      employersQuery,
      eventsQuery,
    ]);

    // Obtener eventos activos y completados
    let activeEventsQuery = supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .in("estado", ["confirmado", "en_progreso"]);
    
    let completedEventsQuery = supabase
      .from("events")
      .select("presupuesto_total", { count: "exact" })
      .eq("estado", "completado");

    if (organizationId) {
      activeEventsQuery = activeEventsQuery.eq("organization_id", organizationId);
      completedEventsQuery = completedEventsQuery.eq("organization_id", organizationId);
    }

    const [
      { count: activeEventsCount },
      { data: completedEvents, count: completedEventsCount },
    ] = await Promise.all([
      activeEventsQuery,
      completedEventsQuery,
    ]);

    // Calcular promedio de presupuesto
    const averageBudget = completedEvents && completedEvents.length > 0
      ? completedEvents.reduce((sum: number, event: any) => sum + (parseFloat(event.presupuesto_total) || 0), 0) / completedEvents.length
      : 0;

    // Obtener promedio de rating de trabajadores
    let ratingsQuery = supabase
      .from("workers")
      .select("rating")
      .not("rating", "is", null);

    if (organizationId) {
      ratingsQuery = ratingsQuery.eq("organization_id", organizationId);
    }

    const { data: workersWithRatings } = await ratingsQuery;
    const averageWorkerRating = workersWithRatings && workersWithRatings.length > 0
      ? workersWithRatings.reduce((sum, worker) => sum + (parseFloat(worker.rating) || 0), 0) / workersWithRatings.length
      : 0;

    return NextResponse.json({
      users: {
        total: usersCount || 0,
        workers: workersCount || 0,
        employers: employersCount || 0,
      },
      events: {
        total: eventsCount || 0,
        active: activeEventsCount || 0,
        completed: completedEventsCount || 0,
        averageBudget: Math.round(averageBudget),
      },
      revenue: {
        total: 0, // TODO: Calcular ingresos totales
        employerSpent: 0, // TODO: Calcular gasto total de empleadores
      },
      ratings: {
        averageWorker: Math.round(averageWorkerRating * 10) / 10, // Redondear a 1 decimal
      },
      error: false,
      message: "Dashboard stats loaded",
      connected: true,
    });
  } catch (error) {
    console.error("Error en dashboard API:", error);

    return NextResponse.json(
      {
        users: { total: 0, workers: 0, employers: 0 },
        events: { total: 0, active: 0, completed: 0, averageBudget: 0 },
        revenue: { total: 0, employerSpent: 0 },
        ratings: { averageWorker: 0 },
        error: true,
        message: error instanceof Error ? error.message : "Error desconocido",
        connected: false,
      },
      { status: 500 }
    );
  }
}

