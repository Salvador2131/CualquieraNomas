// ========================================
// CONFIGURACIÓN DE LOGGING
// ========================================

export const LOGGING_CONFIG = {
  // Niveles de log por entorno
  levels: {
    development: "debug",
    production: "info",
    test: "error",
  },

  // Configuración de archivos
  files: {
    error: {
      filename: "logs/error.log",
      level: "error",
      maxSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    },
    combined: {
      filename: "logs/combined.log",
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    },
    api: {
      filename: "logs/api.log",
      level: "info",
      maxSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 7,
    },
    security: {
      filename: "logs/security.log",
      level: "warn",
      maxSize: 2 * 1024 * 1024, // 2MB
      maxFiles: 30, // Mantener más archivos de seguridad
    },
  },

  // Configuración de rotación
  rotation: {
    enabled: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    datePattern: "YYYY-MM-DD",
  },

  // Configuración de formato
  format: {
    timestamp: "YYYY-MM-DD HH:mm:ss",
    colorize: process.env.NODE_ENV !== "production",
    json: process.env.NODE_ENV === "production",
  },

  // Configuración de alertas
  alerts: {
    errorThreshold: 10, // Alertar después de 10 errores en 1 minuto
    securityThreshold: 5, // Alertar después de 5 eventos de seguridad en 1 minuto
    enabled: process.env.NODE_ENV === "production",
  },
};

// ========================================
// CONFIGURACIÓN DE MÉTRICAS
// ========================================

export const METRICS_CONFIG = {
  // Métricas de API
  api: {
    enabled: true,
    collectInterval: 60000, // 1 minuto
    metrics: [
      "request_count",
      "request_duration",
      "error_count",
      "response_size",
    ],
  },

  // Métricas de base de datos
  database: {
    enabled: true,
    collectInterval: 300000, // 5 minutos
    metrics: [
      "query_count",
      "query_duration",
      "connection_count",
      "error_count",
    ],
  },

  // Métricas de sistema
  system: {
    enabled: process.env.NODE_ENV === "production",
    collectInterval: 60000, // 1 minuto
    metrics: ["memory_usage", "cpu_usage", "disk_usage", "uptime"],
  },
};

// ========================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ========================================

export const NOTIFICATION_CONFIG = {
  // Notificaciones de errores críticos
  criticalErrors: {
    enabled: process.env.NODE_ENV === "production",
    channels: ["email", "slack"],
    threshold: 5, // Errores por minuto
  },

  // Notificaciones de seguridad
  security: {
    enabled: true,
    channels: ["email", "slack"],
    events: [
      "authentication_failure",
      "authorization_failure",
      "suspicious_activity",
      "rate_limit_exceeded",
    ],
  },

  // Notificaciones de performance
  performance: {
    enabled: process.env.NODE_ENV === "production",
    channels: ["slack"],
    threshold: 5000, // 5 segundos
  },
};

