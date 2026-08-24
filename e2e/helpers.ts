import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Helpers compartidos por los tests e2e (T069/T072/T085/T087). Encapsulan los
 * pasos del flujo US1→US4 contra el modo `local` (mock, sin IA real) para
 * evitar duplicar selectores/temporizaciones en cada spec.
 */

/** Debe coincidir con `ANSWER_FEEDBACK_DISPLAY_MS` en board.page.ts (FR-016). */
const ANSWER_FEEDBACK_DISPLAY_MS = 1_500;

export async function goToWelcome(page: Page): Promise<void> {
  await page.goto('/welcome');
}

export async function fillWelcomeForm(page: Page, alias: string, topic: string): Promise<void> {
  await page.locator('#welcome-alias-input').fill(alias);
  await page.locator('#welcome-topic-input').fill(topic);
}

export async function submitWelcomeForm(page: Page): Promise<void> {
  await page.locator('#welcome-submit-button').click();
  await page.waitForURL('**/board');
}

/** Abre la primera tarjeta no respondida, selecciona `optionIndex` y confirma. */
export async function answerNextCard(page: Page, optionIndex = 0): Promise<void> {
  const card: Locator = page.locator('.tg-question-card__button:not([disabled])').first();
  await card.click();

  const modal = page.locator('.tg-question-modal__panel');
  await expect(modal).toBeVisible();

  await modal.locator('.tg-question-modal__option').nth(optionIndex).click();
  await modal.locator('.tg-question-modal__confirm').click();

  // El modal permanece abierto ANSWER_FEEDBACK_DISPLAY_MS mostrando feedback (FR-016).
  await expect(modal).toBeHidden({ timeout: ANSWER_FEEDBACK_DISPLAY_MS + 2_000 });
}

/** Responde `count` tarjetas (por defecto las 6 requeridas, FR-012). */
export async function answerCards(page: Page, count = 6): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await answerNextCard(page);
  }
}

export async function playFullMatch(page: Page, alias: string, topic: string): Promise<void> {
  await goToWelcome(page);
  await fillWelcomeForm(page, alias, topic);
  await submitWelcomeForm(page);
  await answerCards(page, 6);
  await page.waitForURL('**/results');
}
