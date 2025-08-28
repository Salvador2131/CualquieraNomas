import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Import Supabase only when needed to avoid connection errors
    const { createClient } = await import("@supabase/supabase-js")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        users: { total: 0, workers: 0, employers: 0 },
        events: { total: 0, active: 0, completed: 0, averageBudget: 0 },
        revenue: { total: 0, employerSpent: 0 },
        ratings: { averageWorker: 0 },
        error: true,
        message: "Variables de entorno de Supabase no configuradas.",
        setupRequired: true,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test connection with a simple query
    const { data: testData, error: testError } = await supabase.from("users").select("count").limit(1)

    if (testError) {
      console.error("Database connection error:", testError)

      return NextResponse.json({
        users: { total: 0, workers: 0, employers: 0 },
        events: { total: 0, active: 0, completed: 0, averageBudget: 0 },
        revenue: { total: 0, employerSpent: 0 },
        ratings: { averageWorker: 0 },
        error: true,
        message: "Error de conexión a la base de datos. Verifique que las tablas existan.",
        setupRequired: true,
      })
    }

    // If we get here, connection is working
    // Get basic counts
    const { count: usersCount } = await supabase.from("users").select("*", { count: "exact", head: true })

    const { count: workersCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "worker")

    const { count: employersCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "employer")

    const { count: eventsCount } = await supabase.from("events").select("*", { count: "exact", head: true })

    const { count: activeEventsCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .in("status", ["confirmed", "in_progress"])

    const { count: completedEventsCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")

    // Get data for calculations
    const { data: eventsData } = await supabase.from("events").select("budget")

    const { data: workersData } = await supabase.from("workers").select("rating")

    const { data: employersData } = await supabase.from("employers").select("total_spent")

    // Calculate statistics
    const totalRevenue = eventsData?.reduce((sum, event) => sum + (Number(event.budget) || 0), 0) || 0
    const averageEventBudget = eventsCount && eventsCount > 0 ? totalRevenue / eventsCount : 0

    const averageWorkerRating =
      workersData && workersData.length > 0
        ? workersData.reduce((sum, worker) => sum + (Number(worker.rating) || 0), 0) / workersData.length
        : 0

    const totalEmployerSpent =
      employersData?.reduce((sum, employer) => sum + (Number(employer.total_spent) || 0), 0) || 0

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
      message: usersCount === 0 ? "Base de datos conectada pero sin datos. Ejecute el script de inserción." : null,
    })
  } catch (error) {
    console.error("Error in dashboard stats API:", error)

    return NextResponse.json(
      {
        users: { total: 0, workers: 0, employers: 0 },
        events: { total: 0, active: 0, completed: 0, averageBudget: 0 },
        revenue: { total: 0, employerSpent: 0 },
        ratings: { averageWorker: 0 },
        error: true,
        message: `Error del servidor: ${error instanceof Error ? error.message : "Error desconocido"}`,
      },
      { status: 500 },
    )
  }
}
