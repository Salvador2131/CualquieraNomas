/**
 * Script para verificar que la aplicación está corriendo en Vercel
 * Uso: node scripts/verificar-vercel.js <URL_DE_VERCEL>
 */

const https = require("https");
const http = require("http");

const url = process.argv[2];

if (!url) {
  console.error("❌ Error: Proporciona la URL de Vercel");
  console.log(
    "Uso: node scripts/verificar-vercel.js https://tu-proyecto.vercel.app"
  );
  process.exit(1);
}

const urlObj = new URL(url);
const client = urlObj.protocol === "https:" ? https : http;

console.log(`🔍 Verificando: ${url}\n`);

const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
  path: urlObj.pathname,
  method: "GET",
  timeout: 10000,
};

const req = client.request(options, (res) => {
  console.log(`✅ Estado HTTP: ${res.statusCode}`);
  console.log(`✅ Headers:`, res.headers["content-type"]);

  if (
    res.statusCode === 200 ||
    res.statusCode === 301 ||
    res.statusCode === 302
  ) {
    console.log("\n✅ La aplicación está corriendo en Vercel");
    process.exit(0);
  } else {
    console.log(
      `\n⚠️  La aplicación responde pero con código ${res.statusCode}`
    );
    process.exit(1);
  }
});

req.on("error", (error) => {
  console.error(`❌ Error al conectar: ${error.message}`);
  console.error(
    "   Verifica que la URL sea correcta y que el deploy esté completo"
  );
  process.exit(1);
});

req.on("timeout", () => {
  console.error("❌ Timeout: La aplicación no responde");
  req.destroy();
  process.exit(1);
});

req.end();
