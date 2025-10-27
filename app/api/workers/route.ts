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
    role: searchParams.get("role") || undefined,
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
    .from("workers")
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
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (queryParams.status) {
    query = query.eq("status", queryParams.status);
  }

  if (queryParams.role) {
    query = query.eq("role", queryParams.role);
  }

  const { data: workers, error } = await query;

  if (error) {
    apiLogger.error("Error fetching workers", {
      error: error.message,
      code: error.code,
      queryParams,
    });

    return createErrorResponse(error, "Error al obtener trabajadores");
  }

  // 5. Obtener total de registros para paginación
  const { count } = await supabase
    .from("workers")
    .select("*", { count: "exact", head: true });

  // 6. Log de éxito
  apiLogger.info("Workers fetched successfully", {
    count: workers?.length || 0,
    total: count || 0,
    page,
    limit,
    status: queryParams.status,
    role: queryParams.role,
  });

  return createSuccessResponse(
    {
      workers: workers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    },
    "Trabajadores obtenidos correctamente"
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
  const validation = validateRequest(workerSchema, body);

  if (!validation.success) {
    return createValidationErrorResponse(
      validation.details,
      "Datos de trabajador inválidos"
    );
  }

  const validatedData = validation.data;

  // 3. Crear cliente de Supabase
  const supabase = createClient();

  // 4. Crear trabajador
  const { data, error } = await supabase
    .from("workers")
    .insert({
      user_id: validatedData.user_id,
      position: validatedData.position,
      hire_date: validatedData.hire_date,
      salary: validatedData.salary,
      is_active: validatedData.is_active,
      skills: validatedData.skills,
      emergency_contact: validatedData.emergency_contact,
      emergency_phone: validatedData.emergency_phone,
    })
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
    apiLogger.error("Error creating worker", {
      error: error.message,
      code: error.code,
      data: validatedData,
    });

    return createErrorResponse(error, "Error al crear trabajador");
  }

  // 5. Log de éxito
  apiLogger.info("Worker created successfully", {
    workerId: data.id,
    userId: validatedData.user_id,
    position: validatedData.position,
  });

  return createSuccessResponse(
    {
      worker: data,
      message: "Trabajador creado exitosamente",
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
