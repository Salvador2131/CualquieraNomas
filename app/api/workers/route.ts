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
import { apiLogger } from "@/lib/logger";
// import { mainSecurityMiddleware } from "@/lib/middleware"; // Deshabilitado para desarrollo
import {
  getCurrentOrganizationId,
  addOrganizationFilter,
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
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  // Construir query
  let query = supabase
    .from("workers")
    .select(
      `
      *,
      users:user_id (
        id,
        name,
        email,
        phone
      )
    `,
      { count: "exact" }
    )
    .eq("organization_id", userInfo.organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: workers, error, count } = await query;

  if (error) {
    apiLogger.error("Error fetching workers", {
      error: error.message,
      code: error.code,
    });
    return createErrorResponse(error, "Error al obtener trabajadores");
  }

  // Obtener badges para cada trabajador
  const workersWithBadges = await Promise.all(
    (workers || []).map(async (worker: any) => {
      try {
        const badgesResponse = await supabase.rpc("get_worker_badges", {
          worker_uuid: worker.id,
        });
        return {
          ...worker,
          badges: badgesResponse.data || [],
        };
      } catch {
        return {
          ...worker,
          badges: [],
        };
      }
    })
  );

  return createSuccessResponse(
    {
      workers: workersWithBadges,
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
  if (!body.first_name || !body.last_name || !body.email || !body.position) {
    return createValidationErrorResponse(
      [{ field: "required", message: "Campos requeridos faltantes" }],
      "Datos de trabajador inválidos"
    );
  }

  // Nota: En producción, los trabajadores se crean a través del registro
  // Este endpoint es principalmente para admins que crean trabajadores manualmente
  // Por ahora, retornamos error indicando que se debe usar el registro
  return createErrorResponse(
    { message: "Los trabajadores deben registrarse a través del formulario de registro. Usa /api/auth/register con role='worker'" },
    "Método no permitido",
    405
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
  const validation = validateRequest(workerSchema.partial(), updateData);
  if (!validation.success) {
    return createValidationErrorResponse(
      validation.details,
      "Datos de actualización inválidos"
    );
  }

  // 4. Crear cliente de Supabase
  const supabase = createClient();

  // 4.1. Obtener organization_id y validar pertenencia
  const organizationId = await getCurrentOrganizationId(request, supabase);
  if (!organizationId) {
    return createErrorResponse(
      { message: "No se pudo determinar la organización del usuario" },
      "Error de autenticación",
      401
    );
  }

  // 4.2. Obtener datos anteriores para auditoría
  const { data: oldData } = await supabase
    .from("workers")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!oldData) {
    return createErrorResponse(
      { message: "Trabajador no encontrado o no pertenece a tu organización" },
      "Error de autorización",
      404
    );
  }

  // 5. Actualizar trabajador
  const { data, error } = await supabase
    .from("workers")
    .update({
      ...validation.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId) // Asegurar que pertenece a la organización
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

  // 6. Registrar auditoría
  const userInfo = await getCurrentUserInfo(request, supabase);
  if (userInfo) {
    try {
      await logUpdate("worker", id, userInfo.userId, oldData, data, supabase, {
        organization_id: userInfo.organizationId,
      });
    } catch (auditError) {
      apiLogger.error("Error logging audit for worker update", auditError);
    }
  }

  // 7. Log de éxito
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
  // Nota: mainSecurityMiddleware deshabilitado para desarrollo
  // En producción, descomentar:
  // import { mainSecurityMiddleware } from "@/lib/middleware";
  // const securityResponse = await mainSecurityMiddleware(request);
  // if (securityResponse) return securityResponse;

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

  // 3.1. Obtener organization_id y validar pertenencia
  const organizationId = await getCurrentOrganizationId(request, supabase);
  if (!organizationId) {
    return createErrorResponse(
      { message: "No se pudo determinar la organización del usuario" },
      "Error de autenticación",
      401
    );
  }

  // 3.2. Obtener datos antes de eliminar para auditoría
  const { data: deletedData } = await supabase
    .from("workers")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!deletedData) {
    return createErrorResponse(
      { message: "Trabajador no encontrado o no pertenece a tu organización" },
      "Error de autorización",
      404
    );
  }

  // 4. Eliminar trabajador
  const { error } = await supabase
    .from("workers")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId); // Asegurar que pertenece a la organización

  if (error) {
    apiLogger.error("Error deleting worker", {
      error: error.message,
      code: error.code,
      workerId: id,
    });

    return createErrorResponse(error, "Error al eliminar trabajador");
  }

  // 5. Registrar auditoría
  const userInfo = await getCurrentUserInfo(request, supabase);
  if (userInfo) {
    try {
      await logDelete("worker", id, userInfo.userId, deletedData, supabase, {
        organization_id: userInfo.organizationId,
      });
    } catch (auditError) {
      apiLogger.error("Error logging audit for worker delete", auditError);
    }
  }

  // 6. Log de éxito
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
