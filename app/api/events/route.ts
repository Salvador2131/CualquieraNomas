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
// import { mainSecurityMiddleware } from "@/lib/middleware"; // Deshabilitado para modo demo
import { apiLogger } from "@/lib/logger";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // MODO DEMO: Retornar datos mock (hardcoded) sin base de datos
  const { searchParams } = new URL(request.url);
  const estadoFilter = searchParams.get("estado") || undefined;

  // Datos de ejemplo para demostración
  const mockEvents: any[] = [
    {
      id: "event-1",
      titulo: "Boda de Verano",
      descripcion: "Ceremonia al aire libre con recepción",
      tipo_evento: "Boda",
      fecha_evento: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(), // En 7 días
      hora_inicio: "16:00",
      hora_fin: "23:00",
      ubicacion: "Jardín Botánico",
      numero_invitados: 150,
      cliente_nombre: "María González",
      cliente_email: "maria.gonzalez@ejemplo.com",
      cliente_telefono: "+1234567890",
      presupuesto_total: 25000,
      estado: "planificacion",
      servicios_contratados: ["Catering", "Decoración", "Música"],
      checklist: {
        catering: {
          completado: true,
          menu: "Menú gourmet",
          proveedor: "Catering Elegante",
        },
        decoracion: {
          completado: false,
          tema: "Romántico",
          proveedor: "Decoraciones Florales",
        },
        musica: {
          completado: true,
          tipo: "DJ y banda",
          proveedor: "Sonido Premium",
        },
      },
    },
    {
      id: "event-2",
      titulo: "Conferencia Corporativa Q4",
      descripcion: "Evento de cierre de trimestre",
      tipo_evento: "Corporativo",
      fecha_evento: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString(), // En 14 días
      hora_inicio: "09:00",
      hora_fin: "18:00",
      ubicacion: "Centro de Convenciones",
      numero_invitados: 200,
      cliente_nombre: "Carlos Rodríguez",
      cliente_email: "carlos.rodriguez@empresa.com",
      cliente_telefono: "+1234567891",
      presupuesto_total: 35000,
      estado: "planificacion",
      servicios_contratados: ["Catering", "Audio/Video", "Networking"],
      checklist: {
        audiovisual: { completado: true },
        catering: { completado: true },
        networking: { completado: false },
      },
    },
  ];

  // Filtrar por estado si se especifica
  let filteredEvents = mockEvents;
  if (estadoFilter) {
    filteredEvents = mockEvents.filter((e) => e.estado === estadoFilter);
  }

  return createSuccessResponse(
    {
      events: filteredEvents,
      pagination: {
        page: 1,
        limit: 10,
        total: filteredEvents.length,
        totalPages: 1,
      },
    },
    "Eventos obtenidos correctamente (MODO DEMO)"
  );
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // MODO DEMO: Usando datos mock (hardcoded) sin base de datos
  // 1. Obtener datos del body
  const body = await request.json();

  // Validación básica
  if (
    !body.titulo ||
    !body.tipo_evento ||
    !body.fecha_evento ||
    !body.ubicacion ||
    !body.numero_invitados ||
    !body.cliente_nombre ||
    !body.cliente_email
  ) {
    return createValidationErrorResponse(
      [{ field: "required", message: "Campos requeridos faltantes" }],
      "Datos de evento inválidos"
    );
  }

  // 2. Crear evento con datos mock
  const mockEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    titulo: body.titulo,
    descripcion: body.descripcion || "",
    tipo_evento: body.tipo_evento,
    fecha_evento: body.fecha_evento,
    hora_inicio: body.hora_inicio || undefined,
    hora_fin: body.hora_fin || undefined,
    ubicacion: body.ubicacion,
    numero_invitados: body.numero_invitados || 0,
    cliente_nombre: body.cliente_nombre,
    cliente_email: body.cliente_email,
    cliente_telefono: body.cliente_telefono || undefined,
    presupuesto_total: body.presupuesto_total || undefined,
    estado: body.estado || "planificacion",
    servicios_contratados: body.servicios_contratados || [],
    checklist: body.checklist || {},
    created_at: new Date().toISOString(),
  };

  // 3. Simular respuesta exitosa
  return createSuccessResponse(
    {
      event: mockEvent,
      message: "Evento creado exitosamente (MODO DEMO)",
    },
    "Evento creado correctamente",
    201
  );
});
