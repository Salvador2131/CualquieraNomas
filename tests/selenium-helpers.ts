import { WebDriver, By, until, WebElement } from 'selenium-webdriver';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Clase de utilidades para simplificar operaciones comunes con Selenium
 */
export class SeleniumHelpers {
  constructor(private driver: WebDriver) {}

  /**
   * Espera a que un elemento sea visible y luego lo retorna
   * @param selector - Selector CSS del elemento
   * @param timeout - Tiempo máximo de espera en milisegundos
   * @returns Promise<WebElement> - El elemento encontrado
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<WebElement> {
    return await this.driver.wait(
      until.elementLocated(By.css(selector)),
      timeout,
      `Elemento ${selector} no encontrado después de ${timeout}ms`
    );
  }

  /**
   * Hace clic en un elemento después de esperar a que sea clickeable
   * @param selector - Selector CSS del elemento
   * @param timeout - Tiempo máximo de espera en milisegundos
   */
  async clickElement(selector: string, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    await element.click();
  }

  /**
   * Escribe texto en un campo de entrada
   * @param selector - Selector CSS del campo
   * @param text - Texto a escribir
   * @param timeout - Tiempo máximo de espera en milisegundos
   */
  async typeText(selector: string, text: string, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    await element.clear();
    await element.sendKeys(text);
  }

  /**
   * Obtiene el texto de un elemento
   * @param selector - Selector CSS del elemento
   * @param timeout - Tiempo máximo de espera en milisegundos
   * @returns Promise<string> - El texto del elemento
   */
  async getText(selector: string, timeout: number = 10000): Promise<string> {
    const element = await this.waitForElement(selector, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    return await element.getText();
  }

  /**
   * Verifica si un elemento existe en la página
   * @param selector - Selector CSS del elemento
   * @returns Promise<boolean> - true si existe, false si no
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.driver.findElement(By.css(selector));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Toma una captura de pantalla y la guarda
   * @param filename - Nombre del archivo (sin extensión)
   * @returns Promise<string> - Ruta del archivo guardado
   */
  async takeScreenshot(filename: string): Promise<string> {
    const screenshot = await this.driver.takeScreenshot();
    const screenshotsDir = path.join(process.cwd(), 'tests', 'screenshots');
    
    // Crear directorio si no existe
    await fs.mkdir(screenshotsDir, { recursive: true });
    
    const filepath = path.join(screenshotsDir, `${filename}.png`);
    await fs.writeFile(filepath, screenshot, 'base64');
    
    return filepath;
  }

  /**
   * Navega a una URL
   * @param url - URL a la que navegar
   */
  async navigateTo(url: string): Promise<void> {
    await this.driver.get(url);
  }

  /**
   * Obtiene el título de la página actual
   * @returns Promise<string> - Título de la página
   */
  async getPageTitle(): Promise<string> {
    return await this.driver.getTitle();
  }

  /**
   * Obtiene la URL actual
   * @returns Promise<string> - URL actual
   */
  async getCurrentUrl(): Promise<string> {
    return await this.driver.getCurrentUrl();
  }

  /**
   * Espera a que la URL cambie o contenga un texto específico
   * @param url - URL o patrón regex a esperar
   * @param timeout - Tiempo máximo de espera en milisegundos
   */
  async waitForUrl(url: string | RegExp, timeout: number = 10000): Promise<void> {
    await this.driver.wait(async () => {
      const currentUrl = await this.driver.getCurrentUrl();
      if (typeof url === 'string') {
        return currentUrl.includes(url);
      } else {
        return url.test(currentUrl);
      }
    }, timeout);
  }

  /**
   * Espera a que un elemento tenga un texto específico
   * @param selector - Selector CSS del elemento
   * @param text - Texto esperado
   * @param timeout - Tiempo máximo de espera en milisegundos
   */
  async waitForText(selector: string, text: string, timeout: number = 10000): Promise<void> {
    await this.driver.wait(async () => {
      const element = await this.waitForElement(selector, timeout);
      const elementText = await element.getText();
      return elementText.includes(text);
    }, timeout);
  }

  /**
   * Obtiene el valor de un atributo de un elemento
   * @param selector - Selector CSS del elemento
   * @param attribute - Nombre del atributo
   * @param timeout - Tiempo máximo de espera en milisegundos
   * @returns Promise<string | null> - Valor del atributo
   */
  async getAttribute(selector: string, attribute: string, timeout: number = 10000): Promise<string | null> {
    const element = await this.waitForElement(selector, timeout);
    return await element.getAttribute(attribute);
  }

  /**
   * Ejecuta JavaScript en la página
   * @param script - Código JavaScript a ejecutar
   * @param args - Argumentos para el script
   * @returns Promise<any> - Resultado de la ejecución
   */
  async executeScript<T>(script: string, ...args: any[]): Promise<T> {
    return await this.driver.executeScript<T>(script, ...args);
  }

  /**
   * Hace scroll hasta un elemento
   * @param selector - Selector CSS del elemento
   * @param timeout - Tiempo máximo de espera en milisegundos
   */
  async scrollToElement(selector: string, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
  }

  /**
   * Espera a que un elemento sea visible
   * @param selector - Selector CSS del elemento
   * @param timeout - Tiempo máximo de espera en milisegundos
   */
  async waitForVisible(selector: string, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
  }
}


