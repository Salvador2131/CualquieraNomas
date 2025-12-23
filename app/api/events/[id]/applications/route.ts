import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

/**
 * Obtener postulaciones de trabajadores a un evento
 * GET /api/events/[id]/applications
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

    // Obtener postulaciones (asignaciones en estado "assigned" que fueron creadas por el trabajador)
    const { data: applications, error } = await supabase
      .from("event_workers")
      .select(
        `
        id,
        role,
        status,
        payment_agreed,
        created_at,
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
      .eq("status", "assigned")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      return NextResponse.json(
        { success: false, message: "Error al obtener postulaciones" },
        { status: 500 }
      );
    }

    // Obtener badges para cada trabajador
    const applicationsWithBadges = await Promise.all(
      (applications || []).map(async (app: any) => {
        try {
          const badgesResponse = await supabase.rpc("get_worker_badges", {
            worker_uuid: app.workers?.id,
          });
          return {
            ...app,
            badges: badgesResponse.data || [],
          };
        } catch {
          return {
            ...app,
            badges: [],
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      applications: applicationsWithBadges,
    });
  } catch (error) {
    console.error("Error in get applications:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
