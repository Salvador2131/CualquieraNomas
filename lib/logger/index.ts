import winston from "winston";
import path from "path";

// ========================================
// CONFIGURACIÓN DE LOGGING
// ========================================

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// ========================================
// CREAR LOGGER PRINCIPAL
// ========================================

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "erp-banquetes" },
  transports: [
    // Archivo de errores
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Archivo combinado
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// ========================================
// CONFIGURAR CONSOLA PARA DESARROLLO
// ========================================

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// ========================================
// LOGGER ESPECÍFICOS
// ========================================

export const apiLogger = logger.child({ component: "api" });
export const authLogger = logger.child({ component: "auth" });
export const dbLogger = logger.child({ component: "database" });
export const emailLogger = logger.child({ component: "email" });
export const securityLogger = logger.child({ component: "security" });

// ========================================
// FUNCIONES DE LOGGING ESPECÍFICAS
// ========================================

export function logApiRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string,
  ip?: string
) {
  apiLogger.info("API Request", {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    userId,
    ip,
  });
}

export function logApiError(
  method: string,
  url: string,
  error: Error,
  userId?: string,
  ip?: string
) {
  apiLogger.error("API Error", {
    method,
    url,
    error: error.message,
    stack: error.stack,
    userId,
    ip,
  });
}

export function logAuthEvent(
  event: string,
  userId?: string,
  email?: string,
  ip?: string,
  success: boolean = true
) {
  const level = success ? "info" : "warn";
  authLogger[level](`Auth ${event}`, {
    userId,
    email,
    ip,
    success,
  });
}

export function logSecurityEvent(
  event: string,
  severity: "low" | "medium" | "high" | "critical",
  details: any,
  userId?: string,
  ip?: string
) {
  const level =
    severity === "critical" || severity === "high" ? "error" : "warn";

  securityLogger[level](`Security ${event}`, {
    severity,
    details,
    userId,
    ip,
  });
}

export function logDatabaseOperation(
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  error?: Error
) {
  const level = success ? "info" : "error";

  dbLogger[level](`Database ${operation}`, {
    table,
    duration: `${duration}ms`,
    success,
    error: error?.message,
  });
}

export function logEmailEvent(
  event: string,
  to: string,
  subject?: string,
  success: boolean = true,
  error?: Error
) {
  const level = success ? "info" : "error";

  emailLogger[level](`Email ${event}`, {
    to,
    subject,
    success,
    error: error?.message,
  });
}

// ========================================
// MIDDLEWARE DE LOGGING PARA APIS
// ========================================

export function createLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const originalSend = res.send;

    res.send = function (data: any) {
      const duration = Date.now() - start;

      logApiRequest(
        req.method,
        req.url,
        res.statusCode,
        duration,
        req.user?.id,
        req.ip
      );

      return originalSend.call(this, data);
    };

    next();
  };
}

// ========================================
// MANEJADOR DE ERRORES NO CAPTURADOS
// ========================================

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });

  // En producción, cerrar la aplicación
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", {
    reason: reason instanceof Error ? reason.message : reason,
    promise: promise.toString(),
  });
});

export default logger;

