import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

/**
 * Obtener todos los certificados pendientes de verificación
 * GET /api/superadmin/certificates?status=pending
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const supabase = createClient();

    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar que es superadmin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", userInfo.userId)
      .single();

    if (user?.role !== "superadmin") {
      return NextResponse.json(
        { success: false, message: "No tienes permiso para esta acción" },
        { status: 403 }
      );
    }

    // Construir query
    let query = supabase
      .from("worker_certificates")
      .select(
        `
        *,
        workers:worker_id (
          id,
          specialization,
          users:user_id (
            id,
            name,
            email
          )
        ),
        verified_by:verified_by_user_id (
          id,
          name
        )
      `
      )
      .order("created_at", { ascending: false });

    // Filtrar por estado
    if (status === "pending") {
      query = query.eq("verified", false);
    } else if (status === "verified") {
      query = query.eq("verified", true);
    }

    const { data: certificates, error } = await query;

    if (error) {
      console.error("Error fetching certificates:", error);
      return NextResponse.json(
        { success: false, message: "Error al obtener certificados" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      certificates: certificates || [],
      total: certificates?.length || 0,
    });
  } catch (error) {
    console.error("Error in get certificates:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
