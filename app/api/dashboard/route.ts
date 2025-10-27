import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServerClient();

    // Obtener estadísticas del dashboard
    const { data: stats, error } = await supabase
      .from("dashboard_stats")
      .select("*")
      .single();

    if (error) {
      // Si no existe la tabla dashboard_stats, calcular las estadísticas en tiempo real
      return await getRealTimeStats();
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error en dashboard API:", error);
    return await getRealTimeStats();
  }
}

async function getRealTimeStats() {
  try {
    const supabase = createServerClient();

    // Obtener conteos básicos
    const { count: usersCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: workersCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "worker");

    const { count: employersCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "employer");

    const { count: eventsCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    const { count: activeEventsCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .in("status", ["confirmed", "in_progress"]);

    const { count: completedEventsCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    // Obtener datos para cálculos
    const { data: eventsData } = await supabase.from("events").select("budget");
    const { data: workersData } = await supabase
      .from("workers")
      .select("rating");
    const { data: employersData } = await supabase
      .from("employers")
      .select("total_spent");

    // Calcular estadísticas con tipos explícitos
    const totalRevenue =
      eventsData?.reduce(
        (sum: number, event: { budget: number }) =>
          sum + (Number(event.budget) || 0),
        0
      ) || 0;
    const averageEventBudget =
      eventsCount && eventsCount > 0 ? totalRevenue / eventsCount : 0;

    const averageWorkerRating =
      workersData && workersData.length > 0
        ? workersData.reduce(
            (sum: number, worker: { rating: number }) =>
              sum + (Number(worker.rating) || 0),
            0
          ) / workersData.length
        : 0;

    const totalEmployerSpent =
      employersData?.reduce(
        (sum: number, employer: { total_spent: number }) =>
          sum + (Number(employer.total_spent) || 0),
        0
      ) || 0;

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
        averageBudget: Math.round(averageEventBudget * 100) / 100,
      },
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        employerSpent: Math.round(totalEmployerSpent * 100) / 100,
      },
      ratings: {
        averageWorker: Math.round(averageWorkerRating * 10) / 10,
      },
      error: false,
      message:
        usersCount === 0
          ? "✅ Conectado a Supabase pero sin datos. Ejecute el script de inserción para poblar la base de datos."
          : "✅ Conectado exitosamente a Supabase con datos reales.",
      connected: true,
    });
  } catch (error) {
    console.error("Error calculando estadísticas en tiempo real:", error);

    return NextResponse.json(
      {
        users: { total: 0, workers: 0, employers: 0 },
        events: { total: 0, active: 0, completed: 0, averageBudget: 0 },
        revenue: { total: 0, employerSpent: 0 },
        ratings: { averageWorker: 0 },
        error: true,
        message: `Error del servidor: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      },
      { status: 500 }
    );
  }
}
