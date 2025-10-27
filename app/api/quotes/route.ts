import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { quoteSchema, paginationSchema } from "@/lib/validations/schemas";
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
    status: searchParams.get("status") || undefined,
    event_id: searchParams.get("event_id") || undefined,
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
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (queryParams.status) {
    query = query.eq("status", queryParams.status);
  }

  if (queryParams.event_id) {
    query = query.eq("event_id", queryParams.event_id);
  }

  const { data: quotes, error } = await query;

  if (error) {
    apiLogger.error("Error fetching quotes", {
      error: error.message,
      code: error.code,
      queryParams,
    });

    return createErrorResponse(error, "Error al obtener cotizaciones");
  }

  // 5. Obtener total de registros para paginación
  const { count } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true });

  // 6. Log de éxito
  apiLogger.info("Quotes fetched successfully", {
    count: quotes?.length || 0,
    total: count || 0,
    page,
    limit,
    status: queryParams.status,
  });

  return createSuccessResponse(
    {
      quotes: quotes || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    },
    "Cotizaciones obtenidas correctamente"
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
  const validation = validateRequest(quoteSchema, body);

  if (!validation.success) {
    return createValidationErrorResponse(
      validation.details,
      "Datos de cotización inválidos"
    );
  }

  const validatedData = validation.data;

  // 3. Crear cliente de Supabase
  const supabase = createClient();

  // 4. Crear cotización
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      event_id: validatedData.event_id || null,
      client_name: validatedData.client_name,
      client_email: validatedData.client_email,
      client_phone: validatedData.client_phone || null,
      event_type: validatedData.event_type,
      event_date: validatedData.event_date,
      guest_count: validatedData.guest_count,
      base_price: validatedData.base_price,
      services: validatedData.services,
      subtotal: validatedData.subtotal,
      taxes: validatedData.taxes,
      total: validatedData.total,
      expiration_date: validatedData.expiration_date,
      status: validatedData.status,
      notes: validatedData.notes || null,
    })
    .select()
    .single();

  if (error) {
    apiLogger.error("Error creating quote", {
      error: error.message,
      code: error.code,
      data: validatedData,
    });

    return createErrorResponse(error, "Error al crear cotización");
  }

  // 5. Log de éxito
  apiLogger.info("Quote created successfully", {
    quoteId: data.id,
    clientEmail: validatedData.client_email,
    total: validatedData.total,
  });

  return createSuccessResponse(
    {
      quote: data,
      message: "Cotización creada exitosamente",
    },
    "Cotización creada correctamente",
    201
  );
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  // 1. Verificaciones de seguridad
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Obtener y validar datos del body
  const body = await request.json();
  const { id, ...updateData } = body;

  if (!id) {
    return createValidationErrorResponse(
      [{ field: "id", message: "id es requerido" }],
      "Parámetros inválidos"
    );
  }

  // 3. Validar datos de actualización
  const validation = validateRequest(quoteSchema.partial(), updateData);
  if (!validation.success) {
    return createValidationErrorResponse(
      validation.details,
      "Datos de actualización inválidos"
    );
  }

  // 4. Crear cliente de Supabase
  const supabase = createClient();

  // 5. Actualizar cotización
  const { data, error } = await supabase
    .from("quotes")
    .update({
      ...validation.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    apiLogger.error("Error updating quote", {
      error: error.message,
      code: error.code,
      quoteId: id,
      updateData: validation.data,
    });

    return createErrorResponse(error, "Error al actualizar cotización");
  }

  // 6. Log de éxito
  apiLogger.info("Quote updated successfully", {
    quoteId: id,
    updatedFields: Object.keys(validation.data),
  });

  return createSuccessResponse(
    {
      quote: data,
      message: "Cotización actualizada exitosamente",
    },
    "Cotización actualizada correctamente"
  );
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  // 1. Verificaciones de seguridad
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Validar parámetros
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return createValidationErrorResponse(
      [{ field: "id", message: "id es requerido" }],
      "Parámetros inválidos"
    );
  }

  // 3. Crear cliente de Supabase
  const supabase = createClient();

  // 4. Eliminar cotización
  const { error } = await supabase.from("quotes").delete().eq("id", id);

  if (error) {
    apiLogger.error("Error deleting quote", {
      error: error.message,
      code: error.code,
      quoteId: id,
    });

    return createErrorResponse(error, "Error al eliminar cotización");
  }

  // 5. Log de éxito
  apiLogger.info("Quote deleted successfully", {
    quoteId: id,
  });

  return createSuccessResponse(
    {
      message: "Cotización eliminada exitosamente",
    },
    "Cotización eliminada correctamente"
  );
});

