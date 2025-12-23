import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { logUpdate, logDelete } from "@/lib/business-rules";

/**
 * Eliminar certificado
 * DELETE /api/workers/certificates/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificateId } = await params;
    const supabase = createClient();

    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener certificado
    const { data: certificate, error: certError } = await supabase
      .from("worker_certificates")
      .select("*, workers:worker_id (user_id, organization_id)")
      .eq("id", certificateId)
      .single();

    if (certError || !certificate) {
      return NextResponse.json(
        { success: false, message: "Certificado no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el trabajador es el dueño del certificado
    if (certificate.workers?.user_id !== userInfo.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "No tienes permiso para eliminar este certificado",
        },
        { status: 403 }
      );
    }

    // Eliminar certificado
    const { error: deleteError } = await supabase
      .from("worker_certificates")
      .delete()
      .eq("id", certificateId);

    if (deleteError) {
      console.error("Error deleting certificate:", deleteError);
      return NextResponse.json(
        { success: false, message: "Error al eliminar certificado" },
        { status: 500 }
      );
    }

    // Registrar auditoría
    try {
      await logDelete(
        "certificate",
        certificateId,
        userInfo.userId,
        certificate,
        supabase,
        { organization_id: userInfo.organizationId }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Certificado eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error in delete certificate:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
