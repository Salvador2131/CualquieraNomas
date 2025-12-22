# Pruebas End-to-End con Selenium

Este directorio contiene las pruebas automatizadas de extremo a extremo (E2E) usando Selenium WebDriver.

## Estructura

```
tests/e2e/
  ├── example.test.ts          # Ejemplo básico de prueba
  ├── auth/                    # Pruebas de autenticación
  ├── workers/                 # Pruebas de trabajadores
  ├── dashboard/               # Pruebas del dashboard
  └── README.md                # Este archivo
```

## Ejecutar Pruebas

### Todas las pruebas
```bash
npm run test:e2e
```

### Modo watch (desarrollo)
```bash
npm run test:e2e:watch
```

### Modo headless (sin mostrar navegador)
```bash
npm run test:e2e:headless
```

## Requisitos Previos

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Instalar ChromeDriver:**
   - Descargar desde: https://chromedriver.chromium.org/downloads
   - Verificar versión de Chrome: `chrome://version/`
   - Agregar al PATH del sistema

3. **Servidor corriendo:**
   ```bash
   npm run dev
   ```

## Variables de Entorno

Puedes configurar estas variables en `.env.test`:

```env
TEST_BASE_URL=http://localhost:3000
TEST_BROWSER=chrome
TEST_HEADLESS=true
TEST_TIMEOUT=10000
```

## Screenshots

Las capturas de pantalla se guardan automáticamente en:
```
tests/screenshots/
```

## Documentación

Para más información, consulta:
- [Guía completa de Selenium](../docs/guia-selenium-completa.md)


