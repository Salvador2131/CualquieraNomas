/**
 * Script completo de verificación de conexiones
 * Verifica: Supabase, Vercel, Variables de Entorno
 *
 * Uso: node scripts/verificar-conexiones.js [vercel-url]
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
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60));
}

// ============================================
// 1. VERIFICACIÓN DE VARIABLES DE ENTORNO
// ============================================
function verifyEnvironmentVariables() {
  logSection("1. VERIFICACIÓN DE VARIABLES DE ENTORNO");

  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const optionalVars = {
    JWT_SECRET: process.env.JWT_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  let allRequired = true;

  // Verificar variables requeridas
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      log(`❌ ${key}: NO CONFIGURADA`, "red");
      allRequired = false;
    } else if (
      value.includes("tu-") ||
      value.includes("your-") ||
      value.length < 20
    ) {
      log(`⚠️  ${key}: Valor parece ser placeholder o inválido`, "yellow");
      log(`   Longitud: ${value.length}`, "yellow");
    } else {
      log(`✅ ${key}: Configurada (${value.length} caracteres)`, "green");
      if (key === "NEXT_PUBLIC_SUPABASE_URL") {
        log(`   URL: ${value}`, "blue");
      }
    }
  }

  // Verificar variables opcionales
  log("\nVariables Opcionales:", "blue");
  for (const [key, value] of Object.entries(optionalVars)) {
    if (value) {
      log(`✅ ${key}: Configurada`, "green");
    } else {
      log(`⚪ ${key}: No configurada (opcional)`, "reset");
    }
  }

  return allRequired;
}

// ============================================
// 2. VERIFICACIÓN DE CONEXIÓN CON SUPABASE
// ============================================
async function verifySupabaseConnection() {
  logSection("2. VERIFICACIÓN DE CONEXIÓN CON SUPABASE");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log("❌ No se pueden verificar las credenciales de Supabase", "red");
    return false;
  }

  try {
    // Verificar formato de URL
    if (!supabaseUrl.startsWith("https://")) {
      log("❌ URL de Supabase debe comenzar con https://", "red");
      return false;
    }

    log(`🔍 Probando conexión a: ${supabaseUrl}`, "blue");

    // Hacer una petición HTTP simple para verificar que el servidor responde
    const urlObj = new URL(supabaseUrl);
    const healthEndpoint = `${supabaseUrl}/rest/v1/`;

    return new Promise((resolve) => {
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
        if (res.statusCode === 200 || res.statusCode === 401) {
          // 401 es válido porque no estamos haciendo una query específica
          log("✅ Supabase responde correctamente", "green");
          log(`   Status: ${res.statusCode}`, "green");
          resolve(true);
        } else {
          log(`⚠️  Supabase responde con código: ${res.statusCode}`, "yellow");
          resolve(false);
        }
      });

      req.on("error", (error) => {
        log(`❌ Error al conectar con Supabase: ${error.message}`, "red");
        resolve(false);
      });

      req.on("timeout", () => {
        log("❌ Timeout: Supabase no responde", "red");
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
    return false;
  }
}

// ============================================
// 3. VERIFICACIÓN DE TABLAS EN SUPABASE
// ============================================
async function verifySupabaseTables() {
  logSection("3. VERIFICACIÓN DE TABLAS EN SUPABASE");

  log(
    "⚠️  Para verificar tablas, ejecuta este script en Supabase SQL Editor:",
    "yellow"
  );
  log("   scripts/0_CONSULTAR_ESTADO_ACTUAL.sql", "blue");
  log("\n📋 Tablas esperadas:", "blue");

  const expectedTables = [
    "users",
    "workers",
    "employers",
    "events",
    "event_workers",
    "worker_salaries",
    "preregistrations",
    "ratings",
    "messages",
    "payments",
    "quotes",
  ];

  expectedTables.forEach((table, index) => {
    log(`   ${index + 1}. ${table}`, "blue");
  });

  log(
    "\n💡 Tip: Usa el endpoint /api/health/supabase para verificar desde la app",
    "yellow"
  );
}

// ============================================
// 4. VERIFICACIÓN DE CONEXIÓN CON VERCEL
// ============================================
async function verifyVercelConnection(vercelUrl) {
  logSection("4. VERIFICACIÓN DE CONEXIÓN CON VERCEL");

  if (!vercelUrl) {
    log("⚠️  No se proporcionó URL de Vercel", "yellow");
    log(
      "   Uso: node scripts/verificar-conexiones.js https://tu-proyecto.vercel.app",
      "yellow"
    );
    return false;
  }

  try {
    const urlObj = new URL(vercelUrl);
    const client = urlObj.protocol === "https:" ? https : http;

    log(`🔍 Verificando: ${vercelUrl}`, "blue");

    return new Promise((resolve) => {
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
        path: urlObj.pathname || "/",
        method: "GET",
        timeout: 15000,
        headers: {
          "User-Agent": "Connection-Verifier/1.0",
        },
      };

      const req = client.request(options, (res) => {
        log(`✅ Estado HTTP: ${res.statusCode}`, "green");
        log(
          `✅ Content-Type: ${res.headers["content-type"] || "N/A"}`,
          "green"
        );

        if (
          res.statusCode === 200 ||
          res.statusCode === 301 ||
          res.statusCode === 302
        ) {
          log("✅ La aplicación está corriendo en Vercel", "green");

          // Verificar endpoint de health
          verifyVercelHealthEndpoint(vercelUrl).then(() => {
            resolve(true);
          });
        } else {
          log(
            `⚠️  La aplicación responde pero con código ${res.statusCode}`,
            "yellow"
          );
          resolve(false);
        }
      });

      req.on("error", (error) => {
        log(`❌ Error al conectar: ${error.message}`, "red");
        log(
          "   Verifica que la URL sea correcta y que el deploy esté completo",
          "yellow"
        );
        resolve(false);
      });

      req.on("timeout", () => {
        log("❌ Timeout: La aplicación no responde", "red");
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
    return false;
  }
}

// ============================================
// 5. VERIFICAR ENDPOINT DE HEALTH EN VERCEL
// ============================================
async function verifyVercelHealthEndpoint(baseUrl) {
  log("\n🔍 Verificando endpoint de health...", "blue");

  try {
    const healthUrl = `${baseUrl}/api/health/supabase`;
    const urlObj = new URL(healthUrl);
    const client = urlObj.protocol === "https:" ? https : http;

    return new Promise((resolve) => {
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
        path: urlObj.pathname,
        method: "GET",
        timeout: 10000,
      };

      const req = client.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.status === "success") {
              log("✅ Endpoint de health responde correctamente", "green");
              log(`   Mensaje: ${json.message}`, "green");
            } else {
              log(`⚠️  Health endpoint reporta: ${json.message}`, "yellow");
            }
          } catch (e) {
            log(
              "⚠️  No se pudo parsear respuesta del health endpoint",
              "yellow"
            );
          }
          resolve();
        });
      });

      req.on("error", () => {
        log("⚠️  No se pudo conectar al endpoint de health", "yellow");
        resolve();
      });

      req.on("timeout", () => {
        log("⚠️  Timeout en endpoint de health", "yellow");
        req.destroy();
        resolve();
      });

      req.end();
    });
  } catch (error) {
    log(`⚠️  Error verificando health: ${error.message}`, "yellow");
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function main() {
  console.clear();
  log("🔍 VERIFICACIÓN COMPLETA DE CONEXIONES", "cyan");
  log("   ERP Sistema de Gestión para Banquetes\n", "blue");

  const vercelUrl = process.argv[2];

  // 1. Verificar variables de entorno
  const envOk = verifyEnvironmentVariables();

  if (!envOk) {
    log("\n❌ Faltan variables de entorno requeridas", "red");
    log(
      "   Crea un archivo .env.local con las credenciales necesarias",
      "yellow"
    );
    process.exit(1);
  }

  // 2. Verificar conexión con Supabase
  const supabaseOk = await verifySupabaseConnection();

  // 3. Verificar tablas (información)
  await verifySupabaseTables();

  // 4. Verificar conexión con Vercel (si se proporciona URL)
  let vercelOk = false;
  if (vercelUrl) {
    vercelOk = await verifyVercelConnection(vercelUrl);
  }

  // ============================================
  // RESUMEN FINAL
  // ============================================
  logSection("RESUMEN FINAL");

  log(
    `Variables de Entorno: ${envOk ? "✅ OK" : "❌ FALTANTES"}`,
    envOk ? "green" : "red"
  );
  log(
    `Conexión Supabase: ${supabaseOk ? "✅ OK" : "❌ ERROR"}`,
    supabaseOk ? "green" : "red"
  );

  if (vercelUrl) {
    log(
      `Conexión Vercel: ${vercelOk ? "✅ OK" : "❌ ERROR"}`,
      vercelOk ? "green" : "red"
    );
  } else {
    log(`Conexión Vercel: ⚪ NO VERIFICADA`, "reset");
  }

  log("\n📝 PRÓXIMOS PASOS:", "cyan");

  if (!envOk) {
    log("   1. Configura las variables de entorno en .env.local", "yellow");
  }

  if (!supabaseOk) {
    log("   2. Verifica las credenciales de Supabase", "yellow");
    log("   3. Asegúrate de que el proyecto de Supabase esté activo", "yellow");
  }

  if (vercelUrl && !vercelOk) {
    log("   4. Verifica que el deploy en Vercel esté completo", "yellow");
    log("   5. Revisa los logs de Vercel para errores", "yellow");
  }

  log("\n💡 TIPS:", "cyan");
  log("   - Ejecuta 'npm run dev' para probar localmente", "blue");
  log(
    "   - Visita /api/health/supabase para verificar desde el navegador",
    "blue"
  );
  log("   - Revisa la documentación en docs/ para más información", "blue");

  console.log("\n");
}

// Ejecutar
main().catch((error) => {
  log(`\n❌ Error fatal: ${error.message}`, "red");
  process.exit(1);
});

