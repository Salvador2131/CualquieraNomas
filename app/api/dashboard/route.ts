import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { isEnvValid, getEnvErrors } from "@/lib/config/env";

export async function GET(request: NextRequest) {
  try {
    // Verificar configuración de entorno primero
    if (!isEnvValid()) {
      const errors = getEnvErrors();
      return NextResponse.json(
        {
          users: { total: 0, workers: 0, employers: 0 },
          events: { total: 0, active: 0, completed: 0, averageBudget: 0 },
          revenue: { total: 0, employerSpent: 0 },
          ratings: { averageWorker: 0 },
          error: true,
          message: `Configuración inválida: ${errors.join(", ")}. Verifica tus variables de entorno en .env.local`,
          connected: false,
        },
        { status: 500 }
      );
    }

    let supabase;
    try {
      supabase = createServerClient();
    } catch (supabaseError) {
      console.error("Error creando cliente de Supabase:", supabaseError);
      return NextResponse.json(
        {
          users: { total: 0, workers: 0, employers: 0 },
          events: { total: 0, active: 0, completed: 0, averageBudget: 0 },
          revenue: { total: 0, employerSpent: 0 },
          ratings: { averageWorker: 0 },
          error: true,
          message: `Error de conexión con Supabase: ${supabaseError instanceof Error ? supabaseError.message : "Error desconocido"}`,
          connected: false,
        },
        { status: 500 }
      );
    }

    // Obtener información del usuario y organización (opcional para desarrollo)
    let organizationId: string | undefined;
    try {
      const userInfo = await getCurrentUserInfo(request, supabase);
      organizationId = userInfo?.organizationId;
    } catch (authError) {
      // Si no hay usuario autenticado, continuar sin filtro de organización
      // Esto permite que el endpoint funcione en desarrollo
      console.warn(
        "No se pudo obtener información del usuario, continuando sin filtro de organización"
      );
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
      { count: usersCount, error: usersError },
      { count: workersCount, error: workersError },
      { count: employersCount, error: employersError },
      { count: eventsCount, error: eventsError },
    ] = await Promise.all([
      usersQuery,
      workersQuery,
      employersQuery,
      eventsQuery,
    ]);

    // Verificar si hay errores de conexión o tablas no existentes
    if (usersError || workersError || employersError || eventsError) {
      const firstError = usersError || workersError || employersError || eventsError;
      console.error("Error consultando Supabase:", firstError);
      
      // Si es un error de tabla no encontrada, dar mensaje más claro
      if (firstError?.code === "42P01" || firstError?.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            users: { total: 0, workers: 0, employers: 0 },
            events: { total: 0, active: 0, completed: 0, averageBudget: 0 },
            revenue: { total: 0, employerSpent: 0 },
            ratings: { averageWorker: 0 },
            error: true,
            message: "Las tablas no existen en la base de datos. Ejecuta las migraciones en Supabase SQL Editor.",
            connected: false,
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        {
          users: { total: 0, workers: 0, employers: 0 },
          events: { total: 0, active: 0, completed: 0, averageBudget: 0 },
          revenue: { total: 0, employerSpent: 0 },
          ratings: { averageWorker: 0 },
          error: true,
          message: `Error de base de datos: ${firstError?.message || "Error desconocido"}`,
          connected: false,
        },
        { status: 500 }
      );
    }

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
      activeEventsQuery = activeEventsQuery.eq(
        "organization_id",
        organizationId
      );
      completedEventsQuery = completedEventsQuery.eq(
        "organization_id",
        organizationId
      );
    }

    const [
      { count: activeEventsCount },
      { data: completedEvents, count: completedEventsCount },
    ] = await Promise.all([activeEventsQuery, completedEventsQuery]);

    // Calcular promedio de presupuesto
    const averageBudget =
      completedEvents && completedEvents.length > 0
        ? completedEvents.reduce(
            (sum: number, event: any) =>
              sum + (parseFloat(event.presupuesto_total) || 0),
            0
          ) / completedEvents.length
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
    const averageWorkerRating =
      workersWithRatings && workersWithRatings.length > 0
        ? workersWithRatings.reduce(
            (sum, worker) => sum + (parseFloat(worker.rating) || 0),
            0
          ) / workersWithRatings.length
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
