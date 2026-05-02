import { defineConfig, devices } from '@playwright/test';

/**
 * Para ejecutar los tests E2E:
 * 1. php artisan serve --port=8000   (en una terminal separada)
 * 2. npm run test:e2e
 */
export default defineConfig({
    testDir: './tests/E2E',
    fullyParallel: false, // secuencial — los tests comparten BD
    forbidOnly: !!process.env['CI'],
    retries: 0,
    workers: 1,
    reporter: 'list',

    use: {
        baseURL: 'http://localhost:8000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        actionTimeout: 10_000,
        navigationTimeout: 15_000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Sin webServer: el desarrollador levanta `php artisan serve` antes de correr los tests.
    // Esto evita problemas de detección de proceso en Windows.
});
