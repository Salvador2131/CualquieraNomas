import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { penaltySchema, paginationSchema } from "@/lib/validations/schemas";
import {
  validateRequest,
  createValidationErrorResponse,
} from "@/lib/middleware/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from "@/lib/api/response-handler";
import { mainSecurityMiddleware } from "@/lib/middleware";
import { apiLogger } from "@/lib/logger";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Verificaciones de seguridad
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Validar parámetros de consulta
  const { searchParams } = new URL(request.url);
  const queryParams = {
    workerId: searchParams.get("workerId") || undefined,
    status: searchParams.get("status") || undefined,
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "10"),
  };

  const paginationValidation = validateRequest(paginationSchema, queryParams);
  if (!paginationValidation.success) {
    return createValidationErrorResponse(
      paginationValidation.details,
      "Parámetros de paginación inválidos"
    );
  }

  const { page, limit } = paginationValidation.data;
  const offset = (page - 1) * limit;

  // 3. Crear cliente de Supabase
  const supabase = createClient();

  // 4. Construir consulta
  let query = supabase
    .from("penalties")
    .select(
      `
      *,
      workers:worker_id (
        id,
        name,
        email
      ),
      events:event_id (
        id,
        titulo,
        fecha_evento
      )
    `
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (queryParams.workerId) {
    query = query.eq("worker_id", queryParams.workerId);
  }

  if (queryParams.status) {
    query = query.eq("status", queryParams.status);
  }

  const { data: penalties, error } = await query;

  if (error) {
    apiLogger.error("Error fetching penalties", {
      error: error.message,
      code: error.code,
      queryParams,
    });

    return createErrorResponse(error, "Error al obtener penalizaciones");
  }

  // 5. Obtener total de registros para paginación
  const { count } = await supabase
    .from("penalties")
    .select("*", { count: "exact", head: true });

  // 6. Log de éxito
  apiLogger.info("Penalties fetched successfully", {
    count: penalties?.length || 0,
    total: count || 0,
    page,
    limit,
    workerId: queryParams.workerId,
    status: queryParams.status,
  });

  return createSuccessResponse(
    {
      penalties: penalties || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    },
    "Penalizaciones obtenidas correctamente"
  );
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      worker_id,
      event_id,
      penalty_type,
      cancellation_type,
      cancellation_reason,
      hours_before_event,
      penalty_points,
      penalty_duration_days,
      admin_notes,
    } = body;

    // Validar campos requeridos
    if (!worker_id || !event_id || !penalty_type || !cancellation_type) {
      return NextResponse.json(
        {
          message:
            "worker_id, event_id, penalty_type y cancellation_type son requeridos",
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("penalties")
      .insert({
        worker_id,
        event_id,
        penalty_type,
        cancellation_type,
        cancellation_reason,
        hours_before_event,
        penalty_points: penalty_points || 0,
        penalty_duration_days: penalty_duration_days || 0,
        admin_notes,
        status: "active",
        details: {
          created_by: "admin",
          created_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating penalty:", error);
      return NextResponse.json(
        { message: "Error al crear penalización" },
        { status: 500 }
      );
    }

    // Crear log de la penalización
    await supabase.from("penalty_logs").insert({
      penalty_id: data.id,
      action: "applied",
      details: {
        penalty_points: data.penalty_points,
        duration_days: data.penalty_duration_days,
        manual: true,
      },
    });

    return NextResponse.json({
      message: "Penalización creada exitosamente",
      penalty: data,
    });
  } catch (error) {
    console.error("Error in penalties POST API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, resolution_type, admin_notes } = body;

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

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    if (status === "resolved" || status === "expired") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("penalties")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating penalty:", error);
      return NextResponse.json(
        { message: "Error al actualizar penalización" },
        { status: 500 }
      );
    }

    // Crear log del cambio
    await supabase.from("penalty_logs").insert({
      penalty_id: id,
      action: status === "resolved" ? "resolved" : "modified",
      details: {
        new_status: status,
        resolution_type,
        updated_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      message: "Penalización actualizada exitosamente",
      penalty: data,
    });
  } catch (error) {
    console.error("Error in penalties PATCH API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
