import { expect, test } from '@playwright/test';
import { answerNextCard, fillWelcomeForm, goToWelcome, submitWelcomeForm } from './helpers';

/**
 * T085: verifica FR-023 (recargar/cerrar durante una partida activa inicia una
 * partida nueva en `welcome` sin restaurar progreso) y FR-029 (advertencia
 * nativa `beforeunload` cuando hay al menos 1 tarjeta respondida).
 *
 * El estado de la partida vive únicamente en memoria (Signals de
 * `MatchStoreService`/`CurrentMatchStore`, sin persistencia en `sessionStorage`/
 * `localStorage`), por lo que una recarga real del navegador siempre lo
 * destruye; los guards `ngOnInit` de `BoardPage`/`ResultsPage` (ya cubiertos en
 * `board.page.spec.ts`/`results.page.spec.ts`) redirigen a `/welcome` cuando no
 * hay partida en curso.
 */
test.describe('Reinicio de partida ante recarga (FR-023/FR-029)', () => {
  test('recargar el tablero sin responder ninguna tarjeta no muestra advertencia y reinicia a welcome', async ({
    page,
  }) => {
    await goToWelcome(page);
    await fillWelcomeForm(page, 'SinResponder', 'Geografía');
    await submitWelcomeForm(page);

    let dialogShown = false;
    page.on('dialog', (dialog) => {
      dialogShown = true;
      void dialog.dismiss();
    });

    await page.reload();

    expect(dialogShown).toBe(false);
    await page.waitForURL('**/welcome');
    // Sin progreso restaurado: el alias no debe quedar prellenado (no vino de "Jugar de nuevo").
    await expect(page.locator('#welcome-alias-input')).toHaveValue('');
  });

  test('recargar el tablero tras responder al menos 1 tarjeta muestra la advertencia beforeunload y, al confirmar, reinicia a welcome sin progreso', async ({
    page,
  }) => {
    await goToWelcome(page);
    await fillWelcomeForm(page, 'ConProgreso', 'Cine');
    await submitWelcomeForm(page);

    await answerNextCard(page);

    let dialogShown = false;
    page.on('dialog', (dialog) => {
      dialogShown = true;
      void dialog.accept();
    });

    await page.reload();

    expect(dialogShown).toBe(true);
    await page.waitForURL('**/welcome');
    await expect(page.locator('.tg-board-page')).toHaveCount(0);
    await expect(page.locator('#welcome-alias-input')).toHaveValue('');
  });
});
