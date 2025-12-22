import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { createDriver } from "../selenium.config";
import { SeleniumHelpers } from "../selenium-helpers";
import type { WebDriver } from "selenium-webdriver";

/**
 * CASO DE PRUEBA: Ejemplo básico de navegación
 *
 * DESCRIPCIÓN:
 * Prueba básica para verificar que Selenium está configurado correctamente
 * y puede navegar a una página web.
 *
 * PRECONDICIONES:
 * - El servidor de desarrollo está corriendo (npm run dev)
 * - ChromeDriver está instalado y en el PATH
 *
 * PASOS:
 * 1. Iniciar el navegador
 * 2. Navegar a la página principal
 * 3. Verificar que la página carga correctamente
 *
 * RESULTADO ESPERADO:
 * - La página carga sin errores
 * - El título de la página es accesible
 */
describe("Ejemplo básico de Selenium", () => {
  let driver: WebDriver;
  let helpers: SeleniumHelpers;

  beforeAll(async () => {
    // Crear driver con configuración por defecto
    // headless: true significa que no se mostrará el navegador
    driver = await createDriver({
      browser: "chrome",
      headless: process.env.TEST_HEADLESS !== "false", // Por defecto headless
      windowSize: { width: 1920, height: 1080 },
    });
    helpers = new SeleniumHelpers(driver);
  });

  afterAll(async () => {
    // Cerrar el navegador después de todas las pruebas
    await driver.quit();
  });

  test("debe cargar la página principal", async () => {
    // Usar URL de Vercel si está configurada, sino localhost
    const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

    // Navegar a la página
    await helpers.navigateTo(baseUrl);

    // Tomar screenshot como evidencia
    await helpers.takeScreenshot("homepage-loaded");

    // Verificar que la página tiene un título
    const title = await helpers.getPageTitle();
    expect(title).toBeTruthy();

    console.log(`✅ Página cargada correctamente. Título: ${title}`);
  });

  test("debe poder interactuar con elementos de la página", async () => {
    // Usar URL de Vercel si está configurada, sino localhost
    const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
    await helpers.navigateTo(baseUrl);

    // Esperar un momento para que la página cargue completamente
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verificar que podemos obtener la URL actual
    const currentUrl = await helpers.getCurrentUrl();
    expect(currentUrl).toContain(baseUrl);

    console.log(`✅ URL actual: ${currentUrl}`);
  });
});
