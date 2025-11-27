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
  // MODO DEMO: Retornar datos mock (hardcoded) sin base de datos
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || undefined;

  // Datos de ejemplo para demostración
  const mockQuotes: any[] = [
    {
      id: "quote-1",
      client_name: "María González",
      client_email: "maria.gonzalez@ejemplo.com",
      client_phone: "+1234567890",
      event_type: "wedding",
      event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      guest_count: 150,
      base_price: 25000,
      services: [
        {
          name: "Catering Premium",
          description: "Menú de 5 tiempos",
          quantity: 1,
          unit_price: 15000,
          total: 15000,
        },
        {
          name: "Decoración Floral",
          description: "Centros de mesa y arreglos",
          quantity: 20,
          unit_price: 500,
          total: 10000,
        },
        {
          name: "Música y Entretenimiento",
          description: "DJ y banda en vivo",
          quantity: 1,
          unit_price: 8000,
          total: 8000,
        },
      ],
      subtotal: 58000,
      taxes: 9280,
      total: 67280,
      expiration_date: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: "sent",
      notes: "Cotización para boda de verano en jardín botánico",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "quote-2",
      client_name: "Carlos Rodríguez",
      client_email: "carlos.rodriguez@empresa.com",
      client_phone: "+1234567891",
      event_type: "corporate",
      event_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      guest_count: 200,
      base_price: 30000,
      services: [
        {
          name: "Audiovisual",
          description: "Proyector y sonido",
          quantity: 1,
          unit_price: 5000,
          total: 5000,
        },
        {
          name: "Coffee Break",
          description: "Bocadillos y bebidas",
          quantity: 2,
          unit_price: 3000,
          total: 6000,
        },
      ],
      subtotal: 41000,
      taxes: 6560,
      total: 47560,
      expiration_date: new Date(
        Date.now() + 15 * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: "accepted",
      notes: "Conferencia corporativa Q4",
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "quote-3",
      client_name: "Ana Martínez",
      client_email: "ana.martinez@ejemplo.com",
      client_phone: "+1234567892",
      event_type: "party",
      event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      guest_count: 80,
      base_price: 12000,
      services: [
        {
          name: "Barra de Bebidas",
          description: "Bebidas alcohólicas e infusiones",
          quantity: 1,
          unit_price: 6000,
          total: 6000,
        },
        {
          name: "Iluminación Especial",
          description: "Luces LED y efectos",
          quantity: 1,
          unit_price: 3000,
          total: 3000,
        },
      ],
      subtotal: 21000,
      taxes: 3360,
      total: 24360,
      expiration_date: new Date(
        Date.now() + 20 * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: "draft",
      notes: "Fiesta de cumpleaños",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Filtrar por estado si se especifica
  let filteredQuotes = mockQuotes;
  if (statusFilter) {
    filteredQuotes = mockQuotes.filter((q) => q.status === statusFilter);
  }

  return createSuccessResponse(
    {
      quotes: filteredQuotes,
      pagination: {
        page: 1,
        limit: 10,
        total: filteredQuotes.length,
        totalPages: 1,
      },
    },
    "Cotizaciones obtenidas correctamente (MODO DEMO)"
  );
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // MODO DEMO: Usando datos mock (hardcoded) sin base de datos
  // 1. Obtener datos del body
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

  // 2. Crear cotización con datos mock
  const mockQuote = {
    id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    expiration_date:
      body.expiration_date ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: body.status || "draft",
    notes: body.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 3. Simular respuesta exitosa
  return createSuccessResponse(
    {
      quote: mockQuote,
      message: "Cotización creada exitosamente (MODO DEMO)",
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
