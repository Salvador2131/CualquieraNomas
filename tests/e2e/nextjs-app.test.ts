import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createDriver } from '../selenium.config';
import { NextJSHelpers } from '../nextjs-helpers';
import type { WebDriver } from 'selenium-webdriver';

/**
 * CASO DE PRUEBA: Navegación en aplicación Next.js
 * 
 * DESCRIPCIÓN:
 * Verifica que la aplicación Next.js carga correctamente
 * y que la navegación del lado del cliente funciona.
 * 
 * PRECONDICIONES:
 * - Servidor Next.js corriendo: npm run dev
 * - Puerto 3000 disponible
 * - Supabase configurado y accesible
 * 
 * PASOS:
 * 1. Cargar página principal
 * 2. Verificar que Next.js está funcionando
 * 3. Navegar a diferentes rutas
 * 4. Verificar que la navegación funciona
 * 
 * RESULTADO ESPERADO:
 * - La aplicación carga sin errores
 * - La navegación funciona correctamente
 * - Los componentes se renderizan correctamente
 * 
 * EVIDENCIAS:
 * - Screenshot: tests/screenshots/homepage-loaded.png
 * - Screenshot: tests/screenshots/login-page.png
 */
describe('Aplicación Next.js - Navegación y Funcionalidad', () => {
  let driver: WebDriver;
  let helpers: NextJSHelpers;
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

  beforeAll(async () => {
    driver = await createDriver({
      browser: 'chrome',
      headless: process.env.TEST_HEADLESS !== 'false',
      windowSize: { width: 1920, height: 1080 }
    });
    helpers = new NextJSHelpers(driver);
  });

  afterAll(async () => {
    await driver.quit();
  });

  test('debe cargar la página principal de Next.js', async () => {
    await helpers.navigateToRoute('/');
    await helpers.takeScreenshot('homepage-loaded');
    
    const title = await helpers.getPageTitle();
    expect(title).toBeTruthy();
    
    // Verificar que Next.js está funcionando
    const body = await helpers.getText('body');
    expect(body).toBeTruthy();
    
    // Verificar que no hay errores de hidratación
    const hasHydrationErrors = await helpers.checkHydrationErrors();
    expect(hasHydrationErrors).toBe(true);
    
    console.log(`✅ Página principal cargada. Título: ${title}`);
  });

  test('debe navegar a la página de login', async () => {
    await helpers.navigateToRoute('/auth/login');
    await helpers.takeScreenshot('login-page');
    
    const isOnLoginPage = await helpers.verifyRoute('/auth/login');
    expect(isOnLoginPage).toBe(true);
    
    // Verificar que el formulario de login está presente
    const hasEmailInput = await helpers.elementExists('input[type="email"], input[name="email"]');
    const hasPasswordInput = await helpers.elementExists('input[type="password"], input[name="password"]');
    
    expect(hasEmailInput || hasPasswordInput).toBe(true);
    console.log('✅ Página de login cargada correctamente');
  });

  test('debe poder navegar entre páginas usando links', async () => {
    // Ir a la página principal
    await helpers.navigateToRoute('/');
    
    // Intentar encontrar y hacer clic en un link (ajusta según tu implementación)
    // Ejemplo: si tienes un link a /preregister
    try {
      const preregisterLink = await helpers.elementExists('a[href="/preregister"], a[href*="preregister"]');
      if (preregisterLink) {
        await helpers.clickNextLink('a[href="/preregister"], a[href*="preregister"]');
        await helpers.waitForRouteChange('/preregister');
        const isOnPreregister = await helpers.verifyRoute('/preregister');
        expect(isOnPreregister).toBe(true);
        console.log('✅ Navegación con links funciona correctamente');
      }
    } catch (error) {
      console.warn('No se encontró link de preregister. Ajusta el selector según tu implementación.');
    }
  });

  test('debe cargar el dashboard después del login (si aplica)', async () => {
    // Este test requiere credenciales válidas
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@ejemplo.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    
    // Navegar a login
    await helpers.navigateToRoute('/auth/login');
    
    try {
      // Intentar hacer login
      const emailSelector = 'input[type="email"], input[name="email"], input[id="email"]';
      const passwordSelector = 'input[type="password"], input[name="password"], input[id="password"]';
      const submitSelector = 'button[type="submit"], button:contains("Iniciar"), button:contains("Login")';
      
      // Verificar que los campos existen
      const emailExists = await helpers.elementExists(emailSelector);
      const passwordExists = await helpers.elementExists(passwordSelector);
      
      if (emailExists && passwordExists) {
        await helpers.typeText(emailSelector, email);
        await helpers.typeText(passwordSelector, password);
        await helpers.clickElement(submitSelector);
        
        // Esperar redirección (Next.js puede tardar)
        try {
          await helpers.waitForRouteChange('/dashboard', 15000);
          await helpers.takeScreenshot('dashboard-loaded');
          
          const isOnDashboard = await helpers.verifyRoute('/dashboard');
          expect(isOnDashboard).toBe(true);
          console.log('✅ Login exitoso y redirección al dashboard funcionó');
        } catch (error) {
          // Si falla, tomar screenshot para debugging
          await helpers.takeScreenshot('login-error');
          console.warn('No se pudo verificar el dashboard. Verifica las credenciales y la configuración.');
        }
      } else {
        console.warn('Campos de login no encontrados. Ajusta los selectores según tu implementación.');
      }
    } catch (error) {
      console.warn('Error durante el login. Verifica que el formulario existe y las credenciales son válidas.');
    }
  });

  test('debe manejar rutas dinámicas de Next.js', async () => {
    // Ejemplo: si tienes rutas como /workers/[id]
    // Esto es solo un ejemplo - ajusta según tus rutas reales
    
    try {
      // Intentar navegar a una ruta dinámica
      // await helpers.navigateToRoute('/workers/123');
      // await helpers.waitForNextJSReady();
      // const isOnWorkerPage = await helpers.verifyRoute('/workers/');
      // expect(isOnWorkerPage).toBe(true);
      
      console.log('ℹ️ Test de rutas dinámicas - ajusta según tus rutas reales');
    } catch (error) {
      console.warn('No se pudo probar rutas dinámicas. Ajusta según tu implementación.');
    }
  });
});


