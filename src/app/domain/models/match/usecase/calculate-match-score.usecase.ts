import { Injectable } from '@angular/core';
import { ScoreModel } from '../match.model';

/**
 * Caso de uso de dominio puro que calcula el puntaje de una partida a partir
 * de la cantidad de aciertos por categoría, aplicando el multiplicador
 * Galatea (FR-010/A-006, `specs/001-trivia-galatea-app/data-model.md#score`):
 *
 * `totalScore = (galateaCorrectCount × 10) × galateaCorrectCount + topicCorrectCount × 10`
 */
@Injectable()
export class CalculateMatchScoreUsecase {
  calculate(galateaCorrectCount: number, topicCorrectCount: number): ScoreModel {
    const galateaPoints = galateaCorrectCount * 10 * galateaCorrectCount;
    const topicPoints = topicCorrectCount * 10;

    return {
      galateaCorrectCount,
      topicCorrectCount,
      galateaPoints,
      topicPoints,
      totalScore: galateaPoints + topicPoints,
    };
  }
}
