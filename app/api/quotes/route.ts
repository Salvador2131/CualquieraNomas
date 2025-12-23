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
// import { mainSecurityMiddleware } from "@/lib/middleware"; // Deshabilitado para desarrollo
import { apiLogger } from "@/lib/logger";
import {
  validateQuoteCalculation,
  expireOldQuotes,
} from "@/lib/business-rules";
import {
  getCurrentOrganizationId,
  getCurrentUserInfo,
} from "@/lib/utils/api-organization-filter";
import { logUpdate, logDelete } from "@/lib/business-rules";

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
  const statusFilter = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  // Construir query
  let query = supabase
    .from("quotes")
    .select("*", { count: "exact" })
    .eq("organization_id", userInfo.organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filtrar por estado si se especifica
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: quotes, error, count } = await query;

  if (error) {
    apiLogger.error("Error fetching quotes", {
      error: error.message,
      code: error.code,
    });
    return createErrorResponse(error, "Error al obtener cotizaciones");
  }

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
  const supabase = createClient();
  const userInfo = await getCurrentUserInfo(request, supabase);
  
  if (!userInfo) {
    return createErrorResponse(
      { message: "No autenticado" },
      "Error de autenticación",
      401
    );
  }

  const body = await request.json();

  // Validación básica
  if (
    !body.client_name ||
    !body.client_email ||
    !body.event_type ||
    !body.event_date ||
    !body.guest_count
  ) {
    return createValidationErrorResponse(
      [{ field: "required", message: "Campos requeridos faltantes" }],
      "Datos de cotización inválidos"
    );
  }

  // Validar cálculos si se proporcionan
  if (body.services || body.subtotal || body.taxes || body.total) {
    const quoteValidation = validateQuoteCalculation({
      services: body.services || [],
      subtotal: body.subtotal || 0,
      taxes: body.taxes || 0,
      total: body.total || 0,
    });

    if (!quoteValidation.isValid) {
      return createValidationErrorResponse(
        quoteValidation.errors.map((error) => ({
          field: "quote",
          message: error,
        })),
        "Errores en los cálculos de la cotización"
      );
    }
  }

  // Calcular fecha de expiración (30 días por defecto)
  const expirationDate = body.expiration_date ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Crear cotización
  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      client_name: body.client_name,
      client_email: body.client_email,
      client_phone: body.client_phone || null,
      event_type: body.event_type,
      event_date: body.event_date,
      guest_count: body.guest_count,
      base_price: body.base_price || 0,
      services: body.services || [],
      subtotal: body.subtotal || 0,
      taxes: body.taxes || 0,
      total: body.total || 0,
      expiration_date: expirationDate,
      status: body.status || "draft",
      notes: body.notes || null,
      organization_id: userInfo.organizationId,
    })
    .select()
    .single();

  if (error) {
    apiLogger.error("Error creating quote", {
      error: error.message,
      code: error.code,
    });
    return createErrorResponse(error, "Error al crear cotización");
  }

  // Registrar auditoría
  if (userInfo) {
    try {
      await logCreate("quote", quote.id, userInfo.userId, supabase, {
        organization_id: userInfo.organizationId,
      });
    } catch (auditError) {
      apiLogger.error("Error logging audit for quote creation", auditError);
    }
  }

  return createSuccessResponse(
    {
      quote,
      message: "Cotización creada exitosamente",
    },
    "Cotización creada correctamente",
    201
  );
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  // Nota: mainSecurityMiddleware deshabilitado para desarrollo
  // En producción, descomentar:
  // const securityResponse = await mainSecurityMiddleware(request);
  // if (securityResponse) return securityResponse;

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

  // 4.1. Obtener organization_id del usuario autenticado
  const organizationId = await getCurrentOrganizationId(request, supabase);
  if (!organizationId) {
    return createErrorResponse(
      { message: "No se pudo determinar la organización del usuario" },
      "Error de autenticación",
      401
    );
  }

  // 4.2. Validar cálculos de cotización si se están actualizando servicios/precios
  if (
    updateData.services ||
    updateData.subtotal ||
    updateData.taxes ||
    updateData.total
  ) {
    const quoteValidation = validateQuoteCalculation({
      services: updateData.services || [],
      subtotal: updateData.subtotal || 0,
      taxes: updateData.taxes || 0,
      total: updateData.total || 0,
    });

    if (!quoteValidation.isValid) {
      return createValidationErrorResponse(
        quoteValidation.errors.map((error) => ({
          field: "quote",
          message: error,
        })),
        "Errores en los cálculos de la cotización"
      );
    }
  }

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

  // 6. Obtener userId para auditoría
  const userInfo = await getCurrentUserInfo(request, supabase);

  // 7. Registrar auditoría
  if (userInfo) {
    try {
      // Obtener datos anteriores para auditoría
      const { data: oldData } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .single();

      if (oldData) {
        await logUpdate("quote", id, userInfo.userId, oldData, data, supabase, {
          organization_id: userInfo.organizationId,
        });
      }
    } catch (auditError) {
      apiLogger.error("Error logging audit for quote update", auditError);
    }
  }

  // 8. Log de éxito
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

  // 3.1. Obtener organization_id del usuario autenticado
  const organizationId = await getCurrentOrganizationId(request, supabase);
  if (!organizationId) {
    return createErrorResponse(
      { message: "No se pudo determinar la organización del usuario" },
      "Error de autenticación",
      401
    );
  }

  // 4. Eliminar cotización (filtrada por organización)
  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId); // Asegurar que pertenece a la organización

  if (error) {
    apiLogger.error("Error deleting quote", {
      error: error.message,
      code: error.code,
      quoteId: id,
    });

    return createErrorResponse(error, "Error al eliminar cotización");
  }

  // 5. Obtener userId para auditoría
  const userInfo = await getCurrentUserInfo(request, supabase);

  // 6. Registrar auditoría (obtener datos antes de eliminar)
  if (userInfo) {
    try {
      const { data: deletedData } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .single();

      if (deletedData) {
        await logDelete("quote", id, userInfo.userId, deletedData, supabase, {
          organization_id: userInfo.organizationId,
        });
      }
    } catch (auditError) {
      apiLogger.error("Error logging audit for quote delete", auditError);
    }
  }

  // 7. Log de éxito
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
