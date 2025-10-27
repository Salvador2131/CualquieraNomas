import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const workerId = searchParams.get("worker_id");
    const eventId = searchParams.get("event_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query;
    let tableName;

    switch (type) {
      case "worker":
        tableName = "worker_evaluations";
        query = supabase
          .from(tableName)
          .select(`
            *,
            worker:worker_id (
              id,
              name,
              email
            ),
            evaluator:evaluator_id (
              id,
              name,
              email
            ),
            event:event_id (
              id,
              titulo,
              fecha_evento
            )
          `)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (workerId) {
          query = query.eq("worker_id", workerId);
        }
        break;

      case "event":
        tableName = "event_evaluations";
        query = supabase
          .from(tableName)
          .select(`
            *,
            event:event_id (
              id,
              titulo,
              fecha_evento
            ),
            evaluator:evaluator_id (
              id,
              name,
              email
            )
          `)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (eventId) {
          query = query.eq("event_id", eventId);
        }
        break;

      case "client":
        tableName = "client_evaluations";
        query = supabase
          .from(tableName)
          .select(`
            *,
            event:event_id (
              id,
              titulo,
              fecha_evento
            )
          `)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (eventId) {
          query = query.eq("event_id", eventId);
        }
        break;

      default:
        return NextResponse.json(
          { error: "Tipo de evaluación no válido" },
          { status: 400 }
        );
    }

    const { data: evaluations, error } = await query;

    if (error) {
      console.error("Error fetching evaluations:", error);
      return NextResponse.json(
        { error: "Error al obtener evaluaciones" },
        { status: 500 }
      );
    }

    // Obtener total de registros
    const { count } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      evaluations,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in evaluations API:", error);
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
    const { type, ...evaluationData } = body;

    let tableName;
    let insertData;

    switch (type) {
      case "worker":
        tableName = "worker_evaluations";
        insertData = {
          worker_id: evaluationData.worker_id,
          evaluator_id: evaluationData.evaluator_id,
          event_id: evaluationData.event_id,
          evaluation_type: evaluationData.evaluation_type,
          score: evaluationData.score,
          comments: evaluationData.comments,
          strengths: evaluationData.strengths || [],
          areas_for_improvement: evaluationData.areas_for_improvement || [],
        };
        break;

      case "event":
        tableName = "event_evaluations";
        insertData = {
          event_id: evaluationData.event_id,
          evaluator_id: evaluationData.evaluator_id,
          overall_rating: evaluationData.overall_rating,
          service_quality: evaluationData.service_quality,
          food_quality: evaluationData.food_quality,
          staff_performance: evaluationData.staff_performance,
          venue_condition: evaluationData.venue_condition,
          client_satisfaction: evaluationData.client_satisfaction,
          comments: evaluationData.comments,
          recommendations: evaluationData.recommendations || [],
          would_recommend: evaluationData.would_recommend,
        };
        break;

      case "client":
        tableName = "client_evaluations";
        insertData = {
          event_id: evaluationData.event_id,
          client_email: evaluationData.client_email,
          client_name: evaluationData.client_name,
          overall_rating: evaluationData.overall_rating,
          service_rating: evaluationData.service_rating,
          food_rating: evaluationData.food_rating,
          staff_rating: evaluationData.staff_rating,
          venue_rating: evaluationData.venue_rating,
          comments: evaluationData.comments,
          suggestions: evaluationData.suggestions,
          would_recommend: evaluationData.would_recommend,
        };
        break;

      default:
        return NextResponse.json(
          { error: "Tipo de evaluación no válido" },
          { status: 400 }
        );
    }

    const { data: evaluation, error } = await supabase
      .from(tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating evaluation:", error);
      return NextResponse.json(
        { error: "Error al crear evaluación" },
        { status: 500 }
      );
    }

    // Crear log
    await supabase.from("evaluation_logs").insert({
      evaluation_id: evaluation.id,
      evaluation_type: type,
      action: "created",
      details: { created_at: new Date().toISOString() },
    });

    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    console.error("Error in evaluations POST API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
