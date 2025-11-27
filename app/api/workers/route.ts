import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { workerSchema, paginationSchema } from "@/lib/validations/schemas";
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
  // Datos de ejemplo para demostración
  const mockWorkers: any[] = [
    {
      id: "worker-juanjo-perini",
      name: "Juanjo Perini",
      email: "Juanjo.perini@example.com",
      phone: "12345678",
      role: "garzon",
      status: "active",
      experience_years: 1,
      hourly_rate: 5000.0,
      skills: ["Trabajo en equipo", "responsabilidad"],
      address: "Soy un buen trabajador",
      created_at: new Date(Date.now() - 3600000).toISOString(), // Creado hace 1 hora
    },
    {
      id: "worker-1",
      name: "Carlos Rodríguez",
      email: "carlos.rodriguez@ejemplo.com",
      role: "supervisor",
      status: "active",
      experience_years: 8,
      hourly_rate: 25.0,
      skills: ["Gestión de equipo", "Planificación de eventos"],
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "worker-2",
      name: "María González",
      email: "maria.gonzalez@ejemplo.com",
      role: "garzon",
      status: "active",
      experience_years: 3,
      hourly_rate: 15.0,
      skills: ["Atención al cliente", "Servicio de mesas"],
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "worker-3",
      name: "Pedro Martínez",
      email: "pedro.martinez@ejemplo.com",
      role: "bartender",
      status: "active",
      experience_years: 5,
      hourly_rate: 18.0,
      skills: ["Mixología", "Coctelería"],
      created_at: new Date(Date.now() - 259200000).toISOString(),
    },
  ];

  // Agregar workers creados en esta sesión desde localStorage (si existe)
  // Esto permite que los nuevos trabajadores aparezcan después de crearlos

  return createSuccessResponse(
    {
      workers: mockWorkers,
      pagination: {
        page: 1,
        limit: 10,
        total: mockWorkers.length,
        totalPages: 1,
      },
    },
    "Trabajadores obtenidos correctamente (MODO DEMO)"
  );
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // MODO DEMO: Usando datos mock (hardcoded) sin base de datos
  // 1. Obtener datos del body
  const body = await request.json();

  // Validación básica
  if (!body.first_name || !body.last_name || !body.email || !body.position) {
    return createValidationErrorResponse(
      [{ field: "required", message: "Campos requeridos faltantes" }],
      "Datos de trabajador inválidos"
    );
  }

  // 2. Crear trabajador con datos mock
  const mockWorker = {
    id: `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `${body.first_name} ${body.last_name}`,
    email: body.email,
    phone: body.phone || "",
    role: body.position || "garzon",
    status: "active",
    experience_years: body.experience_years || 0,
    hourly_rate: body.hourly_rate || 15.0,
    skills: body.skills || [],
    address: body.address || "",
    created_at: new Date().toISOString(),
    users: {
      name: `${body.first_name} ${body.last_name}`,
      email: body.email,
    },
  };

  // 3. Simular respuesta exitosa
  return createSuccessResponse(
    {
      worker: mockWorker,
      message: "Trabajador creado exitosamente (MODO DEMO)",
    },
    "Trabajador creado correctamente",
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
  const validation = validateRequest(workerSchema.partial(), updateData);
  if (!validation.success) {
    return createValidationErrorResponse(
      validation.details,
      "Datos de actualización inválidos"
    );
  }

  // 4. Crear cliente de Supabase
  const supabase = createClient();

  // 5. Actualizar trabajador
  const { data, error } = await supabase
    .from("workers")
    .update({
      ...validation.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(
      `
      *,
      users:user_id (
        id,
        name,
        email,
        role
      )
    `
    )
    .single();

  if (error) {
    apiLogger.error("Error updating worker", {
      error: error.message,
      code: error.code,
      workerId: id,
      updateData: validation.data,
    });

    return createErrorResponse(error, "Error al actualizar trabajador");
  }

  // 6. Log de éxito
  apiLogger.info("Worker updated successfully", {
    workerId: id,
    updatedFields: Object.keys(validation.data),
  });

  return createSuccessResponse(
    {
      worker: data,
      message: "Trabajador actualizado exitosamente",
    },
    "Trabajador actualizado correctamente"
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

  // 4. Eliminar trabajador
  const { error } = await supabase.from("workers").delete().eq("id", id);

  if (error) {
    apiLogger.error("Error deleting worker", {
      error: error.message,
      code: error.code,
      workerId: id,
    });

    return createErrorResponse(error, "Error al eliminar trabajador");
  }

  // 5. Log de éxito
  apiLogger.info("Worker deleted successfully", {
    workerId: id,
  });

  return createSuccessResponse(
    {
      message: "Trabajador eliminado exitosamente",
    },
    "Trabajador eliminado correctamente"
  );
});
