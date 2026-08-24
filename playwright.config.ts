import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright (T072/T085/T087/T069). Los tests e2e corren
 * contra `ng serve --configuration local` (composición mock, sin llamadas
 * reales a Firebase/Gemini) para que el flujo completo alias→tema→tablero→
 * resultados sea determinista y no dependa de credenciales ni de red externa.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start:e2e',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
