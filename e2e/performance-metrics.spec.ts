import { expect, test } from '@playwright/test';

/**
 * T071: aproxima Core Web Vitals (FCP, LCP, TBT) contra el modo `local` usando
 * la Performance API nativa del navegador vía CDP (sin depender de Lighthouse,
 * que no pudo instalarse en este entorno por restricciones de red del proxy
 * corporativo — ver nota en research.md). Esta es una aproximación razonable
 * y reproducible localmente, no un reemplazo exacto de un audit de Lighthouse
 * real, que sigue pendiente de ejecutarse manualmente contra un despliegue
 * accesible (ver T071 en research.md).
 */
test('Core Web Vitals aproximados de la página welcome (FCP/LCP/TBT)', async ({ page }) => {
  await page.goto('/welcome', { waitUntil: 'load' });

  // Dar tiempo a que se estabilicen las métricas post-carga (long tasks, LCP final).
  await page.waitForTimeout(1_000);

  const metrics = await page.evaluate(() => {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');

    const lcpEntries = performance.getEntriesByType(
      'largest-contentful-paint',
    ) as unknown as PerformanceEntry[];
    const lastLcp = lcpEntries.at(-1);

    const longTasks = performance.getEntriesByType('longtask');
    const totalBlockingTime = longTasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0);

    return {
      fcp: fcpEntry?.startTime ?? null,
      lcp: lastLcp?.startTime ?? null,
      tbt: totalBlockingTime,
    };
  });

  // eslint-disable-next-line no-console
  console.log('[T071] Core Web Vitals aproximados (welcome, modo local):', metrics);

  expect(metrics.fcp).not.toBeNull();
  expect(metrics.fcp as number).toBeLessThanOrEqual(1_500);
  // LCP puede no dispararse en jsdom/CDP headless si no hay imágenes/bloques de
  // texto grandes; sólo se valida el umbral cuando el navegador lo reporta.
  if (metrics.lcp !== null) {
    expect(metrics.lcp as number).toBeLessThanOrEqual(2_500);
  }
  expect(metrics.tbt).toBeLessThanOrEqual(200);
});
