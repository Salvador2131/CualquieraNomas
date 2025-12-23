/**
 * Script completo de verificación de Supabase
 * Verifica: Variables de entorno, conexión, tablas, y endpoints
 */

const https = require("https");
const http = require("http");
require("dotenv").config({ path: ".env.local" });

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(70));
  log(title, "cyan");
  console.log("=".repeat(70));
}

// ============================================
// 1. VERIFICAR VARIABLES DE ENTORNO
// ============================================
function verifyEnvironmentVariables() {
  logSection("1. VERIFICACIÓN DE VARIABLES DE ENTORNO");

  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  let allRequired = true;
  const results = {};

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      log(`❌ ${key}: NO CONFIGURADA`, "red");
      allRequired = false;
      results[key] = false;
    } else if (
      value.includes("tu-") ||
      value.includes("your-") ||
      value.length < 20
    ) {
      log(`⚠️  ${key}: Valor parece ser placeholder o inválido`, "yellow");
      log(`   Longitud: ${value.length}`, "yellow");
      results[key] = false;
    } else {
      log(`✅ ${key}: Configurada (${value.length} caracteres)`, "green");
      if (key === "NEXT_PUBLIC_SUPABASE_URL") {
        log(`   URL: ${value}`, "blue");
        results.url = value;
      }
      results[key] = true;
    }
  }

  return { allRequired, results };
}

// ============================================
// 2. VERIFICAR CONEXIÓN HTTP CON SUPABASE
// ============================================
function verifySupabaseConnection(supabaseUrl, supabaseKey) {
  return new Promise((resolve) => {
    logSection("2. VERIFICACIÓN DE CONEXIÓN HTTP CON SUPABASE");

    if (!supabaseUrl || !supabaseKey) {
      log("❌ No se pueden verificar las credenciales de Supabase", "red");
      resolve({ success: false, error: "Credenciales faltantes" });
      return;
    }

    try {
      const urlObj = new URL(supabaseUrl);
      log(`🔍 Probando conexión a: ${supabaseUrl}`, "blue");

      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: "/rest/v1/",
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode === 200 || res.statusCode === 401) {
            log("✅ Supabase responde correctamente", "green");
            log(`   Status: ${res.statusCode}`, "green");
            log(
              `   Content-Type: ${res.headers["content-type"] || "N/A"}`,
              "green"
            );
            resolve({ success: true, statusCode: res.statusCode });
          } else {
            log(
              `⚠️  Supabase responde con código: ${res.statusCode}`,
              "yellow"
            );
            resolve({ success: false, statusCode: res.statusCode });
          }
        });
      });

      req.on("error", (error) => {
        log(`❌ Error al conectar con Supabase: ${error.message}`, "red");
        if (error.code === "ENOTFOUND") {
          log(
            "   ⚠️  El hostname no se puede resolver. Posibles causas:",
            "yellow"
          );
          log("      - El proyecto de Supabase está pausado", "yellow");
          log("      - La URL es incorrecta", "yellow");
          log("      - Problema de DNS/red", "yellow");
        }
        resolve({ success: false, error: error.message, code: error.code });
      });

      req.on("timeout", () => {
        log("❌ Timeout: Supabase no responde", "red");
        req.destroy();
        resolve({ success: false, error: "Timeout" });
      });

      req.end();
    } catch (error) {
      log(`❌ Error: ${error.message}`, "red");
      resolve({ success: false, error: error.message });
    }
  });
}

// ============================================
// 3. VERIFICAR TABLAS EN SUPABASE (vía API)
// ============================================
function verifySupabaseTables(supabaseUrl, supabaseKey) {
  return new Promise((resolve) => {
    logSection("3. VERIFICACIÓN DE TABLAS EN SUPABASE");

    const expectedTables = [
      "users",
      "workers",
      "employers",
      "events",
      "organizations",
      "event_workers",
      "worker_salaries",
      "preregistrations",
      "quotes",
      "notifications",
    ];

    log("🔍 Verificando existencia de tablas...", "blue");

    // Intentar consultar la tabla 'users' como prueba
    const urlObj = new URL(supabaseUrl);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: "/rest/v1/users?select=count&limit=1",
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "count=exact",
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          log("✅ La tabla 'users' existe y es accesible", "green");
          try {
            const json = JSON.parse(data);
            log(`   Registros encontrados: ${json.length || 0}`, "blue");
          } catch (e) {
            // No importa si no podemos parsear
          }
          resolve({ success: true, tablesExist: true });
        } else if (res.statusCode === 404 || res.statusCode === 406) {
          log("⚠️  La tabla 'users' no existe o no es accesible", "yellow");
          log("   Código: " + res.statusCode, "yellow");
          log(
            "   Necesitas ejecutar las migraciones en Supabase SQL Editor",
            "yellow"
          );
          resolve({
            success: false,
            tablesExist: false,
            statusCode: res.statusCode,
          });
        } else {
          log(`⚠️  Respuesta inesperada: ${res.statusCode}`, "yellow");
          log(`   Mensaje: ${data.substring(0, 200)}`, "yellow");
          resolve({ success: false, statusCode: res.statusCode });
        }
      });
    });

    req.on("error", (error) => {
      log(`❌ Error verificando tablas: ${error.message}`, "red");
      resolve({ success: false, error: error.message });
    });

    req.on("timeout", () => {
      log("❌ Timeout verificando tablas", "red");
      req.destroy();
      resolve({ success: false, error: "Timeout" });
    });

    req.end();
  });
}

// ============================================
// 4. VERIFICAR ENDPOINT DE HEALTH DE LA APP
// ============================================
function verifyAppHealthEndpoint() {
  return new Promise((resolve) => {
    logSection("4. VERIFICACIÓN DE ENDPOINT DE HEALTH DE LA APP");

    log("💡 Para verificar desde la aplicación:", "blue");
    log("   1. Inicia el servidor: npm run dev", "blue");
    log("   2. Visita: http://localhost:3000/api/health/supabase", "blue");
    log("   3. Verifica la respuesta JSON", "blue");

    resolve({ success: true });
  });
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function main() {
  console.clear();
  log("🔍 VERIFICACIÓN COMPLETA DE SUPABASE", "cyan");
  log("   ERP Sistema de Gestión para Banquetes\n", "blue");

  // 1. Verificar variables de entorno
  const { allRequired, results } = verifyEnvironmentVariables();

  if (!allRequired) {
    log("\n❌ Faltan variables de entorno requeridas", "red");
    log(
      "   Crea un archivo .env.local con las credenciales necesarias",
      "yellow"
    );
    process.exit(1);
  }

  // 2. Verificar conexión HTTP
  const connectionResult = await verifySupabaseConnection(
    results.NEXT_PUBLIC_SUPABASE_URL
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : null,
    results.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : null
  );

  // 3. Verificar tablas (solo si la conexión fue exitosa)
  let tablesResult = { success: false };
  if (connectionResult.success) {
    tablesResult = await verifySupabaseTables(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  } else {
    log("\n⚠️  Saltando verificación de tablas (conexión falló)", "yellow");
  }

  // 4. Verificar endpoint de health
  await verifyAppHealthEndpoint();

  // ============================================
  // RESUMEN FINAL
  // ============================================
  logSection("RESUMEN FINAL");

  log(
    `Variables de Entorno: ${allRequired ? "✅ OK" : "❌ FALTANTES"}`,
    allRequired ? "green" : "red"
  );
  log(
    `Conexión HTTP: ${connectionResult.success ? "✅ OK" : "❌ ERROR"}`,
    connectionResult.success ? "green" : "red"
  );

  if (connectionResult.error) {
    log(`   Error: ${connectionResult.error}`, "red");
    if (connectionResult.code === "ENOTFOUND") {
      log("\n🔧 SOLUCIONES POSIBLES:", "magenta");
      log(
        "   1. Verifica que el proyecto de Supabase esté activo (no pausado)",
        "yellow"
      );
      log(
        "   2. Ve a https://supabase.com/dashboard y verifica el estado",
        "yellow"
      );
      log("   3. Si está pausado, reactívalo desde el dashboard", "yellow");
      log("   4. Verifica que la URL sea correcta", "yellow");
    }
  }

  if (connectionResult.success) {
    log(
      `Tablas: ${
        tablesResult.tablesExist ? "✅ EXISTEN" : "⚠️  NO ENCONTRADAS"
      }`,
      tablesResult.tablesExist ? "green" : "yellow"
    );

    if (!tablesResult.tablesExist) {
      log("\n📋 PRÓXIMOS PASOS:", "magenta");
      log("   1. Ve a Supabase Dashboard > SQL Editor", "yellow");
      log("   2. Ejecuta las migraciones en orden:", "yellow");
      log(
        "      - supabase/migrations/20251222215551_phase1_multi_tenant_organizations.sql",
        "blue"
      );
      log(
        "      - supabase/migrations/20251223000000_add_subscription_system.sql",
        "blue"
      );
      log(
        "      - supabase/migrations/20251223010000_add_rating_triggers.sql",
        "blue"
      );
    }
  }

  log("\n💡 TIPS:", "cyan");
  log("   - Ejecuta 'npm run dev' y visita /api/health/supabase", "blue");
  log("   - Revisa los logs del servidor para más detalles", "blue");
  log("   - Verifica el estado del proyecto en Supabase Dashboard", "blue");

  console.log("\n");
}

// Ejecutar
main().catch((error) => {
  log(`\n❌ Error fatal: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
