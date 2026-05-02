import { test, expect } from '@playwright/test';

test.describe('E2E-04: Partner ve su dashboard (UI)', () => {

    test('GET /partner devuelve 200 y el HTML de la SPA', async ({ request }) => {
        // El dashboard del partner es una SPA — verificamos que el servidor
        // sirva el HTML correcto sin error 500
        const res = await request.get('http://localhost:8000/partner');
        expect(res.ok()).toBeTruthy();
        const html = await res.text();
        expect(html).toContain('<div id="root">');
    });

    test('la app React carga el index HTML sin errores JS críticos', async ({ page }) => {
        const jsErrors: string[] = [];
        page.on('pageerror', (err) => jsErrors.push(err.message));

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Sin errores JS críticos de inicialización
        const criticalErrors = jsErrors.filter(
            (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error')
        );
        expect(criticalErrors).toHaveLength(0);
    });

    test('el servidor sirve el blade con el div#root y el título correcto', async ({ request }) => {
        const res = await request.get('http://localhost:8000/');
        expect(res.ok()).toBeTruthy();
        const html = await res.text();
        expect(html).toContain('<div id="root">');
        expect(html).toContain('CanchasApp');
    });
});
