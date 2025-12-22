import { Builder, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as firefox from 'selenium-webdriver/firefox';
import { ServiceBuilder } from 'selenium-webdriver/chrome';

export interface SeleniumConfig {
  browser: 'chrome' | 'firefox' | 'edge';
  headless?: boolean;
  windowSize?: { width: number; height: number };
  timeout?: number;
}

/**
 * Crea una instancia de WebDriver configurada según los parámetros proporcionados
 * 
 * @param config - Configuración del navegador
 * @returns Promise<WebDriver> - Instancia del driver configurada
 */
export async function createDriver(config: SeleniumConfig = { browser: 'chrome' }): Promise<WebDriver> {
  const {
    browser = 'chrome',
    headless = process.env.TEST_HEADLESS === 'true',
    windowSize = { width: 1920, height: 1080 },
    timeout = 10000
  } = config;

  let builder = new Builder();

  if (browser === 'chrome') {
    const chromeOptions = new chrome.Options();
    if (headless) {
      chromeOptions.addArguments('--headless');
    }
    chromeOptions.addArguments(`--window-size=${windowSize.width},${windowSize.height}`);
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    
    // Usar ChromeDriver instalado vía npm
    try {
      const chromedriverPath = require('chromedriver').path;
      const service = new ServiceBuilder(chromedriverPath);
      builder = builder.forBrowser('chrome').setChromeService(service).setChromeOptions(chromeOptions);
    } catch (error) {
      // Si no se encuentra chromedriver, usar el del sistema
      builder = builder.forBrowser('chrome').setChromeOptions(chromeOptions);
    }
  } else if (browser === 'firefox') {
    const firefoxOptions = new firefox.Options();
    if (headless) {
      firefoxOptions.addArguments('--headless');
    }
    builder = builder.forBrowser('firefox').setFirefoxOptions(firefoxOptions);
  } else if (browser === 'edge') {
    // Edge usa las mismas opciones que Chrome
    const edgeOptions = new chrome.Options();
    if (headless) {
      edgeOptions.addArguments('--headless');
    }
    edgeOptions.addArguments(`--window-size=${windowSize.width},${windowSize.height}`);
    builder = builder.forBrowser('MicrosoftEdge').setChromeOptions(edgeOptions);
  }

  const driver = await builder.build();
  await driver.manage().setTimeouts({ 
    implicit: timeout,
    pageLoad: 30000,
    script: 30000
  });
  
  if (!headless) {
    await driver.manage().window().setRect({ 
      width: windowSize.width, 
      height: windowSize.height 
    });
  }

  return driver;
}


