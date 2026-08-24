import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { MatchStoreService } from './shared/foundational/state/match-store.service';

/**
 * Rutas en las que NUNCA debe mostrarse la advertencia de `beforeunload`
 * (FR-029): `welcome` (inicio de una partida nueva) y `results` (la partida
 * ya terminó y su resultado quedó fijado, no hay progreso "en curso" que perder).
 */
const RESET_ROUTE_PREFIXES = ['/welcome', '/results'] as const;

@Component({
  selector: 'tg-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly matchStore = inject(MatchStoreService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentUrl = signal(this.router.url);

  /**
   * Handler nativo de `beforeunload` (FR-029): al menos un navegador
   * (Chrome/Firefox) requiere `preventDefault()` y/o `returnValue` asignado
   * para mostrar su diálogo de confirmación nativo estándar.
   */
  private readonly handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    event.preventDefault();
    event.returnValue = '';
  };

  constructor() {
    this.router.events
      .pipe(
        filter((routerEvent): routerEvent is NavigationEnd => routerEvent instanceof NavigationEnd),
      )
      .subscribe((routerEvent) => this.currentUrl.set(routerEvent.urlAfterRedirects));

    effect(() => {
      const hasAnsweredAtLeastOneCard = this.matchStore.answeredCount() >= 1;
      const isOnResetRoute = RESET_ROUTE_PREFIXES.some((prefix) => this.currentUrl().startsWith(prefix));

      if (hasAnsweredAtLeastOneCard && !isOnResetRoute) {
        window.addEventListener('beforeunload', this.handleBeforeUnload);
      } else {
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
      }
    });

    this.destroyRef.onDestroy(() => window.removeEventListener('beforeunload', this.handleBeforeUnload));
  }
}
