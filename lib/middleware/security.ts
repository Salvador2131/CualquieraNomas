import { NextRequest, NextResponse } from "next/server";
import { securityLogger } from "@/lib/logger";

// ========================================
// CONFIGURACIÓN DE SEGURIDAD
// ========================================

const SECURITY_CONFIG = {
  // Headers de seguridad
  securityHeaders: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  },

  // CORS
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  },

  // Límites de tamaño
  limits: {
    maxBodySize: 10 * 1024 * 1024, // 10MB
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },

  // Patrones de ataque conocidos
  attackPatterns: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>.*?<\/link>/gi,
    /<meta[^>]*>.*?<\/meta>/gi,
    /<style[^>]*>.*?<\/style>/gi,
  ],

  // IPs bloqueadas (ejemplo)
  blockedIPs: new Set<string>(),

  // Patrones de SQL injection
  sqlInjectionPatterns: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
    /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/gi,
    /(\b(OR|AND)\s+['"]\s*IN\s*\([^)]*\))/gi,
  ],
};

// ========================================
// MIDDLEWARE DE SEGURIDAD PRINCIPAL
// ========================================

export async function securityMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname, searchParams } = new URL(request.url);
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "";

  // 1. Verificar IP bloqueada
  if (SECURITY_CONFIG.blockedIPs.has(ip)) {
    securityLogger.warn("Blocked IP access attempt", {
      ip,
      pathname,
      userAgent,
    });

    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  }

  // 2. Verificar User-Agent sospechoso
  if (isSuspiciousUserAgent(userAgent)) {
    securityLogger.warn("Suspicious User-Agent detected", {
      ip,
      userAgent,
      pathname,
    });
  }

  // 3. Verificar parámetros de URL
  for (const [key, value] of searchParams.entries()) {
    if (isMaliciousInput(value)) {
      securityLogger.warn("Malicious input detected in URL params", {
        ip,
        pathname,
        param: key,
        value: value.substring(0, 100), // Solo primeros 100 caracteres
      });

      return NextResponse.json(
        { success: false, error: "Invalid input detected" },
        { status: 400 }
      );
    }
  }

  // 4. Verificar tamaño del body
  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    parseInt(contentLength) > SECURITY_CONFIG.limits.maxBodySize
  ) {
    securityLogger.warn("Request body too large", {
      ip,
      pathname,
      contentLength: parseInt(contentLength),
      maxSize: SECURITY_CONFIG.limits.maxBodySize,
    });

    return NextResponse.json(
      { success: false, error: "Request body too large" },
      { status: 413 }
    );
  }

  // 5. Verificar método HTTP
  if (!isAllowedMethod(request.method)) {
    securityLogger.warn("Disallowed HTTP method", {
      ip,
      pathname,
      method: request.method,
    });

    return NextResponse.json(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

  // 6. Verificar headers de seguridad
  if (request.method === "OPTIONS") {
    return handleCORS(request);
  }

  return null; // No hay problemas de seguridad
}

// ========================================
// FUNCIONES DE VERIFICACIÓN
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

function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
    /java/i,
    /perl/i,
    /ruby/i,
    /go-http/i,
    /okhttp/i,
    /apache/i,
    /nginx/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
}

function isMaliciousInput(input: string): boolean {
  // Verificar patrones de XSS
  for (const pattern of SECURITY_CONFIG.attackPatterns) {
    if (pattern.test(input)) {
      return true;
    }
  }

  // Verificar patrones de SQL injection
  for (const pattern of SECURITY_CONFIG.sqlInjectionPatterns) {
    if (pattern.test(input)) {
      return true;
    }
  }

  // Verificar caracteres peligrosos
  const dangerousChars = ["<", ">", '"', "'", "&", ";", "(", ")", "=", "+"];
  const dangerousCharCount = dangerousChars.reduce((count, char) => {
    return count + (input.split(char).length - 1);
  }, 0);

  // Si hay más de 5 caracteres peligrosos, es sospechoso
  return dangerousCharCount > 5;
}

function isAllowedMethod(method: string): boolean {
  const allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
  return allowedMethods.includes(method);
}

// ========================================
// MANEJO DE CORS
// ========================================

function handleCORS(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  const corsConfig = SECURITY_CONFIG.cors;

  // Verificar origen
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      { success: false, error: "CORS policy violation" },
      { status: 403 }
    );
  }

  // Crear respuesta CORS
  const response = NextResponse.json({ success: true });

  // Agregar headers CORS
  response.headers.set(
    "Access-Control-Allow-Origin",
    origin || corsConfig.origin
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    corsConfig.methods.join(", ")
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    corsConfig.allowedHeaders.join(", ")
  );
  response.headers.set(
    "Access-Control-Allow-Credentials",
    corsConfig.credentials.toString()
  );
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 horas

  return response;
}

function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3000",
    "https://localhost:3000",
  ];

  return allowedOrigins.includes(origin);
}

// ========================================
// MIDDLEWARE DE HEADERS DE SEGURIDAD
// ========================================

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Agregar headers de seguridad
  Object.entries(SECURITY_CONFIG.securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// ========================================
// MIDDLEWARE DE SANITIZACIÓN
// ========================================

export function sanitizeInput(input: string): string {
  // Remover caracteres peligrosos
  let sanitized = input
    .replace(/[<>]/g, "") // Remover < y >
    .replace(/javascript:/gi, "") // Remover javascript:
    .replace(/on\w+\s*=/gi, "") // Remover event handlers
    .trim();

  // Limitar longitud
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }

  return sanitized;
}

// ========================================
// MIDDLEWARE DE VALIDACIÓN DE ARCHIVOS
// ========================================

export function validateFileUpload(
  file: File,
  allowedTypes: string[] = ["image/jpeg", "image/png", "application/pdf"],
  maxSize: number = SECURITY_CONFIG.limits.maxFileSize
): { valid: boolean; error?: string } {
  // Verificar tipo de archivo
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(
        ", "
      )}`,
    };
  }

  // Verificar tamaño
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Archivo demasiado grande. Tamaño máximo: ${
        maxSize / 1024 / 1024
      }MB`,
    };
  }

  // Verificar nombre de archivo
  if (isMaliciousInput(file.name)) {
    return {
      valid: false,
      error: "Nombre de archivo no válido",
    };
  }

  return { valid: true };
}

// ========================================
// MIDDLEWARE DE LOGGING DE SEGURIDAD
// ========================================

export function logSecurityEvent(
  event: string,
  details: any,
  request: NextRequest
) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "";
  const pathname = new URL(request.url).pathname;

  securityLogger.warn(`Security event: ${event}`, {
    ip,
    userAgent,
    pathname,
    details,
    timestamp: new Date().toISOString(),
  });
}

