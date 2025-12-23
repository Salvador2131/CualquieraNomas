import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

/**
 * Obtener trabajador por ID
 * GET /api/workers/[id]
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

    const { data: worker, error } = await supabase
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
          email,
          phone
        )
      `
      )
      .eq("id", workerId)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (error || !worker) {
      return NextResponse.json(
        { success: false, message: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      worker,
    });
  } catch (error) {
    console.error("Error in get worker:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
