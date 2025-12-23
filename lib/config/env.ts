/**
 * Configuración centralizada de variables de entorno
 * Valida y proporciona acceso seguro a todas las variables de entorno
 */

type EnvConfig = {
  // Supabase (Requeridas)
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  
  // App (Opcionales con defaults)
  app: {
    url: string;
    nodeEnv: "development" | "production" | "test";
  };
  
  // Seguridad (Opcionales con warnings)
  security: {
    jwtSecret: string | null;
    encryptionKey: string | null;
    rateLimitEnabled: boolean;
    corsOrigin: string;
  };
  
  // Email (Opcionales)
  email: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string | null;
    pass: string | null;
  };
  
  // Cron Jobs (Opcional)
  cron: {
    secret: string | null;
  };
  
  // Logging (Opcionales con defaults)
  logging: {
    level: string;
    fileEnabled: boolean;
    consoleEnabled: boolean;
  };
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Partial<EnvConfig>;
};

/**
 * Valida y carga todas las variables de entorno
 */
function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: Partial<EnvConfig> = {};

  // ============================================
  // 1. SUPABASE (REQUERIDAS)
  // ============================================
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL es requerida");
  } else if (!supabaseUrl.startsWith("https://") && !supabaseUrl.startsWith("http://")) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida (https:// o http://)");
  } else if (supabaseUrl.includes("tu-proyecto") || supabaseUrl.includes("your-project")) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL parece ser un placeholder. Configura tu URL real.");
  }

  if (!supabaseAnonKey) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida");
  } else if (supabaseAnonKey.length < 20) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY parece ser inválida (muy corta)");
  } else if (supabaseAnonKey.includes("tu-") || supabaseAnonKey.includes("your-")) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY parece ser un placeholder. Configura tu clave real.");
  }

  if (!supabaseServiceRoleKey) {
    warnings.push("SUPABASE_SERVICE_ROLE_KEY no está configurada. Algunas funciones del servidor pueden no funcionar.");
  } else if (supabaseServiceRoleKey.length < 20) {
    warnings.push("SUPABASE_SERVICE_ROLE_KEY parece ser inválida (muy corta)");
  } else if (supabaseServiceRoleKey.includes("tu-") || supabaseServiceRoleKey.includes("your-")) {
    warnings.push("SUPABASE_SERVICE_ROLE_KEY parece ser un placeholder.");
  }

  if (supabaseUrl && supabaseAnonKey) {
    config.supabase = {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceRoleKey || "",
    };
  }

  // ============================================
  // 2. APP (OPCIONALES CON DEFAULTS)
  // ============================================
  const nodeEnv = (process.env.NODE_ENV || "development") as "development" | "production" | "test";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (nodeEnv === "production" ? "https://tu-app.vercel.app" : "http://localhost:3000");

  if (!process.env.NEXT_PUBLIC_APP_URL && nodeEnv === "production") {
    warnings.push("NEXT_PUBLIC_APP_URL no está configurada. Usando valor por defecto.");
  }

  config.app = {
    url: appUrl,
    nodeEnv,
  };

  // ============================================
  // 3. SEGURIDAD (OPCIONALES CON WARNINGS)
  // ============================================
  const jwtSecret = process.env.JWT_SECRET || null;
  const encryptionKey = process.env.ENCRYPTION_KEY || null;

  if (!jwtSecret && nodeEnv === "production") {
    warnings.push("JWT_SECRET no está configurada. La autenticación puede ser insegura en producción.");
  }

  if (!encryptionKey && nodeEnv === "production") {
    warnings.push("ENCRYPTION_KEY no está configurada. Algunas funciones de encriptación pueden no funcionar.");
  }

  config.security = {
    jwtSecret,
    encryptionKey,
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== "false",
    corsOrigin: process.env.CORS_ORIGIN || appUrl,
  };

  // ============================================
  // 4. EMAIL (OPCIONALES)
  // ============================================
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpSecure = process.env.SMTP_SECURE === "true";
  const smtpUser = process.env.SMTP_USER || null;
  const smtpPass = process.env.SMTP_PASS || null;

  const emailEnabled = !!(smtpUser && smtpPass);

  if (!emailEnabled) {
    warnings.push("Email no está configurado (SMTP_USER o SMTP_PASS faltantes). Las notificaciones por email no funcionarán.");
  }

  config.email = {
    enabled: emailEnabled,
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    user: smtpUser,
    pass: smtpPass,
  };

  // ============================================
  // 5. CRON JOBS (OPCIONAL)
  // ============================================
  const cronSecret = process.env.CRON_SECRET || null;

  if (!cronSecret && nodeEnv === "production") {
    warnings.push("CRON_SECRET no está configurada. Los cron jobs pueden ser vulnerables.");
  }

  config.cron = {
    secret: cronSecret,
  };

  // ============================================
  // 6. LOGGING (OPCIONALES CON DEFAULTS)
  // ============================================
  config.logging = {
    level: process.env.LOG_LEVEL || (nodeEnv === "production" ? "info" : "debug"),
    fileEnabled: process.env.LOG_FILE_ENABLED !== "false",
    consoleEnabled: process.env.LOG_CONSOLE_ENABLED !== "false",
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: config as EnvConfig,
  };
}

// Validar al cargar el módulo
const validation = validateEnvironment();

// Exportar configuración validada
export const env = validation.config as EnvConfig;

// Exportar resultado de validación
export const envValidation = {
  isValid: validation.isValid,
  errors: validation.errors,
  warnings: validation.warnings,
};

/**
 * Helper para obtener variables de entorno con validación
 */
export function getEnv(key: keyof EnvConfig): any {
  return env[key];
}

/**
 * Verificar si el entorno está correctamente configurado
 */
export function isEnvValid(): boolean {
  return envValidation.isValid;
}

/**
 * Obtener todos los errores de configuración
 */
export function getEnvErrors(): string[] {
  return envValidation.errors;
}

/**
 * Obtener todas las advertencias de configuración
 */
export function getEnvWarnings(): string[] {
  return envValidation.warnings;
}

/**
 * Imprimir resumen de configuración (solo en desarrollo)
 */
if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
  if (envValidation.errors.length > 0) {
    console.error("❌ Errores de configuración de entorno:");
    envValidation.errors.forEach((error) => console.error(`   - ${error}`));
  }

  if (envValidation.warnings.length > 0) {
    console.warn("⚠️  Advertencias de configuración:");
    envValidation.warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  if (envValidation.isValid && envValidation.warnings.length === 0) {
    console.log("✅ Configuración de entorno válida");
  }
}

// Exportar tipos
export type { EnvConfig, ValidationResult };
