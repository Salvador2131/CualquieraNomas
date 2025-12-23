import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { validateWorkerAvailability } from "@/lib/business-rules";

/**
 * Buscar trabajadores disponibles para un evento
 * GET /api/events/[id]/available-workers?specialization=...&minRating=...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const supabase = createClient();

    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener información del evento
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, fecha_evento, hora_inicio, hora_fin, organization_id")
      .eq("id", eventId)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Filtros
    const specialization = searchParams.get("specialization");
    const minRating = searchParams.get("minRating");

    // Construir query base
    let query = supabase
      .from("workers")
      .select(
        `
        id,
        specialization,
        rating,
        approved_by_admin,
        users:user_id (
          id,
          name,
          email
        )
      `
      )
      .eq("organization_id", userInfo.organizationId)
      .eq("approved_by_admin", true);

    // Filtro por especialización
    if (specialization) {
      query = query.ilike("specialization", `%${specialization}%`);
    }

    // Filtro por rating mínimo
    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      query = query.gte("rating", minRatingNum);
    }

    const { data: workers, error: workersError } = await query;

    if (workersError) {
      console.error("Error fetching workers:", workersError);
      return NextResponse.json(
        { success: false, message: "Error al obtener trabajadores" },
        { status: 500 }
      );
    }

    // Verificar disponibilidad de cada trabajador
    const availableWorkers = [];
    for (const worker of workers || []) {
      const availability = await validateWorkerAvailability(
        worker.id,
        event.fecha_evento,
        event.hora_inicio || "",
        event.hora_fin || "",
        eventId,
        supabase,
        userInfo.organizationId
      );

      if (availability.isAvailable) {
        // Obtener badges
        try {
          const badgesResponse = await supabase.rpc("get_worker_badges", {
            worker_uuid: worker.id,
          });

          availableWorkers.push({
            ...worker,
            badges: badgesResponse.data || [],
          });
        } catch {
          availableWorkers.push({
            ...worker,
            badges: [],
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      workers: availableWorkers,
      total: availableWorkers.length,
    });
  } catch (error) {
    console.error("Error in get available workers:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
