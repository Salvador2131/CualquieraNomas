import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

/**
 * Búsqueda avanzada de trabajadores con filtros
 * GET /api/workers/search?specialization=...&minRating=...&hasCertified=...
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

    // Filtros
    const specialization = searchParams.get("specialization");
    const minRating = searchParams.get("minRating");
    const hasCertified = searchParams.get("hasCertified") === "true";
    const search = searchParams.get("search");

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
      .eq("approved_by_admin", true); // Solo trabajadores aprobados

    // Filtro por especialización
    if (specialization) {
      query = query.ilike("specialization", `%${specialization}%`);
    }

    // Filtro por rating mínimo
    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      query = query.gte("rating", minRatingNum);
    }

    // Filtro por certificado verificado
    if (hasCertified) {
      // Subquery para trabajadores con certificados verificados
      const { data: certifiedWorkers } = await supabase
        .from("worker_certificates")
        .select("worker_id")
        .eq("verified", true)
        .eq("organization_id", userInfo.organizationId);

      if (certifiedWorkers && certifiedWorkers.length > 0) {
        const workerIds = certifiedWorkers.map((c) => c.worker_id);
        query = query.in("id", workerIds);
      } else {
        // Si no hay certificados verificados, retornar vacío
        return NextResponse.json({
          success: true,
          workers: [],
          total: 0,
        });
      }
    }

    // Búsqueda por nombre
    if (search) {
      // Necesitamos hacer join con users para buscar por nombre
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .ilike("name", `%${search}%`)
        .eq("organization_id", userInfo.organizationId);

      if (users && users.length > 0) {
        const userIds = users.map((u) => u.id);
        query = query.in("user_id", userIds);
      } else {
        return NextResponse.json({
          success: true,
          workers: [],
          total: 0,
        });
      }
    }

    // Ordenar por rating descendente
    query = query.order("rating", { ascending: false, nullsLast: true });

    const { data: workers, error } = await query;

    if (error) {
      console.error("Error searching workers:", error);
      return NextResponse.json(
        { success: false, message: "Error al buscar trabajadores" },
        { status: 500 }
      );
    }

    // Obtener badges para cada trabajador (usando función SQL o cálculo manual)
    const workersWithBadges = await Promise.all(
      (workers || []).map(async (worker) => {
        const badges: string[] = [];

        // Verificar certificado verificado
        const { data: certificate } = await supabase
          .from("worker_certificates")
          .select("id")
          .eq("worker_id", worker.id)
          .eq("verified", true)
          .limit(1)
          .single();

        if (certificate) {
          badges.push("certified");
        }

        // Verificar rating alto
        const { count: ratingCount } = await supabase
          .from("event_ratings")
          .select("*", { count: "exact", head: true })
          .eq("worker_id", worker.id);

        if (worker.rating >= 4.5 && (ratingCount || 0) >= 3) {
          badges.push("high_rating");
        }

        // Verificar asistencias perfectas
        const { count: incidentCount } = await supabase
          .from("incident_reports")
          .select("*", { count: "exact", head: true })
          .eq("worker_id", worker.id)
          .gte(
            "created_at",
            new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
          );

        if ((incidentCount || 0) === 0 && (ratingCount || 0) >= 1) {
          badges.push("perfect_attendance");
        }

        return {
          ...worker,
          badges,
        };
      })
    );

    return NextResponse.json({
      success: true,
      workers: workersWithBadges,
      total: workersWithBadges.length,
    });
  } catch (error) {
    console.error("Error in search workers:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
