import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CbButton } from '@bancolombia/caribe-design-system/button';
import { CbCircleLoading } from '@bancolombia/caribe-design-system/circle-loading';
import { CbInput, InputFieldConfig, InputType } from '@bancolombia/caribe-design-system/input';
import { CbLoader } from '@bancolombia/caribe-design-system/loader';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { MatchModel } from '../../../domain/models/match/match.model';
import { BuildMatchUsecase } from '../../../domain/models/match/usecase/build-match.usecase';
import { validateTopicSafety } from '../../../infrastructure/gemini/topic-safety-policy';
import { CardState } from '../../../shared/foundational/state/match-store.port';
import { MatchStoreService } from '../../../shared/foundational/state/match-store.service';
import { CurrentMatchStore } from '../../../shared/foundational/state/current-match.store';

/** Retardo antes de mostrar el mensaje adicional de carga (FR-017). */
export const LOADING_MESSAGE_DELAY_MS = 2_000;

const GENERIC_BUILD_ERROR_MESSAGE =
  'No pudimos generar tus preguntas en este momento. Intenta nuevamente en unos segundos.';

/** Mensaje mostrado cuando el navegador reporta pérdida de conectividad (FR-025). */
export const OFFLINE_BUILD_ERROR_MESSAGE =
  'Perdiste la conexión a internet. Verifica tu red e intenta nuevamente.';

@Component({
  selector: 'tg-welcome-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CbInput, CbButton, CbLoader, CbCircleLoading],
  templateUrl: './welcome.page.html',
  styleUrl: './welcome.page.scss',
})
export class WelcomePage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly buildMatchUsecase = inject(BuildMatchUsecase);
  private readonly matchStore = inject(MatchStoreService);
  private readonly currentMatchStore = inject(CurrentMatchStore);
  private loadingMessageTimer: ReturnType<typeof setTimeout> | null = null;

  readonly form = new FormGroup({
    alias: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(30)],
    }),
    topic: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(60)],
    }),
  });

  readonly aliasInputConfig: InputFieldConfig = {
    idInput: 'welcome-alias-input',
    type: InputType.TEXT,
    label: 'Tu alias',
    placeholder: 'Ej: JugadorPro',
    limitCharacters: 30,
  };

  readonly topicInputConfig: InputFieldConfig = {
    idInput: 'welcome-topic-input',
    type: InputType.TEXT,
    label: 'Tema libre',
    placeholder: 'Ej: Fútbol, cine, historia...',
    limitCharacters: 60,
  };

  readonly isSubmitting = signal(false);
  readonly showLoadingMessage = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const prefilledAlias = this.route.snapshot.queryParamMap.get('alias');
    if (prefilledAlias) {
      this.form.controls.alias.setValue(prefilledAlias);
    }
  }

  ngOnDestroy(): void {
    this.clearLoadingMessageTimer();
  }

  submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const alias = this.form.controls.alias.value.trim();
    const topic = this.normalizeTopic(this.form.controls.topic.value);

    const topicSafety = validateTopicSafety(topic);
    if (!topicSafety.ok) {
      this.errorMessage.set(topicSafety.message);
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    this.scheduleLoadingMessage();

    this.buildMatchUsecase.build({ alias, chosenTopic: topic }).subscribe({
      next: (match) => this.onMatchBuilt(match, alias, topic),
      error: (error: unknown) => this.onBuildError(error),
    });
  }

  retry(): void {
    this.errorMessage.set(null);
    this.submit();
  }

  private normalizeTopic(topic: string): string {
    return topic.trim().replace(/\s+/g, ' ');
  }

  private scheduleLoadingMessage(): void {
    this.showLoadingMessage.set(false);
    this.clearLoadingMessageTimer();
    this.loadingMessageTimer = setTimeout(() => this.showLoadingMessage.set(true), LOADING_MESSAGE_DELAY_MS);
  }

  private clearLoadingMessageTimer(): void {
    if (this.loadingMessageTimer) {
      clearTimeout(this.loadingMessageTimer);
      this.loadingMessageTimer = null;
    }
  }

  private onMatchBuilt(match: MatchModel, alias: string, topic: string): void {
    this.clearLoadingMessageTimer();
    this.currentMatchStore.setMatch(match);
    this.matchStore.initializeSession(alias, topic);
    this.matchStore.setQuestions(this.toCardStates(match));
    this.isSubmitting.set(false);
    this.showLoadingMessage.set(false);
    this.router.navigateByUrl('/board');
  }

  /**
   * Maneja cualquier error emitido por `buildMatchUsecase.build(...)` — incluida
   * la pérdida de conectividad antes de que el tablero esté activo (FR-025):
   * como `onMatchBuilt` nunca se invoca, ni `currentMatchStore.setMatch` ni
   * `matchStore.initializeSession`/`setQuestions` llegan a ejecutarse, por lo
   * que el estado queda limpio (no hay partida a medio construir) y el jugador
   * permanece en `welcome` con su alias ya escrito en el formulario.
   */
  private onBuildError(_error: unknown): void {
    this.clearLoadingMessageTimer();
    this.isSubmitting.set(false);
    this.showLoadingMessage.set(false);

    this.errorMessage.set(navigator.onLine ? GENERIC_BUILD_ERROR_MESSAGE : OFFLINE_BUILD_ERROR_MESSAGE);
  }

  private toCardStates(match: MatchModel): CardState[] {
    return match.cards.map((card) => ({
      id: card.id,
      category: card.question.source === QuestionSource.Galatea ? ('galatea' as const) : ('chosen-topic' as const),
      state: 'faceDown' as const,
    }));
  }
}
