import { defineConfig } from "vitest/config";
import path from "path";
import { config } from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno de tests/.env.test
config({ path: resolve(__dirname, "tests", "env.test") });

export default defineConfig({
  test: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
    env: {
      // Cargar variables de entorno del archivo env.test
    },
    hookTimeout: 60000, // 60 segundos para hooks (beforeAll, afterAll)
    testTimeout: 30000, // 30 segundos para cada test
  },
});
