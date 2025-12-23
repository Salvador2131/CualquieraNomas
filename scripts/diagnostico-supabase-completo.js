/**
 * DIAGNÓSTICO COMPLETO DE SUPABASE
 * Verifica: conexión, tablas existentes, tablas faltantes, y estado de migraciones
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
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(80));
  log(title, "cyan");
  console.log("=".repeat(80));
}

// Tablas esperadas según las migraciones
const EXPECTED_TABLES = [
  // Core
  "organizations",
  "users",
  "workers",
  "employers",
  "events",
  "preregistrations",
  "quotes",
  
  // Relaciones
  "event_workers",
  "event_ratings",
  "event_chats",
  "worker_salaries",
  "worker_certificates",
  
  // Sistema
  "subscriptions",
  "notifications",
  "notification_logs",
  "email_templates",
  
  // Penalizaciones
  "penalties",
  "penalty_logs",
  "penalty_appeals",
  
  // Conflictos
  "conflicts",
  "conflict_logs",
  
  // Backups
  "backups",
  "backup_logs",
  
  // Otros
  "incident_reports",
  "ratings",
  "messages",
  "payments",
  "document_expiry_notifications",
  "document_validations",
  "document_validation_logs",
];

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
      log(`⚠️  ${key}: Valor parece ser placeholder`, "yellow");
      results[key] = false;
    } else {
      log(`✅ ${key}: Configurada`, "green");
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
      log("❌ No se pueden verificar las credenciales", "red");
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
            resolve({ success: true, statusCode: res.statusCode });
          } else {
            log(`⚠️  Supabase responde con código: ${res.statusCode}`, "yellow");
            resolve({ success: false, statusCode: res.statusCode });
          }
        });
      });

      req.on("error", (error) => {
        log(`❌ Error al conectar: ${error.message}`, "red");
        if (error.code === "ENOTFOUND") {
          log("\n   ⚠️  El proyecto de Supabase está pausado o la URL es incorrecta", "yellow");
          log("   💡 Ve a https://supabase.com/dashboard y verifica el estado", "blue");
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
// 3. VERIFICAR TABLAS EXISTENTES
// ============================================
function verifyTables(supabaseUrl, supabaseKey) {
  return new Promise((resolve) => {
    logSection("3. VERIFICACIÓN DE TABLAS EN SUPABASE");

    const existingTables = [];
    const missingTables = [];
    let checked = 0;
    const total = EXPECTED_TABLES.length;

    log(`🔍 Verificando ${total} tablas...`, "blue");

    EXPECTED_TABLES.forEach((tableName) => {
      const urlObj = new URL(supabaseUrl);
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: `/rest/v1/${tableName}?select=count&limit=1`,
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "count=exact",
        },
        timeout: 5000,
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          checked++;

          if (res.statusCode === 200 || res.statusCode === 206) {
            existingTables.push(tableName);
            log(`✅ ${tableName}`, "green");
          } else if (res.statusCode === 404 || res.statusCode === 406) {
            missingTables.push(tableName);
            log(`❌ ${tableName} - NO EXISTE`, "red");
          } else {
            // Intentar parsear para ver si es un error de RLS
            try {
              const json = JSON.parse(data);
              if (json.message && json.message.includes("permission denied")) {
                existingTables.push(tableName);
                log(`⚠️  ${tableName} - Existe pero RLS bloquea acceso`, "yellow");
              } else {
                missingTables.push(tableName);
                log(`❌ ${tableName} - Error ${res.statusCode}`, "red");
              }
            } catch {
              missingTables.push(tableName);
              log(`❌ ${tableName} - Error ${res.statusCode}`, "red");
            }
          }

          if (checked === total) {
            resolve({ existingTables, missingTables });
          }
        });
      });

      req.on("error", () => {
        checked++;
        missingTables.push(tableName);
        log(`❌ ${tableName} - Error de conexión`, "red");

        if (checked === total) {
          resolve({ existingTables, missingTables });
        }
      });

      req.on("timeout", () => {
        checked++;
        missingTables.push(tableName);
        log(`❌ ${tableName} - Timeout`, "red");
        req.destroy();

        if (checked === total) {
          resolve({ existingTables, missingTables });
        }
      });

      req.end();
    });
  });
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function main() {
  console.clear();
  log("🔍 DIAGNÓSTICO COMPLETO DE SUPABASE", "cyan");
  log("   ERP Sistema de Gestión para Banquetes\n", "blue");

  // 1. Verificar variables de entorno
  const { allRequired, results } = verifyEnvironmentVariables();

  if (!allRequired) {
    log("\n❌ Faltan variables de entorno requeridas", "red");
    log("   Crea un archivo .env.local con las credenciales necesarias", "yellow");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 2. Verificar conexión HTTP
  const connectionResult = await verifySupabaseConnection(supabaseUrl, supabaseKey);

  if (!connectionResult.success) {
    logSection("❌ RESUMEN: CONEXIÓN FALLIDA");
    log("No se puede continuar sin conexión a Supabase", "red");
    
    if (connectionResult.code === "ENOTFOUND") {
      log("\n🔧 SOLUCIONES:", "magenta");
      log("1. Ve a https://supabase.com/dashboard", "yellow");
      log("2. Verifica que tu proyecto esté activo (no pausado)", "yellow");
      log("3. Si está pausado, reactívalo", "yellow");
      log("4. Verifica que la URL en .env.local sea correcta", "yellow");
    }
    process.exit(1);
  }

  // 3. Verificar tablas
  const { existingTables, missingTables } = await verifyTables(supabaseUrl, supabaseKey);

  // ============================================
  // RESUMEN FINAL
  // ============================================
  logSection("📊 RESUMEN FINAL");

  log(`Variables de Entorno: ${allRequired ? "✅ OK" : "❌ FALTANTES"}`, allRequired ? "green" : "red");
  log(`Conexión HTTP: ${connectionResult.success ? "✅ OK" : "❌ ERROR"}`, connectionResult.success ? "green" : "red");
  log(`Tablas Existentes: ${existingTables.length}/${EXPECTED_TABLES.length}`, existingTables.length === EXPECTED_TABLES.length ? "green" : "yellow");
  log(`Tablas Faltantes: ${missingTables.length}`, missingTables.length === 0 ? "green" : "red");

  if (missingTables.length > 0) {
    log("\n📋 TABLAS FALTANTES:", "magenta");
    missingTables.forEach((table) => {
      log(`   - ${table}`, "red");
    });

    log("\n🔧 PRÓXIMOS PASOS:", "magenta");
    log("1. Ve a Supabase Dashboard > SQL Editor", "yellow");
    log("2. Ejecuta las migraciones en orden:", "yellow");
    log("   a) supabase/migrations/20251222215551_phase1_multi_tenant_organizations.sql", "blue");
    log("   b) supabase/migrations/20251223000000_add_subscription_system.sql", "blue");
    log("   c) supabase/migrations/20251223010000_add_rating_triggers.sql", "blue");
    log("   d) supabase/migrations/20251223020000_enable_rls_basic.sql", "blue");
    
    if (missingTables.includes("users") || missingTables.includes("workers") || missingTables.includes("events")) {
      log("\n⚠️  IMPORTANTE: Faltan tablas base críticas", "yellow");
      log("   Necesitas crear primero las tablas base antes de ejecutar las migraciones", "yellow");
      log("   Revisa scripts/create-tables.sql o scripts/supabase-setup.sql", "blue");
    }
  } else {
    log("\n✅ Todas las tablas existen", "green");
    log("💡 Ejecuta la migración de RLS si aún no lo has hecho:", "blue");
    log("   supabase/migrations/20251223020000_enable_rls_basic.sql", "blue");
  }

  console.log("\n");
}

// Ejecutar
main().catch((error) => {
  log(`\n❌ Error fatal: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
