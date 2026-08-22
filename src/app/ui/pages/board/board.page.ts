import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { CardModel, MatchModel } from '../../../domain/models/match/match.model';
import { AnswerCardUsecase } from '../../../domain/models/match/usecase/answer-card.usecase';
import { CurrentMatchStore } from '../../../shared/foundational/state/current-match.store';
import { MatchStoreService } from '../../../shared/foundational/state/match-store.service';
import { QuestionCard } from '../../components/question-card/question-card';
import { QuestionModal, QuestionModalFeedback } from '../../components/question-modal/question-modal';
import { ScoreBoard } from '../../components/score-board/score-board';

/** Tiempo que se muestra el feedback (correcto/incorrecto) antes de cerrar el modal (FR-016). */
export const ANSWER_FEEDBACK_DISPLAY_MS = 1_500;

/**
 * Página del tablero (US2): muestra las 12 tarjetas de la partida en curso,
 * abre el modal de pregunta al seleccionar una tarjeta boca abajo, valida y
 * aplica la respuesta mediante `AnswerCardUsecase`, y navega a `/results`
 * automáticamente al completarse la sexta respuesta (FR-012).
 */
@Component({
  selector: 'tg-board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestionCard, QuestionModal, ScoreBoard],
  templateUrl: './board.page.html',
})
export class BoardPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly currentMatchStore = inject(CurrentMatchStore);
  private readonly matchStore = inject(MatchStoreService);
  private readonly answerCardUsecase = inject(AnswerCardUsecase);
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  readonly match = this.currentMatchStore.match;
  readonly liveScore = this.matchStore.liveScore;
  readonly activeCardId = signal<string | null>(null);
  readonly feedback = signal<QuestionModalFeedback>(null);

  readonly activeCard = computed<CardModel | null>(() => {
    const id = this.activeCardId();
    if (!id) {
      return null;
    }
    return this.match()?.cards.find((card) => card.id === id) ?? null;
  });

  ngOnInit(): void {
    if (!this.match()) {
      this.router.navigateByUrl('/welcome');
    }
  }

  ngOnDestroy(): void {
    this.clearFeedbackTimer();
  }

  categoryLabel(card: CardModel): string {
    if (card.question.source === QuestionSource.Galatea) {
      return 'Galatea';
    }
    return this.match()?.player.chosenTopic ?? '';
  }

  openCard(cardId: string): void {
    const match = this.match();
    if (!match || this.activeCardId()) {
      return;
    }

    const result = this.matchStore.openCard(cardId);
    if (!result.ok) {
      return;
    }

    const updatedCards = match.cards.map((card) =>
      card.id === cardId ? { ...card, state: 'flipped' as const } : card,
    );
    this.currentMatchStore.setMatch({ ...match, cards: updatedCards });
    this.activeCardId.set(cardId);
  }

  confirmAnswer(selectedOptionIndex: number): void {
    const match = this.match();
    const cardId = this.activeCardId();
    if (!match || !cardId) {
      return;
    }

    const updatedMatch = this.answerCardUsecase.answer(match, cardId, selectedOptionIndex);
    const answeredCard = updatedMatch.cards.find((card) => card.id === cardId);
    const isCorrect = answeredCard?.result === 'correct';

    this.currentMatchStore.setMatch(updatedMatch);
    this.matchStore.confirmAnswer(cardId, String(selectedOptionIndex), isCorrect);
    this.feedback.set(isCorrect ? 'correct' : 'incorrect');

    this.clearFeedbackTimer();
    this.feedbackTimer = setTimeout(() => this.closeModal(updatedMatch), ANSWER_FEEDBACK_DISPLAY_MS);
  }

  private closeModal(match: MatchModel): void {
    this.activeCardId.set(null);
    this.feedback.set(null);

    if (match.status === 'completed') {
      this.router.navigateByUrl('/results');
    }
  }

  private clearFeedbackTimer(): void {
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
  }
}
