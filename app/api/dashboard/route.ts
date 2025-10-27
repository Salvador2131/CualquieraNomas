import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServerClient();

    // Obtener conteos básicos
    const { count: usersCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: workersCount } = await supabase
      .from("workers")
      .select("*", { count: "exact", head: true });

    const { count: employersCount } = await supabase
      .from("employers")
      .select("*", { count: "exact", head: true });

    const { count: eventsCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      users: {
        total: usersCount || 0,
        workers: workersCount || 0,
        employers: employersCount || 0,
      },
      events: {
        total: eventsCount || 0,
        active: 0,
        completed: 0,
        averageBudget: 0,
      },
      revenue: {
        total: 0,
        employerSpent: 0,
      },
      ratings: {
        averageWorker: 0,
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

