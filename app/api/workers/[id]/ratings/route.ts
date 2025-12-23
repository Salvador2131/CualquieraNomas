import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

/**
 * Obtener calificaciones de un trabajador
 * GET /api/workers/[id]/ratings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workerId } = await params;
    const supabase = createClient();

    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    const { data: ratings, error } = await supabase
      .from("event_ratings")
      .select(
        `
        id,
        score,
        comment,
        created_at,
        events:event_id (
          id,
          titulo,
          fecha_evento
        ),
        users:rated_by_user_id (
          id,
          name
        )
      `
      )
      .eq("worker_id", workerId)
      .eq("organization_id", userInfo.organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ratings:", error);
      return NextResponse.json(
        { success: false, message: "Error al obtener calificaciones" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ratings: ratings || [],
    });
  } catch (error) {
    console.error("Error in get worker ratings:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
