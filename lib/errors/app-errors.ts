// ========================================
// ERRORES PERSONALIZADOS DE LA APLICACIÓN
// ========================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    // Mantener el stack trace correcto
    Error.captureStackTrace(this, this.constructor);
  }
}

// ========================================
// ERRORES ESPECÍFICOS DE VALIDACIÓN
// ========================================

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "No autorizado") {
    super(message, 401, true, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "No tiene permisos para realizar esta acción") {
    super(message, 403, true, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Recurso") {
    super(`${resource} no encontrado`, 404, true, "NOT_FOUND_ERROR");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflicto de datos") {
    super(message, 409, true, "CONFLICT_ERROR");
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Demasiadas solicitudes") {
    super(message, 429, true, "RATE_LIMIT_ERROR");
    this.name = "RateLimitError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Error de base de datos") {
    super(message, 500, true, "DATABASE_ERROR");
    this.name = "DatabaseError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = "Error en servicio externo") {
    super(`${service}: ${message}`, 502, true, "EXTERNAL_SERVICE_ERROR");
    this.name = "ExternalServiceError";
  }
}

// ========================================
// ERRORES ESPECÍFICOS DE NEGOCIO
// ========================================

export class EventConflictError extends ConflictError {
  constructor(message: string = "Conflicto de horario en el evento") {
    super(message);
    this.name = "EventConflictError";
  }
}

export class WorkerUnavailableError extends ConflictError {
  constructor(
    message: string = "Trabajador no disponible en la fecha solicitada"
  ) {
    super(message);
    this.name = "WorkerUnavailableError";
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(action: string) {
    super(`No tiene permisos para ${action}`);
    this.name = "InsufficientPermissionsError";
  }
}

export class InvalidEventStatusError extends ValidationError {
  constructor(currentStatus: string, requiredStatus: string) {
    super(
      `El evento debe estar en estado '${requiredStatus}' para realizar esta acción. Estado actual: '${currentStatus}'`
    );
    this.name = "InvalidEventStatusError";
  }
}

// ========================================
// MANEJADOR DE ERRORES
// ========================================

export function handleError(error: unknown): {
  statusCode: number;
  message: string;
  code?: string;
  isOperational: boolean;
} {
  // Si es un error de la aplicación, devolverlo tal como está
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      isOperational: error.isOperational,
    };
  }

  // Si es un error de Zod (validación)
  if (error instanceof Error && error.name === "ZodError") {
    return {
      statusCode: 400,
      message: "Error de validación",
      code: "VALIDATION_ERROR",
      isOperational: true,
    };
  }

  // Si es un error de Supabase
  if (error && typeof error === "object" && "code" in error) {
    const supabaseError = error as any;

    switch (supabaseError.code) {
      case "23505": // Unique constraint violation
        return {
          statusCode: 409,
          message: "El registro ya existe",
          code: "DUPLICATE_ERROR",
          isOperational: true,
        };
      case "23503": // Foreign key constraint violation
        return {
          statusCode: 400,
          message: "Referencia inválida",
          code: "FOREIGN_KEY_ERROR",
          isOperational: true,
        };
      case "23502": // Not null constraint violation
        return {
          statusCode: 400,
          message: "Campo requerido faltante",
          code: "NOT_NULL_ERROR",
          isOperational: true,
        };
      case "PGRST116": // Row Level Security violation
        return {
          statusCode: 403,
          message: "No tiene permisos para acceder a este recurso",
          code: "RLS_ERROR",
          isOperational: true,
        };
      default:
        return {
          statusCode: 500,
          message: "Error de base de datos",
          code: "DATABASE_ERROR",
          isOperational: true,
        };
    }
  }

  // Error genérico
  return {
    statusCode: 500,
    message: "Error interno del servidor",
    code: "INTERNAL_ERROR",
    isOperational: false,
  };
}

// ========================================
// UTILIDADES DE ERROR
// ========================================

export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof AppError) {
    return error.code;
  }
  if (error && typeof error === "object" && "code" in error) {
    return (error as any).code;
  }
  return undefined;
}

