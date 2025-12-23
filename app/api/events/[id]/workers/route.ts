import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

/**
 * Obtener trabajadores asignados a un evento
 * GET /api/events/[id]/workers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = createClient();

    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    const { data: workers, error } = await supabase
      .from("event_workers")
      .select(
        `
        worker_id,
        status,
        workers:worker_id (
          id,
          specialization,
          rating,
          users:user_id (
            id,
            name,
            email
          )
        )
      `
      )
      .eq("event_id", eventId)
      .eq("organization_id", userInfo.organizationId)
      .in("status", ["accepted", "completed"]);

    if (error) {
      console.error("Error fetching workers:", error);
      return NextResponse.json(
        { success: false, message: "Error al obtener trabajadores" },
        { status: 500 }
      );
    }

    // Transformar datos
    const formattedWorkers = (workers || []).map((item: any) => ({
      id: item.workers?.id,
      specialization: item.workers?.specialization,
      rating: item.workers?.rating,
      users: item.workers?.users,
    }));

    return NextResponse.json({
      success: true,
      workers: formattedWorkers,
    });
  } catch (error) {
    console.error("Error in get event workers:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
