import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

/**
 * Obtener badges de un trabajador
 * GET /api/workers/[id]/badges
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

    // Obtener badges usando función SQL
    const { data, error } = await supabase.rpc("get_worker_badges", {
      worker_uuid: workerId,
    });

    if (error) {
      console.error("Error fetching badges:", error);
      // Si la función no existe, calcular badges manualmente
      return await getBadgesManually(
        supabase,
        workerId,
        userInfo.organizationId
      );
    }

    // Obtener rating del trabajador
    const { data: worker } = await supabase
      .from("workers")
      .select("rating")
      .eq("id", workerId)
      .single();

    return NextResponse.json({
      success: true,
      badges: data || [],
      rating: worker?.rating || 0,
    });
  } catch (error) {
    console.error("Error in get badges:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

async function getBadgesManually(
  supabase: any,
  workerId: string,
  organizationId: string
) {
  const badges: string[] = [];

  // Verificar certificado verificado
  const { data: certificate } = await supabase
    .from("worker_certificates")
    .select("id")
    .eq("worker_id", workerId)
    .eq("verified", true)
    .limit(1)
    .single();

  if (certificate) {
    badges.push("certified");
  }

  // Obtener rating y cantidad
  const { data: worker } = await supabase
    .from("workers")
    .select("rating")
    .eq("id", workerId)
    .single();

  const { count: ratingCount } = await supabase
    .from("event_ratings")
    .select("*", { count: "exact", head: true })
    .eq("worker_id", workerId);

  if (worker?.rating >= 4.5 && (ratingCount || 0) >= 3) {
    badges.push("high_rating");
  }

  // Contar incidentes
  const { count: incidentCount } = await supabase
    .from("incident_reports")
    .select("*", { count: "exact", head: true })
    .eq("worker_id", workerId)
    .gte(
      "created_at",
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    );

  if ((incidentCount || 0) === 0 && (ratingCount || 0) >= 1) {
    badges.push("perfect_attendance");
  }

  return NextResponse.json({
    success: true,
    badges,
    rating: worker?.rating || 0,
  });
}
