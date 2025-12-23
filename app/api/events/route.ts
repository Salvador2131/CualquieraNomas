import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { eventSchema, paginationSchema } from "@/lib/validations/schemas";
import {
  validateRequest,
  createValidationErrorResponse,
} from "@/lib/middleware/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from "@/lib/api/response-handler";
import { apiLogger } from "@/lib/logger";
import { createEventWithAssignments } from "@/lib/business-rules";
import { validateEventDates } from "@/lib/business-rules";
import { getCurrentOrganizationId, getCurrentUserInfo } from "@/lib/utils/api-organization-filter";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = createClient();
  const userInfo = await getCurrentUserInfo(request, supabase);
  
  if (!userInfo) {
    return createErrorResponse(
      { message: "No autenticado" },
      "Error de autenticación",
      401
    );
  }

  const { searchParams } = new URL(request.url);
  const estadoFilter = searchParams.get("estado");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  // Construir query
  let query = supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("organization_id", userInfo.organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filtrar por estado si se especifica
  if (estadoFilter) {
    query = query.eq("estado", estadoFilter);
  }

  const { data: events, error, count } = await query;

  if (error) {
    apiLogger.error("Error fetching events", {
      error: error.message,
      code: error.code,
    });
    return createErrorResponse(error, "Error al obtener eventos");
  }

  return createSuccessResponse(
    {
      events: events || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    },
    "Eventos obtenidos correctamente"
  );
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = createClient();
  const userInfo = await getCurrentUserInfo(request, supabase);
  
  if (!userInfo) {
    return createErrorResponse(
      { message: "No se pudo determinar la organización del usuario" },
      "Error de autenticación",
      401
    );
  }

  const body = await request.json();
  const workerIds = body.workerIds || [];

  // Validar fechas usando reglas de negocio
  if (body.fecha_evento && body.hora_inicio && body.hora_fin) {
    const dateValidation = validateEventDates(
      body.fecha_evento,
      body.hora_inicio,
      body.hora_fin
    );
    if (!dateValidation.isValid) {
      return createValidationErrorResponse(
        dateValidation.errors.map((error) => ({
          field: "dates",
          message: error,
        })),
        "Errores en las fechas del evento"
      );
    }
  }

  // Crear evento con asignaciones usando reglas de negocio
  const result = await createEventWithAssignments(
    {
      eventData: {
        titulo: body.titulo,
        descripcion: body.descripcion,
        fecha_evento: body.fecha_evento,
        hora_inicio: body.hora_inicio,
        hora_fin: body.hora_fin,
        ubicacion: body.ubicacion,
        tipo_evento: body.tipo_evento,
        numero_invitados: body.numero_invitados,
        presupuesto_total: body.presupuesto_total,
        estado: body.estado || "planificando",
        checklist: body.checklist,
        preregistration_id: body.preregistration_id,
      },
      workerIds,
      userId: userInfo.userId,
      organizationId: userInfo.organizationId,
    },
    supabase
  );

  if (!result.success) {
    return createValidationErrorResponse(
      result.errors.map((error) => ({
        field: "event",
        message: error,
      })),
      "Errores al crear el evento"
    );
  }

  return createSuccessResponse(
    {
      eventId: result.data?.eventId,
      message: "Evento creado exitosamente",
    },
    "Evento creado correctamente",
    201
  );
});
