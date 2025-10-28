import { NextRequest, NextResponse } from "next/server";
import { securityMiddleware, addSecurityHeaders } from "./security";
import { rateLimitMiddleware } from "./rate-limit";
import { createErrorResponse } from "./validation";
import { securityLogger } from "@/lib/logger";

// ========================================
// MIDDLEWARE PRINCIPAL DE SEGURIDAD
// ========================================

export async function mainSecurityMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    // 1. Verificaciones de seguridad básicas
    const securityResponse = await securityMiddleware(request);
    if (securityResponse) {
      return addSecurityHeaders(securityResponse);
    }

    // 2. Rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return addSecurityHeaders(rateLimitResponse);
    }

    // 3. Continuar con la request
    return null;
  } catch (error) {
    securityLogger.error("Security middleware error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      method: request.method,
    });

    return addSecurityHeaders(
      createErrorResponse("Internal security error", 500)
    );
  }
}

// ========================================
// MIDDLEWARE PARA APIS ESPECÍFICAS
// ========================================

export function createApiMiddleware(options: {
  requireAuth?: boolean;
  allowedRoles?: string[];
  rateLimit?: boolean;
  validateBody?: boolean;
}) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      // 1. Verificaciones de seguridad
      const securityResponse = await mainSecurityMiddleware(request);
      if (securityResponse) {
        return securityResponse;
      }

      // 2. Verificación de autenticación
      if (options.requireAuth) {
        const authResponse = await checkAuthentication(request);
        if (authResponse) {
          return authResponse;
        }
      }

      // 3. Verificación de roles
      if (options.allowedRoles && options.allowedRoles.length > 0) {
        const roleResponse = await checkAuthorization(
          request,
          options.allowedRoles
        );
        if (roleResponse) {
          return roleResponse;
        }
      }

      // 4. Rate limiting específico
      if (options.rateLimit) {
        const rateLimitResponse = await rateLimitMiddleware(request);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      }

      return null;
    } catch (error) {
      securityLogger.error("API middleware error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        url: request.url,
        method: request.method,
      });

      return addSecurityHeaders(createErrorResponse("Internal API error", 500));
    }
  };
}

// ========================================
// VERIFICACIÓN DE AUTENTICACIÓN
// ========================================

async function checkAuthentication(
  request: NextRequest
): Promise<NextResponse | null> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return addSecurityHeaders(
      createErrorResponse("Token de autenticación requerido", 401)
    );
  }

  const token = authHeader.substring(7);

  try {
    // Aquí deberías verificar el token con Supabase
    // Por ahora, solo verificamos que exista
    if (!token || token.length < 10) {
      return addSecurityHeaders(
        createErrorResponse("Token de autenticación inválido", 401)
      );
    }

    // TODO: Implementar verificación real del token con Supabase
    // const { data: { user }, error } = await supabase.auth.getUser(token);
    // if (error || !user) {
    //   return addSecurityHeaders(
    //     createErrorResponse('Token de autenticación inválido', 401)
    //   );
    // }

    return null;
  } catch (error) {
    securityLogger.error("Authentication check error", {
      error: error instanceof Error ? error.message : "Unknown error",
      url: request.url,
    });

    return addSecurityHeaders(
      createErrorResponse("Error de autenticación", 401)
    );
  }
}

// ========================================
// VERIFICACIÓN DE AUTORIZACIÓN
// ========================================

async function checkAuthorization(
  request: NextRequest,
  allowedRoles: string[]
): Promise<NextResponse | null> {
  try {
    // TODO: Implementar verificación real de roles con Supabase
    // const authHeader = request.headers.get('authorization');
    // const token = authHeader?.substring(7);
    // const { data: { user } } = await supabase.auth.getUser(token);
    // const userRole = user?.user_metadata?.role;

    // if (!userRole || !allowedRoles.includes(userRole)) {
    //   return addSecurityHeaders(
    //     createErrorResponse('No tiene permisos para realizar esta acción', 403)
    //   );
    // }

    return null;
  } catch (error) {
    securityLogger.error("Authorization check error", {
      error: error instanceof Error ? error.message : "Unknown error",
      url: request.url,
      allowedRoles,
    });

    return addSecurityHeaders(
      createErrorResponse("Error de autorización", 403)
    );
  }
}

// ========================================
// MIDDLEWARE DE LOGGING
// ========================================

export function createLoggingMiddleware() {
  return (request: NextRequest, response: NextResponse) => {
    const start = Date.now();
    const { pathname, method } = new URL(request.url);

    // Log de la request
    securityLogger.info("API Request", {
      method,
      pathname,
      ip: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
      timestamp: new Date().toISOString(),
    });

    // Log de la response
    const duration = Date.now() - start;
    securityLogger.info("API Response", {
      method,
      pathname,
      statusCode: response.status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  };
}

// ========================================
// UTILIDADES
// ========================================

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(",")[0].trim();

  return request.ip || "unknown";
}

// ========================================
// MIDDLEWARE DE CORS
// ========================================

export function createCorsMiddleware() {
  return (request: NextRequest): NextResponse | null => {
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 200 });

      // Headers CORS
      response.headers.set(
        "Access-Control-Allow-Origin",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      );
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
      );
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Max-Age", "86400");

      return response;
    }

    return null;
  };
}

// ========================================
// MIDDLEWARE DE VALIDACIÓN DE CONTENIDO
// ========================================

export function createContentValidationMiddleware() {
  return (request: NextRequest): NextResponse | null => {
    const contentType = request.headers.get("content-type");

    // Verificar que las requests POST/PUT/PATCH tengan content-type válido
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      if (!contentType || !contentType.includes("application/json")) {
        return addSecurityHeaders(
          createErrorResponse("Content-Type debe ser application/json", 400)
        );
      }
    }

    return null;
  };
}







