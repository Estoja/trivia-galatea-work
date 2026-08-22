import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CbButton } from '@bancolombia/caribe-design-system/button';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { CardModel } from '../../../domain/models/match/match.model';
import { AssignLevelUsecase } from '../../../domain/models/level/usecase/assign-level.usecase';
import { CalculateMatchScoreUsecase } from '../../../domain/models/match/usecase/calculate-match-score.usecase';
import { CurrentMatchStore } from '../../../shared/foundational/state/current-match.store';
import { MatchStoreService } from '../../../shared/foundational/state/match-store.service';
import { Celebration } from '../../components/celebration/celebration';

/**
 * Página de resultados (US4): al completar las 6 preguntas, muestra el
 * alias, el puntaje total, el título de nivel obtenido (con celebración
 * acorde), el desglose de respuestas por categoría (FR-013, Escenario 5), y
 * permite iniciar una nueva partida conservando el alias (FR-015).
 */
@Component({
  selector: 'tg-results-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Celebration, CbButton],
  templateUrl: './results.page.html',
})
export class ResultsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly currentMatchStore = inject(CurrentMatchStore);
  private readonly matchStore = inject(MatchStoreService);
  private readonly calculateMatchScore = inject(CalculateMatchScoreUsecase);
  private readonly assignLevel = inject(AssignLevelUsecase);

  readonly match = this.currentMatchStore.match;
  readonly playerAlias = this.matchStore.playerAlias;

  readonly answeredCards = computed<CardModel[]>(
    () => this.match()?.cards.filter((card) => card.result !== 'pending') ?? [],
  );

  readonly galateaAnsweredCount = computed(
    () => this.answeredCards().filter((card) => card.question.source === QuestionSource.Galatea).length,
  );

  readonly topicAnsweredCount = computed(
    () => this.answeredCards().filter((card) => card.question.source === QuestionSource.ChosenTopic).length,
  );

  readonly score = computed(() => {
    const cards = this.answeredCards();
    const galateaCorrectCount = cards.filter(
      (card) => card.question.source === QuestionSource.Galatea && card.result === 'correct',
    ).length;
    const topicCorrectCount = cards.filter(
      (card) => card.question.source === QuestionSource.ChosenTopic && card.result === 'correct',
    ).length;
    return this.calculateMatchScore.calculate(galateaCorrectCount, topicCorrectCount);
  });

  readonly level = computed(() => this.assignLevel.assign(this.score().totalScore));

  ngOnInit(): void {
    if (!this.match()) {
      this.router.navigateByUrl('/welcome');
    }
  }

  categoryLabel(card: CardModel): string {
    if (card.question.source === QuestionSource.Galatea) {
      return 'Galatea';
    }
    return this.match()?.player.chosenTopic ?? '';
  }

  resultLabel(card: CardModel): string {
    return card.result === 'correct' ? 'Correcta' : 'Incorrecta';
  }

  playAgain(): void {
    const alias = this.playerAlias();
    this.matchStore.resetSession();
    this.currentMatchStore.clear();
    this.router.navigate(['/welcome'], { queryParams: { alias } });
  }
}
