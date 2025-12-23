import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { logUpdate } from "@/lib/business-rules";
import { z } from "zod";

const verifyCertificateSchema = z.object({
  verified: z.boolean(),
  reason: z.string().optional(),
});

/**
 * Verificar o rechazar certificado
 * PUT /api/superadmin/certificates/[id]/verify
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificateId } = await params;
    const body = await request.json();

    // Validar datos
    const validation = verifyCertificateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Datos inválidos",
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { verified, reason } = validation.data;
    const supabase = createClient();

    // Verificar autenticación y rol
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

    // Obtener certificado
    const { data: oldCertificate, error: certError } = await supabase
      .from("worker_certificates")
      .select(
        `
        *,
        workers:worker_id (
          id,
          user_id,
          users:user_id (
            id,
            name,
            email
          )
        )
      `
      )
      .eq("id", certificateId)
      .single();

    if (certError || !oldCertificate) {
      return NextResponse.json(
        { success: false, message: "Certificado no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar certificado
    const updateData: any = {
      verified,
      verified_by_user_id: userInfo.userId,
      verified_at: new Date().toISOString(),
    };

    const { data: updatedCertificate, error: updateError } = await supabase
      .from("worker_certificates")
      .update(updateData)
      .eq("id", certificateId)
      .select(
        `
        *,
        workers:worker_id (
          id,
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
      .single();

    if (updateError) {
      console.error("Error updating certificate:", updateError);
      return NextResponse.json(
        { success: false, message: "Error al actualizar certificado" },
        { status: 500 }
      );
    }

    // Registrar auditoría
    try {
      await logUpdate(
        "certificate",
        certificateId,
        userInfo.userId,
        oldCertificate,
        updatedCertificate,
        supabase,
        { organization_id: userInfo.organizationId }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // Notificar al trabajador
    if (oldCertificate.workers?.users?.id) {
      try {
        const { notificationService } = await import(
          "@/lib/services/notification-service"
        );
        await notificationService.createNotification({
          destinatario_id: oldCertificate.workers.users.id,
          destinatario_tipo: "worker",
          titulo: verified ? "Certificado Verificado" : "Certificado Rechazado",
          mensaje: verified
            ? `Tu certificado "${oldCertificate.certificate_name}" ha sido verificado y aprobado.`
            : `Tu certificado "${
                oldCertificate.certificate_name
              }" ha sido rechazado. ${reason ? `Razón: ${reason}` : ""}`,
          tipo: verified ? "success" : "warning",
          organization_id: userInfo.organizationId,
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: verified
        ? "Certificado verificado exitosamente"
        : "Certificado rechazado",
      certificate: updatedCertificate,
    });
  } catch (error) {
    console.error("Error in verify certificate:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
