import { expect, test } from '@playwright/test';
import { answerCards, fillWelcomeForm, goToWelcome, submitWelcomeForm } from './helpers';

/**
 * T072: flujo completo US1→US4 (alias → tema → tablero → 6 respuestas →
 * resultados) contra el modo `local` (mock, sin IA real ni red externa).
 *
 * Nota sobre el caso de error de IA (FR-003): en modo `local`, `QuestionGateway`
 * es `QuestionMockService`, que siempre resuelve con éxito (no hay un punto de
 * inyección de fallos sin acoplar código de producción a necesidades de test).
 * El camino de error de `WelcomePage.onBuildError` (mensaje genérico y
 * `GeminiRequestLimitExceededError`) ya está cubierto de forma determinista a
 * nivel de componente en `welcome.page.spec.ts` (mocks de `BuildMatchUsecase`
 * con `throwError`), lo cual es más confiable que un e2e contra Gemini real
 * (no determinista, requiere credenciales live). Ver research.md para el
 * detalle de esta decisión.
 */
test.describe('Flujo completo de partida (US1→US4)', () => {
  test('alias → tema → tablero → 6 respuestas → resultados', async ({ page }) => {
    await goToWelcome(page);
    await fillWelcomeForm(page, 'JugadorE2E', 'Historia universal');
    await submitWelcomeForm(page);

    await expect(page.locator('.tg-board-page')).toBeVisible();
    await expect(page.locator('.tg-question-card__button')).toHaveCount(12);

    await answerCards(page, 6);

    await page.waitForURL('**/results');
    await expect(page.locator('.tg-results-page__score')).toContainText('Puntaje total');
    await expect(page.locator('.tg-results-page__alias')).toContainText('JugadorE2E');
    await expect(page.locator('#results-play-again-button')).toBeVisible();
  });

  test('"Jugar de nuevo" vuelve a welcome con el alias prellenado', async ({ page }) => {
    await goToWelcome(page);
    await fillWelcomeForm(page, 'OtroJugador', 'Cine');
    await submitWelcomeForm(page);
    await answerCards(page, 6);
    await page.waitForURL('**/results');

    await page.locator('#results-play-again-button').click();

    await page.waitForURL('**/welcome*');
    await expect(page.locator('#welcome-alias-input')).toHaveValue('OtroJugador');
  });
});
