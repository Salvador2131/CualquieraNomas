import { SeleniumHelpers } from './selenium-helpers';
import { WebDriver } from 'selenium-webdriver';

/**
 * Helpers específicos para aplicaciones Next.js
 * Extiende SeleniumHelpers con funcionalidades específicas de Next.js
 */
export class NextJSHelpers extends SeleniumHelpers {
  constructor(driver: WebDriver) {
    super(driver);
  }

  /**
   * Espera a que Next.js termine de hidratar (cargar JavaScript)
   * Next.js agrega atributos específicos cuando está listo
   * 
   * @param timeout - Tiempo máximo de espera en milisegundos
   */
  async waitForNextJSReady(timeout: number = 10000): Promise<void> {
    // Esperar a que el documento esté completamente cargado
    await this.driver.wait(async () => {
      const readyState = await this.executeScript<string>('return document.readyState');
      return readyState === 'complete';
    }, timeout);

    // Esperar un momento adicional para que React termine de renderizar
    // Next.js puede tardar un poco en hidratar los componentes
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Navega a una ruta de Next.js y espera a que esté lista
   * 
   * @param route - Ruta de Next.js (ej: '/dashboard', '/auth/login')
   */
  async navigateToRoute(route: string): Promise<void> {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await this.navigateTo(`${baseUrl}${route}`);
    await this.waitForNextJSReady();
  }

  /**
   * Espera a que un componente de React esté renderizado
   * Útil para componentes que se cargan dinámicamente
   * 
   * @param selector - Selector CSS del componente
   * @param timeout - Tiempo máximo de espera en milisegundos
   */
  async waitForReactComponent(selector: string, timeout: number = 10000): Promise<void> {
    await this.waitForElement(selector, timeout);
    // Esperar a que React termine de renderizar y el elemento sea visible
    await this.driver.wait(async () => {
      try {
        const element = await this.driver.findElement({ css: selector });
        const isDisplayed = await element.isDisplayed();
        return isDisplayed;
      } catch {
        return false;
      }
    }, timeout);
  }

  /**
   * Hacer clic en un Link de Next.js
   * Next.js usa navegación del lado del cliente, así que esperamos
   * a que la navegación termine antes de continuar
   * 
   * @param selector - Selector CSS del link
   */
  async clickNextLink(selector: string): Promise<void> {
    await this.clickElement(selector);
    // Esperar a que Next.js complete la navegación del lado del cliente
    await this.waitForNextJSReady();
  }

  /**
   * Verificar que estamos en una ruta específica de Next.js
   * 
   * @param expectedRoute - Ruta esperada (ej: '/dashboard')
   * @returns Promise<boolean> - true si estamos en la ruta correcta
   */
  async verifyRoute(expectedRoute: string): Promise<boolean> {
    const currentUrl = await this.getCurrentUrl();
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    return currentUrl.includes(`${baseUrl}${expectedRoute}`);
  }

  /**
   * Espera a que Next.js complete una transición de página
   * Útil después de hacer clic en links o botones que navegan
   * 
   * @param expectedRoute - Ruta esperada después de la navegación
   * @param timeout - Tiempo máximo de espera en milisegundos
   */
  async waitForRouteChange(expectedRoute: string, timeout: number = 10000): Promise<void> {
    await this.waitForUrl(expectedRoute, timeout);
    await this.waitForNextJSReady();
  }

  /**
   * Verifica que un componente de React está completamente hidratado
   * Revisa que no hay errores de hidratación en la consola
   * 
   * @returns Promise<boolean> - true si no hay errores de hidratación
   */
  async checkHydrationErrors(): Promise<boolean> {
    const logs = await this.driver.manage().logs().get('browser');
    const hydrationErrors = logs.filter(log => 
      log.message.includes('hydration') || 
      log.message.includes('Hydration failed')
    );
    return hydrationErrors.length === 0;
  }

  /**
   * Espera a que un elemento tenga un atributo data-* específico
   * Útil para componentes de Next.js que usan data attributes
   * 
   * @param selector - Selector CSS del elemento
   * @param attribute - Nombre del atributo data (sin el prefijo 'data-')
   * @param expectedValue - Valor esperado del atributo
   * @param timeout - Tiempo máximo de espera en milisegundos
   */
  async waitForDataAttribute(
    selector: string, 
    attribute: string, 
    expectedValue: string, 
    timeout: number = 10000
  ): Promise<void> {
    await this.driver.wait(async () => {
      try {
        const element = await this.waitForElement(selector, timeout);
        const value = await element.getAttribute(`data-${attribute}`);
        return value === expectedValue;
      } catch {
        return false;
      }
    }, timeout);
  }
}


