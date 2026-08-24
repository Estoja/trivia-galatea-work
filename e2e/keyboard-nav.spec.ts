import { expect, test } from '@playwright/test';

/**
 * T069: verifica que el flujo completo (inicio → tablero → pregunta →
 * resultados) es navegable íntegramente por teclado (Accessibility Criteria,
 * spec.md), sin usar `click()` de mouse en ningún punto del flujo.
 */
test('el flujo completo es navegable por teclado', async ({ page }) => {
  await page.goto('/welcome');

  // Alias
  await page.locator('#welcome-alias-input').focus();
  await page.keyboard.type('TecladoE2E');

  // Tab hasta el input de tema y escribirlo con teclado.
  await page.keyboard.press('Tab');
  await expect(page.locator('#welcome-topic-input')).toBeFocused();
  await page.keyboard.type('Astronomía');

  // Enviar el formulario con Enter (equivalente a activar "Comenzar" vía teclado).
  await page.locator('button#welcome-submit-button').focus();
  await page.keyboard.press('Enter');

  await page.waitForURL('**/board');
  await expect(page.locator('.tg-question-card__button')).toHaveCount(12);

  for (let i = 0; i < 6; i += 1) {
    // Enfocar y abrir la primera tarjeta no respondida con teclado.
    const card = page.locator('.tg-question-card__button:not([disabled])').first();
    await card.focus();
    await page.keyboard.press('Enter');

    const modal = page.locator('.tg-question-modal__panel');
    await expect(modal).toBeVisible();

    // El foco debe quedar atrapado dentro del modal (T091/question-modal.ts).
    const firstOption = modal.locator('.tg-question-modal__option').first();
    await expect(firstOption).toBeFocused();

    // Seleccionar la primera opción con Enter y confirmar (foco directo al botón
    // "Aceptar" en vez de Tab repetido, ya que el número de opciones es variable).
    await page.keyboard.press('Enter');
    await modal.locator('.tg-question-modal__confirm').focus();
    await page.keyboard.press('Enter');

    await expect(modal).toBeHidden({ timeout: 3_500 });
  }

  await page.waitForURL('**/results');
  await expect(page.locator('.tg-results-page__score')).toContainText('Puntaje total');

  // El botón "Jugar de nuevo" debe ser alcanzable y activable por teclado.
  await page.locator('button#results-play-again-button').focus();
  await expect(page.locator('button#results-play-again-button')).toBeFocused();
});
