import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

/**
 * Obtener asignaciones del trabajador autenticado
 * GET /api/workers/assignments?status=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = createClient();

    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener worker_id del usuario
    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("id")
      .eq("user_id", userInfo.userId)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (workerError || !worker) {
      return NextResponse.json(
        { success: false, message: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Filtro de status
    const statusFilter = searchParams.get("status");

    // Construir query
    let query = supabase
      .from("event_workers")
      .select(
        `
        id,
        role,
        status,
        payment_agreed,
        accepted_at,
        created_at,
        events:event_id (
          id,
          titulo,
          fecha_evento,
          hora_inicio,
          hora_fin,
          ubicacion,
          estado,
          numero_invitados
        )
      `
      )
      .eq("worker_id", worker.id)
      .eq("organization_id", userInfo.organizationId);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    query = query.order("created_at", { ascending: false });

    const { data: assignments, error } = await query;

    if (error) {
      console.error("Error fetching assignments:", error);
      return NextResponse.json(
        { success: false, message: "Error al obtener asignaciones" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || [],
    });
  } catch (error) {
    console.error("Error in get assignments:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
