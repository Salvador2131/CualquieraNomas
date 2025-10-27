import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId");
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const supabase = createClient();

    let query = supabase
      .from("conflicts")
      .select(`
        *,
        workers:worker_id (
          id,
          name,
          email
        ),
        events:event_id (
          id,
          titulo,
          fecha_evento,
          hora_inicio,
          hora_fin
        )
      `)
      .order("detected_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (workerId) {
      query = query.eq("worker_id", workerId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (severity) {
      query = query.eq("severity", severity);
    }

    const { data: conflicts, error } = await query;

    if (error) {
      console.error("Error fetching conflicts:", error);
      return NextResponse.json(
        { message: "Error al obtener conflictos" },
        { status: 500 }
      );
    }

    // Obtener total de registros para paginación
    const { count } = await supabase
      .from("conflicts")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      conflicts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in conflicts GET API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conflict_type,
      worker_id,
      event_id,
      assignment1_id,
      assignment2_id,
      conflict_details,
      severity,
      resolution_type,
      resolution_details,
    } = body;

    // Validar campos requeridos
    if (!conflict_type || !worker_id || !event_id || !severity) {
      return NextResponse.json(
        { message: "conflict_type, worker_id, event_id y severity son requeridos" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("conflicts")
      .insert({
        conflict_type,
        worker_id,
        event_id,
        assignment1_id,
        assignment2_id,
        conflict_details: conflict_details || {},
        severity,
        status: "detected",
        resolution_type,
        resolution_details: resolution_details || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conflict:", error);
      return NextResponse.json(
        { message: "Error al crear conflicto" },
        { status: 500 }
      );
    }

    // Crear log del conflicto
    await supabase.from("conflict_logs").insert({
      conflict_id: data.id,
      action: "detected",
      details: {
        conflict_type,
        severity,
        created_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      message: "Conflicto creado exitosamente",
      conflict: data,
    });
  } catch (error) {
    console.error("Error in conflicts POST API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, resolution_type, resolution_details } = body;

    if (!id || !status) {
      return NextResponse.json(
        { message: "id y status son requeridos" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (resolution_type) {
      updateData.resolution_type = resolution_type;
    }

    if (resolution_details) {
      updateData.resolution_details = resolution_details;
    }

    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("conflicts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating conflict:", error);
      return NextResponse.json(
        { message: "Error al actualizar conflicto" },
        { status: 500 }
      );
    }

    // Crear log del cambio
    await supabase.from("conflict_logs").insert({
      conflict_id: id,
      action: status === "resolved" ? "resolved" : "modified",
      details: {
        new_status: status,
        resolution_type,
        updated_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      message: "Conflicto actualizado exitosamente",
      conflict: data,
    });
  } catch (error) {
    console.error("Error in conflicts PATCH API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para detectar conflictos automáticamente
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    // Ejecutar función de detección de conflictos
    const { error } = await supabase.rpc("detect_schedule_conflicts");

    if (error) {
      console.error("Error detecting conflicts:", error);
      return NextResponse.json(
        { message: "Error al detectar conflictos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Detección de conflictos ejecutada exitosamente",
    });
  } catch (error) {
    console.error("Error in conflicts detection API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
