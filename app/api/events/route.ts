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
import { mainSecurityMiddleware } from "@/lib/middleware";
import { apiLogger } from "@/lib/logger";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Verificaciones de seguridad
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Validar parámetros de consulta
  const { searchParams } = new URL(request.url);
  const queryParams = {
    estado: searchParams.get("estado") || undefined,
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

  // 4. Construir consulta
  let query = supabase
    .from("events")
    .select(
      `
      *,
      preregistro:preregistrations(id, client_name, client_email)
    `
    )
    .order("fecha_evento", { ascending: true });

  if (queryParams.estado) {
    query = query.eq("estado", queryParams.estado);
  }

  const { data: events, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    apiLogger.error("Error fetching events", {
      error: error.message,
      code: error.code,
      queryParams,
    });

    return createErrorResponse(error, "Error al obtener los eventos");
  }

  // 5. Obtener total de eventos para paginación
  let countQuery = supabase
    .from("events")
    .select("*", { count: "exact", head: true });

  if (queryParams.estado) {
    countQuery = countQuery.eq("estado", queryParams.estado);
  }

  const { count } = await countQuery;

  // 6. Log de éxito
  apiLogger.info("Events fetched successfully", {
    count: events?.length || 0,
    total: count || 0,
    page,
    limit,
    estado: queryParams.estado,
  });

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
  // 1. Verificaciones de seguridad
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Obtener y validar datos del body
  const body = await request.json();
  const validation = validateRequest(eventSchema, body);

  if (!validation.success) {
    return createValidationErrorResponse(
      validation.details,
      "Datos de evento inválidos"
    );
  }

  const validatedData = validation.data;

  // 3. Validaciones de negocio adicionales
  const eventDate = new Date(validatedData.fecha_evento);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (eventDate < today) {
    return createValidationErrorResponse(
      [
        {
          field: "fecha_evento",
          message: "La fecha del evento no puede ser en el pasado",
        },
      ],
      "Fecha inválida"
    );
  }

  // 4. Crear cliente de Supabase
  const supabase = createClient();

  // 5. Crear evento
  const { data, error } = await supabase
    .from("events")
    .insert([
      {
        titulo: validatedData.titulo,
        descripcion: validatedData.descripcion,
        tipo_evento: validatedData.tipo_evento,
        fecha_evento: validatedData.fecha_evento,
        hora_inicio: validatedData.hora_inicio,
        hora_fin: validatedData.hora_fin,
        ubicacion: validatedData.ubicacion,
        numero_invitados: validatedData.numero_invitados,
        presupuesto: validatedData.presupuesto,
        estado: validatedData.estado,
        trabajadores_asignados: validatedData.trabajadores_asignados,
        checklist: validatedData.checklist,
        preregistration_id: validatedData.preregistration_id,
      },
    ])
    .select()
    .single();

  if (error) {
    apiLogger.error("Error creating event", {
      error: error.message,
      code: error.code,
      data: validatedData,
    });

    return createErrorResponse(error, "Error al crear el evento");
  }

  // 6. Log de éxito
  apiLogger.info("Event created successfully", {
    eventId: data.id,
    titulo: validatedData.titulo,
    tipo_evento: validatedData.tipo_evento,
    fecha_evento: validatedData.fecha_evento,
  });

  return createSuccessResponse(
    {
      event: data,
      message: "Evento creado exitosamente",
    },
    "Evento creado correctamente",
    201
  );
});
