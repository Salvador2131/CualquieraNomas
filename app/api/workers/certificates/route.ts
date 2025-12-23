import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { logCreate } from "@/lib/business-rules";
import { z } from "zod";

const createCertificateSchema = z.object({
  certificate_type: z.string().min(1, "El tipo de certificado es requerido"),
  certificate_name: z.string().min(1, "El nombre del certificado es requerido"),
  certificate_file_url: z.string().url("URL de archivo inválida").optional(),
});

/**
 * Obtener certificados del trabajador autenticado
 * GET /api/workers/certificates
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener worker_id del usuario
    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("id")
      .eq("user_id", userInfo.userId)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (workerError || !worker) {
      return NextResponse.json(
        { success: false, message: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Obtener certificados
    const { data: certificates, error } = await supabase
      .from("worker_certificates")
      .select(
        `
        *,
        verified_by:verified_by_user_id (
          id,
          name,
          email
        )
      `
      )
      .eq("worker_id", worker.id)
      .eq("organization_id", userInfo.organizationId)
      .order("created_at", { ascending: false });

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
    });
  } catch (error) {
    console.error("Error in get certificates:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * Crear nuevo certificado
 * POST /api/workers/certificates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos
    const validation = createCertificateSchema.safeParse(body);
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

    const { certificate_type, certificate_name, certificate_file_url } =
      validation.data;
    const supabase = createClient();

    // Verificar autenticación
    const userInfo = await getCurrentUserInfo(request, supabase);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener worker_id del usuario
    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("id")
      .eq("user_id", userInfo.userId)
      .eq("organization_id", userInfo.organizationId)
      .single();

    if (workerError || !worker) {
      return NextResponse.json(
        { success: false, message: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Simular OCR básico (en producción usar servicio real)
    let ocr_data: any = null;
    if (certificate_file_url) {
      // Simulación: extraer datos básicos del nombre del archivo o URL
      ocr_data = {
        extracted_at: new Date().toISOString(),
        confidence: 0.7, // Simulado
        data: {
          certificate_name: certificate_name,
          certificate_type: certificate_type,
        },
      };
    }

    // Crear certificado
    const { data: certificate, error: createError } = await supabase
      .from("worker_certificates")
      .insert({
        worker_id: worker.id,
        certificate_type,
        certificate_name,
        certificate_file_url: certificate_file_url || null,
        verified: false,
        ocr_data,
        organization_id: userInfo.organizationId,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating certificate:", createError);
      return NextResponse.json(
        { success: false, message: "Error al crear certificado" },
        { status: 500 }
      );
    }

    // Registrar auditoría
    try {
      await logCreate(
        "certificate",
        certificate.id,
        userInfo.userId,
        supabase,
        { organization_id: userInfo.organizationId }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // Notificar a SuperAdmin sobre nuevo certificado pendiente
    try {
      const { data: superAdmin } = await supabase
        .from("users")
        .select("id, email")
        .eq("role", "superadmin")
        .limit(1)
        .single();

      if (superAdmin) {
        const { notificationService } = await import(
          "@/lib/services/notification-service"
        );
        await notificationService.createNotification({
          destinatario_id: superAdmin.id,
          destinatario_tipo: "admin",
          titulo: "Nuevo Certificado Pendiente de Verificación",
          mensaje: `Un trabajador ha subido un nuevo certificado: ${certificate_name}. Revisa y verifica el certificado.`,
          tipo: "info",
          organization_id: userInfo.organizationId,
        });
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message:
        "Certificado subido exitosamente. Está pendiente de verificación.",
      certificate,
    });
  } catch (error) {
    console.error("Error in create certificate:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
