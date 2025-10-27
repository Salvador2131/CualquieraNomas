import { NextRequest, NextResponse } from "next/server";

// ========================================
// CONFIGURACIONES DE RATE LIMITING
// ========================================

interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en ms
  maxRequests: number; // Máximo de requests en la ventana
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Configuraciones específicas por endpoint
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Autenticación - más restrictivo
  "/api/auth/login": {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // 5 intentos por IP
    message: "Demasiados intentos de login. Intente nuevamente en 15 minutos.",
    skipSuccessfulRequests: true,
  },

  // APIs generales
  "/api/": {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100, // 100 requests por IP
    message: "Demasiadas solicitudes. Intente nuevamente en 15 minutos.",
  },

  // APIs de creación - más restrictivo
  "/api/preregister": {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10, // 10 preregistros por hora
    message: "Límite de preregistros excedido. Intente nuevamente en 1 hora.",
  },

  // APIs de notificaciones
  "/api/notifications": {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 50, // 50 requests por IP
    message:
      "Demasiadas solicitudes de notificaciones. Intente nuevamente en 5 minutos.",
  },

  // APIs de email
  "/api/email": {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 20, // 20 emails por hora
    message: "Límite de emails excedido. Intente nuevamente en 1 hora.",
  },
};

// ========================================
// ALMACÉN DE RATE LIMITERS
// ========================================

interface RateLimiterData {
  requests: number;
  resetTime: number;
}

const rateLimiters = new Map<string, RateLimiterData>();

function getRateLimiter(endpoint: string): RateLimiterData {
  if (!rateLimiters.has(endpoint)) {
    const config = rateLimitConfigs[endpoint] || rateLimitConfigs["/api/"];
    const limiter: RateLimiterData = {
      requests: 0,
      resetTime: Date.now() + config.windowMs,
    };
    rateLimiters.set(endpoint, limiter);
  }

  return rateLimiters.get(endpoint)!;
}

// ========================================
// FUNCIÓN PRINCIPAL DE RATE LIMITING
// ========================================

export async function rateLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = new URL(request.url);
  const ip = getClientIP(request);

  // Encontrar la configuración más específica
  let config: RateLimitConfig | null = null;
  let endpoint = "";

  for (const [pattern, rateConfig] of Object.entries(rateLimitConfigs)) {
    if (pathname.startsWith(pattern)) {
      config = rateConfig;
      endpoint = pattern;
      break;
    }
  }

  if (!config) {
    return null; // No hay rate limiting para este endpoint
  }

  const limiter = getRateLimiter(endpoint);
  const now = Date.now();

  // Resetear contador si ha pasado el tiempo de ventana
  if (now > limiter.resetTime) {
    limiter.requests = 0;
    limiter.resetTime = now + config.windowMs;
  }

  // Verificar si se ha excedido el límite
  if (limiter.requests >= config.maxRequests) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded",
        message: config.message,
        retryAfter: Math.ceil((limiter.resetTime - now) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((limiter.resetTime - now) / 1000).toString(),
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(limiter.resetTime).toISOString(),
        },
      }
    );
  }

  // Incrementar contador
  limiter.requests++;

  // Rate limit OK, continuar
  return null;
}

// ========================================
// UTILIDADES
// ========================================

function getClientIP(request: NextRequest): string {
  // Intentar obtener la IP real del cliente
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(",")[0].trim();

  // Fallback a la IP de la conexión
  return "unknown";
}

// ========================================
// RATE LIMITING ESPECÍFICO POR USUARIO
// ========================================

const userRateLimiters = new Map<string, RateLimiterData>();

export async function rateLimitByUser(
  userId: string,
  endpoint: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000
): Promise<boolean> {
  const key = `${userId}:${endpoint}`;

  if (!userRateLimiters.has(key)) {
    const limiter: RateLimiterData = {
      requests: 0,
      resetTime: Date.now() + windowMs,
    };
    userRateLimiters.set(key, limiter);
  }

  const limiter = userRateLimiters.get(key)!;
  const now = Date.now();

  // Resetear contador si ha pasado el tiempo de ventana
  if (now > limiter.resetTime) {
    limiter.requests = 0;
    limiter.resetTime = now + windowMs;
  }

  // Verificar si se ha excedido el límite
  if (limiter.requests >= maxRequests) {
    return false;
  }

  // Incrementar contador
  limiter.requests++;

  return true;
}

// ========================================
// RATE LIMITING PARA OPERACIONES ESPECÍFICAS
// ========================================

export const operationRateLimits = {
  // Crear preregistros
  createPreregistration: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 5, // 5 por hora por usuario
  },

  // Enviar emails
  sendEmail: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 20, // 20 por hora por usuario
  },

  // Crear eventos
  createEvent: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10, // 10 por hora por usuario
  },

  // Actualizar perfil
  updateProfile: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 10, // 10 por 5 minutos por usuario
  },
};

// ========================================
// MIDDLEWARE DE RATE LIMITING PARA APIS
// ========================================

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const ip = getClientIP(request);
    const key = `${ip}:${request.url}`;

    if (!userRateLimiters.has(key)) {
      const limiter: RateLimiterData = {
        requests: 0,
        resetTime: Date.now() + config.windowMs,
      };
      userRateLimiters.set(key, limiter);
    }

    const limiter = userRateLimiters.get(key)!;
    const now = Date.now();

    // Resetear contador si ha pasado el tiempo de ventana
    if (now > limiter.resetTime) {
      limiter.requests = 0;
      limiter.resetTime = now + config.windowMs;
    }

    // Verificar si se ha excedido el límite
    if (limiter.requests >= config.maxRequests) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: config.message,
          retryAfter: Math.ceil((limiter.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (limiter.resetTime - now) / 1000
            ).toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(limiter.resetTime).toISOString(),
          },
        }
      );
    }

    // Incrementar contador
    limiter.requests++;

    return null;
  };
}
