import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("reports")
      .select(`
        *,
        generated_by_user:generated_by (
          id,
          name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (reportType) {
      query = query.eq("report_type", reportType);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error("Error fetching reports:", error);
      return NextResponse.json(
        { error: "Error al obtener reportes" },
        { status: 500 }
      );
    }

    // Obtener total de registros
    const { count } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in reports API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const {
      report_type,
      title,
      description,
      parameters,
      format = "json",
    } = body;

    // Generar datos del reporte según el tipo
    let reportData;
    let reportTitle = title;

    switch (report_type) {
      case "events":
        reportData = await generateEventsReport(parameters);
        reportTitle = reportTitle || "Reporte de Eventos";
        break;

      case "workers":
        reportData = await generateWorkersReport(parameters);
        reportTitle = reportTitle || "Reporte de Trabajadores";
        break;

      case "financial":
        reportData = await generateFinancialReport(parameters);
        reportTitle = reportTitle || "Reporte Financiero";
        break;

      case "performance":
        reportData = await generatePerformanceReport(parameters);
        reportTitle = reportTitle || "Reporte de Rendimiento";
        break;

      case "client_satisfaction":
        reportData = await generateClientSatisfactionReport(parameters);
        reportTitle = reportTitle || "Reporte de Satisfacción de Clientes";
        break;

      default:
        return NextResponse.json(
          { error: "Tipo de reporte no válido" },
          { status: 400 }
        );
    }

    // Crear registro del reporte
    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        report_type,
        title: reportTitle,
        description,
        parameters: parameters || {},
        data: reportData,
        format,
        status: "completed",
        generated_by: body.generated_by,
        file_size: JSON.stringify(reportData).length,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating report:", error);
      return NextResponse.json(
        { error: "Error al crear reporte" },
        { status: 500 }
      );
    }

    // Crear log
    await supabase.from("report_logs").insert({
      report_id: report.id,
      action: "generated",
      details: { generated_at: new Date().toISOString() },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Error in reports POST API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Funciones auxiliares para generar reportes
async function generateEventsReport(parameters: any) {
  const supabase = createClient();
  const { start_date, end_date, event_status, event_type } = parameters;

  const { data, error } = await supabase.rpc("generate_events_report", {
    p_start_date: start_date,
    p_end_date: end_date,
    p_event_status: event_status,
    p_event_type: event_type,
  });

  if (error) {
    console.error("Error generating events report:", error);
    return { error: "Error al generar reporte de eventos" };
  }

  return data;
}

async function generateWorkersReport(parameters: any) {
  const supabase = createClient();
  const { start_date, end_date, worker_role } = parameters;

  const { data, error } = await supabase.rpc("generate_workers_report", {
    p_start_date: start_date,
    p_end_date: end_date,
    p_worker_role: worker_role,
  });

  if (error) {
    console.error("Error generating workers report:", error);
    return { error: "Error al generar reporte de trabajadores" };
  }

  return data;
}

async function generateFinancialReport(parameters: any) {
  const supabase = createClient();
  const { start_date, end_date } = parameters;

  const { data: events, error } = await supabase
    .from("events")
    .select("presupuesto_total, created_at, estado")
    .gte("created_at", start_date)
    .lte("created_at", end_date);

  if (error) {
    console.error("Error generating financial report:", error);
    return { error: "Error al generar reporte financiero" };
  }

  const totalRevenue = events?.reduce((sum, event) => sum + (event.presupuesto_total || 0), 0) || 0;
  const completedEvents = events?.filter(event => event.estado === 'completado').length || 0;
  const pendingEvents = events?.filter(event => event.estado === 'planificacion').length || 0;

  return {
    summary: {
      total_revenue: totalRevenue,
      completed_events: completedEvents,
      pending_events: pendingEvents,
      average_revenue_per_event: completedEvents > 0 ? totalRevenue / completedEvents : 0,
    },
    events: events,
  };
}

async function generatePerformanceReport(parameters: any) {
  const supabase = createClient();
  const { start_date, end_date } = parameters;

  // Obtener métricas de rendimiento
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, titulo, fecha_evento, estado, numero_invitados")
    .gte("fecha_evento", start_date)
    .lte("fecha_evento", end_date);

  if (eventsError) {
    console.error("Error generating performance report:", eventsError);
    return { error: "Error al generar reporte de rendimiento" };
  }

  const { data: evaluations, error: evalError } = await supabase
    .from("event_evaluations")
    .select("event_id, overall_rating, service_quality, food_quality, staff_performance")
    .gte("created_at", start_date)
    .lte("created_at", end_date);

  if (evalError) {
    console.error("Error generating performance report:", evalError);
    return { error: "Error al generar reporte de rendimiento" };
  }

  const averageRating = evaluations?.length > 0 
    ? evaluations.reduce((sum, eval) => sum + eval.overall_rating, 0) / evaluations.length 
    : 0;

  return {
    summary: {
      total_events: events?.length || 0,
      completed_events: events?.filter(e => e.estado === 'completado').length || 0,
      average_rating: averageRating,
      total_guests: events?.reduce((sum, e) => sum + (e.numero_invitados || 0), 0) || 0,
    },
    events: events,
    evaluations: evaluations,
  };
}

async function generateClientSatisfactionReport(parameters: any) {
  const supabase = createClient();
  const { start_date, end_date } = parameters;

  const { data: evaluations, error } = await supabase
    .from("client_evaluations")
    .select(`
      *,
      event:event_id (
        id,
        titulo,
        fecha_evento
      )
    `)
    .gte("created_at", start_date)
    .lte("created_at", end_date);

  if (error) {
    console.error("Error generating client satisfaction report:", error);
    return { error: "Error al generar reporte de satisfacción" };
  }

  const totalEvaluations = evaluations?.length || 0;
  const averageRating = totalEvaluations > 0 
    ? evaluations.reduce((sum, eval) => sum + eval.overall_rating, 0) / totalEvaluations 
    : 0;
  const wouldRecommend = evaluations?.filter(eval => eval.would_recommend).length || 0;

  return {
    summary: {
      total_evaluations: totalEvaluations,
      average_rating: averageRating,
      would_recommend_count: wouldRecommend,
      would_recommend_percentage: totalEvaluations > 0 ? (wouldRecommend / totalEvaluations) * 100 : 0,
    },
    evaluations: evaluations,
  };
}
