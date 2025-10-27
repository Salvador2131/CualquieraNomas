import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { notificationService } from "@/lib/services/notification-service";
import {
  preregistrationSchema,
  paginationSchema,
} from "@/lib/validations/schemas";
import {
  validateRequest,
  createValidationErrorResponse,
} from "@/lib/middleware/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from "@/lib/api/response-handler";
import { mainSecurityMiddleware } from "@/lib/middleware";
import { apiLogger } from "@/lib/logger";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // 1. Verificaciones de seguridad
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Obtener y validar datos del body
  const body = await request.json();
  const validation = validateRequest(preregistrationSchema, body);

  if (!validation.success) {
    return createValidationErrorResponse(
      validation.details,
      "Datos de preregistro inválidos"
    );
  }

  const validatedData = validation.data;

  // 3. Validaciones de negocio adicionales
  const eventDate = new Date(validatedData.event_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (eventDate < today) {
    return createValidationErrorResponse(
      [
        {
          field: "event_date",
          message: "La fecha del evento no puede ser en el pasado",
        },
      ],
      "Fecha inválida"
    );
  }

  // 4. Crear cliente de Supabase
  const supabase = createClient();

  // 5. Insertar preregistro en la base de datos
  const { data, error } = await supabase
    .from("preregistrations")
    .insert([
      {
        client_name: validatedData.client_name,
        client_email: validatedData.client_email,
        client_phone: validatedData.client_phone,
        event_type: validatedData.event_type,
        event_date: validatedData.event_date,
        guest_count: validatedData.guest_count,
        budget: validatedData.budget,
        location: validatedData.location,
        special_requirements: validatedData.special_requirements,
        status: validatedData.status,
      },
    ])
    .select()
    .single();

  if (error) {
    apiLogger.error("Error inserting preregistration", {
      error: error.message,
      code: error.code,
      data: validatedData,
    });

    return createErrorResponse(error, "Error al guardar la solicitud");
  }

  // 6. Enviar notificación a administradores
  try {
    await notificationService.notifyNewPreregistrationToAdmins(data.id);
  } catch (notificationError) {
    apiLogger.warn("Failed to send notification", {
      preregistrationId: data.id,
      error:
        notificationError instanceof Error
          ? notificationError.message
          : "Unknown error",
    });
    // No fallar la operación por error de notificación
  }

  // 7. Log de éxito
  apiLogger.info("Preregistration created successfully", {
    preregistrationId: data.id,
    clientEmail: validatedData.client_email,
    eventType: validatedData.event_type,
  });

  return createSuccessResponse(
    {
      preregistration_id: data.id,
      message: "Solicitud enviada exitosamente",
    },
    "Preregistro creado correctamente",
    201
  );
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Verificaciones de seguridad
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Validar parámetros de consulta
  const { searchParams } = new URL(request.url);
  const queryParams = {
    estado: searchParams.get("estado") || "pending",
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "10"),
  };

  const paginationValidation = validateRequest(paginationSchema, queryParams);
  if (!paginationValidation.success) {
    return createValidationErrorResponse(
      paginationValidation.details,
      "Parámetros de paginación inválidos"
    );
  }

  const { page, limit } = paginationValidation.data;
  const offset = (page - 1) * limit;

  // 3. Crear cliente de Supabase
  const supabase = createClient();

  // 4. Obtener preregistros con paginación
  const { data: preregistrations, error } = await supabase
    .from("preregistrations")
    .select(
      `
      *,
      administrador:users!preregistrations_id_administrador_asignado_fkey(name, email)
    `
    )
    .eq("status", queryParams.estado)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    apiLogger.error("Error fetching preregistrations", {
      error: error.message,
      code: error.code,
      queryParams,
    });

    return createErrorResponse(error, "Error al obtener las solicitudes");
  }

  // 5. Obtener total de registros para paginación
  const { count } = await supabase
    .from("preregistrations")
    .select("*", { count: "exact", head: true })
    .eq("status", queryParams.estado);

  // 6. Log de éxito
  apiLogger.info("Preregistrations fetched successfully", {
    count: preregistrations?.length || 0,
    total: count || 0,
    page,
    limit,
    status: queryParams.estado,
  });

  return createSuccessResponse(
    {
      preregistrations: preregistrations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    },
    "Preregistros obtenidos correctamente"
  );
});
