import { NextResponse } from "next/server";
import { handleError } from "@/lib/errors/app-errors";
import { addSecurityHeaders } from "@/lib/middleware/security";
import { apiLogger } from "@/lib/logger";

// ========================================
// TIPOS DE RESPUESTA
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

// ========================================
// MANEJADOR DE RESPUESTAS EXITOSAS
// ========================================

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };

  apiLogger.info("API Success Response", {
    statusCode,
    message,
    dataType: typeof data,
  });

  return addSecurityHeaders(
    NextResponse.json(response, { status: statusCode })
  );
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationParams,
  message?: string
): NextResponse {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    message,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  };

  apiLogger.info("API Paginated Response", {
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
    totalPages: response.pagination!.totalPages,
  });

  return addSecurityHeaders(NextResponse.json(response, { status: 200 }));
}

// ========================================
// MANEJADOR DE RESPUESTAS DE ERROR
// ========================================

export function createErrorResponse(
  error: unknown,
  message?: string,
  statusCode?: number
): NextResponse {
  const errorInfo = handleError(error);

  const response: ApiResponse = {
    success: false,
    error: message || errorInfo.message,
    message: errorInfo.isOperational
      ? errorInfo.message
      : "Error interno del servidor",
  };

  // Log del error
  apiLogger.error("API Error Response", {
    statusCode: statusCode || errorInfo.statusCode,
    error: errorInfo.message,
    code: errorInfo.code,
    isOperational: errorInfo.isOperational,
    originalError: error instanceof Error ? error.message : "Unknown error",
  });

  return addSecurityHeaders(
    NextResponse.json(response, {
      status: statusCode || errorInfo.statusCode,
    })
  );
}

// ========================================
// MANEJADOR DE VALIDACIÓN
// ========================================

export function createValidationErrorResponse(
  errors: any[],
  message: string = "Error de validación"
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message,
    message: "Los datos proporcionados no son válidos",
    data: errors,
  };

  apiLogger.warn("API Validation Error", {
    errorCount: errors.length,
    errors: errors.map((e) => ({ field: e.field, message: e.message })),
  });

  return addSecurityHeaders(NextResponse.json(response, { status: 400 }));
}

// ========================================
// MANEJADOR DE RESPUESTAS DE AUTENTICACIÓN
// ========================================

export function createAuthErrorResponse(
  message: string = "No autorizado"
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message,
    message: "Token de autenticación requerido o inválido",
  };

  apiLogger.warn("API Auth Error", { message });

  return addSecurityHeaders(NextResponse.json(response, { status: 401 }));
}

export function createForbiddenResponse(
  message: string = "No tiene permisos para realizar esta acción"
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message,
    message: "Acceso denegado",
  };

  apiLogger.warn("API Forbidden", { message });

  return addSecurityHeaders(NextResponse.json(response, { status: 403 }));
}

// ========================================
// MANEJADOR DE RESPUESTAS DE RECURSO NO ENCONTRADO
// ========================================

export function createNotFoundResponse(
  resource: string = "Recurso"
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: `${resource} no encontrado`,
    message: "El recurso solicitado no existe",
  };

  apiLogger.warn("API Not Found", { resource });

  return addSecurityHeaders(NextResponse.json(response, { status: 404 }));
}

// ========================================
// MANEJADOR DE RESPUESTAS DE CONFLICTO
// ========================================

export function createConflictResponse(
  message: string = "Conflicto de datos"
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message,
    message: "El recurso ya existe o hay un conflicto",
  };

  apiLogger.warn("API Conflict", { message });

  return addSecurityHeaders(NextResponse.json(response, { status: 409 }));
}

// ========================================
// MANEJADOR DE RESPUESTAS DE RATE LIMIT
// ========================================

export function createRateLimitResponse(
  message: string = "Demasiadas solicitudes",
  retryAfter?: number
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message,
    message: "Límite de solicitudes excedido",
  };

  apiLogger.warn("API Rate Limit", { message, retryAfter });

  const headers: Record<string, string> = {};
  if (retryAfter) {
    headers["Retry-After"] = retryAfter.toString();
  }

  return addSecurityHeaders(
    NextResponse.json(response, {
      status: 429,
      headers,
    })
  );
}

// ========================================
// MANEJADOR DE RESPUESTAS DE SERVIDOR
// ========================================

export function createServerErrorResponse(
  message: string = "Error interno del servidor"
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message,
    message: "Ha ocurrido un error inesperado",
  };

  apiLogger.error("API Server Error", { message });

  return addSecurityHeaders(NextResponse.json(response, { status: 500 }));
}

// ========================================
// MANEJADOR DE RESPUESTAS DE MÉTODO NO PERMITIDO
// ========================================

export function createMethodNotAllowedResponse(
  allowedMethods: string[]
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: "Método no permitido",
    message: `Métodos permitidos: ${allowedMethods.join(", ")}`,
  };

  apiLogger.warn("API Method Not Allowed", { allowedMethods });

  return addSecurityHeaders(
    NextResponse.json(response, {
      status: 405,
      headers: {
        Allow: allowedMethods.join(", "),
      },
    })
  );
}

// ========================================
// MANEJADOR DE RESPUESTAS DE TAMAÑO EXCEDIDO
// ========================================

export function createPayloadTooLargeResponse(
  message: string = "Payload demasiado grande"
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message,
    message: "El tamaño de la solicitud excede el límite permitido",
  };

  apiLogger.warn("API Payload Too Large", { message });

  return addSecurityHeaders(NextResponse.json(response, { status: 413 }));
}

// ========================================
// UTILIDADES
// ========================================

export function isSuccessResponse(response: NextResponse): boolean {
  return response.status >= 200 && response.status < 300;
}

export function isErrorResponse(response: NextResponse): boolean {
  return response.status >= 400;
}

export function getResponseData<T>(
  response: NextResponse
): Promise<ApiResponse<T>> {
  return response.json();
}

// ========================================
// WRAPPER PARA MANEJAR ERRORES EN APIS
// ========================================

export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      apiLogger.error("API Handler Error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      return createErrorResponse(error);
    }
  };
}







