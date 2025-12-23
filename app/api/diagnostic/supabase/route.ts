import { NextResponse } from "next/server";
import { isEnvValid, getEnvErrors, getEnvWarnings, env } from "@/lib/config/env";
import { createClient, createServerClient } from "@/lib/supabase";

/**
 * Endpoint de diagnóstico completo de Supabase
 * GET /api/diagnostic/supabase
 */
export async function GET() {
  const diagnostic: {
    timestamp: string;
    environment: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
      variables: {
        url: boolean;
        anonKey: boolean;
        serviceRoleKey: boolean;
      };
    };
    connection: {
      clientCreation: {
        success: boolean;
        error?: string;
      };
      serverClientCreation: {
        success: boolean;
        error?: string;
      };
      httpTest: {
        success: boolean;
        statusCode?: number;
        error?: string;
        errorCode?: string;
      };
      databaseTest: {
        success: boolean;
        error?: string;
        errorCode?: string;
        tablesExist?: boolean;
      };
    };
    recommendations: string[];
  } = {
    timestamp: new Date().toISOString(),
    environment: {
      isValid: false,
      errors: [],
      warnings: [],
      variables: {
        url: false,
        anonKey: false,
        serviceRoleKey: false,
      },
    },
    connection: {
      clientCreation: { success: false },
      serverClientCreation: { success: false },
      httpTest: { success: false },
      databaseTest: { success: false },
    },
    recommendations: [],
  };

  // ============================================
  // 1. VERIFICAR CONFIGURACIÓN DE ENTORNO
  // ============================================
  diagnostic.environment.isValid = isEnvValid();
  diagnostic.environment.errors = getEnvErrors();
  diagnostic.environment.warnings = getEnvWarnings();

  diagnostic.environment.variables.url = !!env.supabase.url;
  diagnostic.environment.variables.anonKey = !!env.supabase.anonKey;
  diagnostic.environment.variables.serviceRoleKey = !!env.supabase.serviceRoleKey;

  if (!diagnostic.environment.isValid) {
    diagnostic.recommendations.push(
      "Configura las variables de entorno faltantes en .env.local"
    );
    return NextResponse.json(diagnostic, { status: 500 });
  }

  // ============================================
  // 2. VERIFICAR CREACIÓN DE CLIENTE
  // ============================================
  try {
    const client = createClient();
    diagnostic.connection.clientCreation.success = true;
  } catch (error) {
    diagnostic.connection.clientCreation.success = false;
    diagnostic.connection.clientCreation.error =
      error instanceof Error ? error.message : "Error desconocido";
    diagnostic.recommendations.push(
      "Error al crear cliente de Supabase. Verifica las variables de entorno."
    );
  }

  try {
    const serverClient = createServerClient();
    diagnostic.connection.serverClientCreation.success = true;
  } catch (error) {
    diagnostic.connection.serverClientCreation.success = false;
    diagnostic.connection.serverClientCreation.error =
      error instanceof Error ? error.message : "Error desconocido";
    if (!env.supabase.serviceRoleKey) {
      diagnostic.recommendations.push(
        "SUPABASE_SERVICE_ROLE_KEY no está configurada (opcional pero recomendada)"
      );
    }
  }

  // ============================================
  // 3. VERIFICAR CONEXIÓN HTTP
  // ============================================
  try {
    const url = new URL(env.supabase.url);
    const response = await fetch(`${env.supabase.url}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: env.supabase.anonKey,
        Authorization: `Bearer ${env.supabase.anonKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    diagnostic.connection.httpTest.success =
      response.status === 200 || response.status === 401;
    diagnostic.connection.httpTest.statusCode = response.status;
  } catch (error) {
    diagnostic.connection.httpTest.success = false;
    if (error instanceof Error) {
      diagnostic.connection.httpTest.error = error.message;
      if ("code" in error) {
        diagnostic.connection.httpTest.errorCode = String(error.code);
      }

      // Mensajes específicos según el tipo de error
      if (error.message.includes("ENOTFOUND")) {
        diagnostic.recommendations.push(
          "El hostname de Supabase no se puede resolver. Verifica:"
        );
        diagnostic.recommendations.push(
          "  1. Que el proyecto de Supabase esté activo (no pausado)"
        );
        diagnostic.recommendations.push(
          "  2. Ve a https://supabase.com/dashboard y verifica el estado"
        );
        diagnostic.recommendations.push(
          "  3. Si está pausado, reactívalo desde el dashboard"
        );
        diagnostic.recommendations.push("  4. Verifica que la URL sea correcta");
      } else if (error.message.includes("timeout")) {
        diagnostic.recommendations.push(
          "Timeout al conectar con Supabase. Verifica tu conexión a internet."
        );
      } else {
        diagnostic.recommendations.push(
          `Error de conexión: ${error.message}`
        );
      }
    }
  }

  // ============================================
  // 4. VERIFICAR BASE DE DATOS Y TABLAS
  // ============================================
  if (diagnostic.connection.clientCreation.success) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);

      if (error) {
        diagnostic.connection.databaseTest.success = false;
        diagnostic.connection.databaseTest.error = error.message;
        diagnostic.connection.databaseTest.errorCode = error.code;

        if (error.code === "42P01" || error.message.includes("does not exist")) {
          diagnostic.connection.databaseTest.tablesExist = false;
          diagnostic.recommendations.push(
            "Las tablas no existen. Ejecuta las migraciones en Supabase SQL Editor:"
          );
          diagnostic.recommendations.push(
            "  - supabase/migrations/20251222215551_phase1_multi_tenant_organizations.sql"
          );
          diagnostic.recommendations.push(
            "  - supabase/migrations/20251223000000_add_subscription_system.sql"
          );
          diagnostic.recommendations.push(
            "  - supabase/migrations/20251223010000_add_rating_triggers.sql"
          );
        } else if (error.code === "PGRST301") {
          diagnostic.recommendations.push(
            "Error de autenticación. Verifica que las API keys sean correctas."
          );
        }
      } else {
        diagnostic.connection.databaseTest.success = true;
        diagnostic.connection.databaseTest.tablesExist = true;
      }
    } catch (error) {
      diagnostic.connection.databaseTest.success = false;
      diagnostic.connection.databaseTest.error =
        error instanceof Error ? error.message : "Error desconocido";
    }
  }

  // ============================================
  // 5. RESUMEN Y RECOMENDACIONES FINALES
  // ============================================
  const allTestsPassed =
    diagnostic.environment.isValid &&
    diagnostic.connection.clientCreation.success &&
    diagnostic.connection.httpTest.success &&
    diagnostic.connection.databaseTest.success;

  if (allTestsPassed) {
    diagnostic.recommendations.push("✅ Todo está configurado correctamente!");
  } else {
    if (diagnostic.recommendations.length === 0) {
      diagnostic.recommendations.push(
        "Revisa los errores arriba para más detalles."
      );
    }
  }

  return NextResponse.json(
    {
      status: allTestsPassed ? "success" : "error",
      diagnostic,
    },
    { status: allTestsPassed ? 200 : 500 }
  );
}
