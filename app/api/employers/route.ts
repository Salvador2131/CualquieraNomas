import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { employerSchema, paginationSchema } from "@/lib/validations/schemas";
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
import {
  getCurrentOrganizationId,
  addOrganizationFilter,
} from "@/lib/utils/api-organization-filter";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Verificaciones de seguridad
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Validar par?metros de consulta
  const { searchParams } = new URL(request.url);
  const queryParams = {
    status: searchParams.get("status") || undefined,
    company_type: searchParams.get("company_type") || undefined,
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "10"),
  };

  const paginationValidation = validateRequest(paginationSchema, queryParams);
  if (!paginationValidation.success) {
    return createValidationErrorResponse(
      paginationValidation.details,
      "Par?metros de paginaci?n inv?lidos"
    );
  }

  const { page, limit } = paginationValidation.data;
  const offset = (page - 1) * limit;

  // 3. Crear cliente de Supabase
  const supabase = createClient();

  // 3.1. Obtener organization_id del usuario autenticado
  const organizationId = await getCurrentOrganizationId(request, supabase);
  if (!organizationId) {
    return createErrorResponse(
      { message: "No se pudo determinar la organizaci?n del usuario" },
      "Error de autenticaci?n",
      401
    );
  }

  // 4. Construir consulta con filtro de organizaci?n
  let query = supabase
    .from("employers")
    .select(
      `
      *,
      users:user_id (
        id,
        email,
        name
      )
    `
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Aplicar filtro de organizaci?n
  query = addOrganizationFilter(query, organizationId);

  if (queryParams.status) {
    query = query.eq("status", queryParams.status);
  }

  if (queryParams.company_type) {
    query = query.eq("company_type", queryParams.company_type);
  }

  const { data: employers, error } = await query;

  if (error) {
    apiLogger.error("Error fetching employers", {
      error: error.message,
      code: error.code,
      queryParams,
    });

    return createErrorResponse(error, "Error al obtener empleadores");
  }

  // 5. Obtener total de registros para paginaci?n (con filtro de organizaci?n)
  let countQuery = supabase
    .from("employers")
    .select("*", { count: "exact", head: true });
  countQuery = addOrganizationFilter(countQuery, organizationId);
  const { count } = await countQuery;

  // 6. Log de ?xito
  apiLogger.info("Employers fetched successfully", {
    count: employers?.length || 0,
    total: count || 0,
    page,
    limit,
    status: queryParams.status,
    company_type: queryParams.company_type,
  });

  return createSuccessResponse(
    {
      employers: employers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    },
    "Empleadores obtenidos correctamente"
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
  const validation = validateRequest(employerSchema, body);

  if (!validation.success) {
    return createValidationErrorResponse(
      validation.details,
      "Datos de empleador inv?lidos"
    );
  }

  const validatedData = validation.data;

  // 3. Crear cliente de Supabase
  const supabase = createClient();

  // 3.1. Obtener organization_id del usuario autenticado
  const organizationId = await getCurrentOrganizationId(request, supabase);
  if (!organizationId) {
    return createErrorResponse(
      { message: "No se pudo determinar la organizaci?n del usuario" },
      "Error de autenticaci?n",
      401
    );
  }

  // 4. Crear empleador (con organization_id)
  const { data, error } = await supabase
    .from("employers")
    .insert({
      user_id: validatedData.user_id,
      company_name: validatedData.company_name,
      company_type: validatedData.company_type,
      website: validatedData.website || null,
      total_events: validatedData.total_events,
      total_spent: validatedData.total_spent,
      rating: validatedData.rating,
      status: validatedData.status,
      organization_id: organizationId, // Agregar organization_id
    })
    .select(
      `
      *,
      users:user_id (
        id,
        email,
        name
      )
    `
    )
    .single();

  if (error) {
    apiLogger.error("Error creating employer", {
      error: error.message,
      code: error.code,
      data: validatedData,
    });

    return createErrorResponse(error, "Error al crear empleador");
  }

  // 5. Log de ?xito
  apiLogger.info("Employer created successfully", {
    employerId: data.id,
    userId: validatedData.user_id,
    companyName: validatedData.company_name,
  });

  return createSuccessResponse(
    {
      employer: data,
      message: "Empleador creado exitosamente",
    },
    "Empleador creado correctamente",
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
      "Par?metros inv?lidos"
    );
  }

  // 3. Validar datos de actualizaci?n
  const validation = validateRequest(employerSchema.partial(), updateData);
  if (!validation.success) {
    return createValidationErrorResponse(
      validation.details,
      "Datos de actualizaci?n inv?lidos"
    );
  }

  // 4. Crear cliente de Supabase
  const supabase = createClient();

  // 4.1. Obtener organization_id y validar que el empleador pertenezca a la organizaci?n
  const organizationId = await getCurrentOrganizationId(request, supabase);
  if (!organizationId) {
    return createErrorResponse(
      { message: "No se pudo determinar la organizaci?n del usuario" },
      "Error de autenticaci?n",
      401
    );
  }

  // Verificar que el empleador pertenezca a la organizaci?n del usuario
  const { data: existingEmployer } = await supabase
    .from("employers")
    .select("organization_id")
    .eq("id", id)
    .single();

  if (!existingEmployer || existingEmployer.organization_id !== organizationId) {
    return createErrorResponse(
      { message: "Empleador no encontrado o no pertenece a tu organizaci?n" },
      "Error de autorizaci?n",
      403
    );
  }

  // 5. Actualizar empleador
  const { data, error } = await supabase
    .from("employers")
    .update({
      ...validation.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId) // Asegurar que pertenece a la organizaci?n
    .select(
      `
      *,
      users:user_id (
        id,
        email,
        name
      )
    `
    )
    .single();

  if (error) {
    apiLogger.error("Error updating employer", {
      error: error.message,
      code: error.code,
      employerId: id,
      updateData: validation.data,
    });

    return createErrorResponse(error, "Error al actualizar empleador");
  }

  // 6. Log de ?xito
  apiLogger.info("Employer updated successfully", {
    employerId: id,
    updatedFields: Object.keys(validation.data),
  });

  return createSuccessResponse(
    {
      employer: data,
      message: "Empleador actualizado exitosamente",
    },
    "Empleador actualizado correctamente"
  );
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  // 1. Verificaciones de seguridad
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Validar par?metros
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return createValidationErrorResponse(
      [{ field: "id", message: "id es requerido" }],
      "Par?metros inv?lidos"
    );
  }

  // 3. Crear cliente de Supabase
  const supabase = createClient();

  // 3.1. Obtener organization_id y validar que el empleador pertenezca a la organizaci?n
  const organizationId = await getCurrentOrganizationId(request, supabase);
  if (!organizationId) {
    return createErrorResponse(
      { message: "No se pudo determinar la organizaci?n del usuario" },
      "Error de autenticaci?n",
      401
    );
  }

  // 4. Eliminar empleador (solo si pertenece a la organizaci?n)
  const { error } = await supabase
    .from("employers")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    apiLogger.error("Error deleting employer", {
      error: error.message,
      code: error.code,
      employerId: id,
    });

    return createErrorResponse(error, "Error al eliminar empleador");
  }

  // 5. Log de ?xito
  apiLogger.info("Employer deleted successfully", {
    employerId: id,
  });

  return createSuccessResponse(
    {
      message: "Empleador eliminado exitosamente",
    },
    "Empleador eliminado correctamente"
  );
});

