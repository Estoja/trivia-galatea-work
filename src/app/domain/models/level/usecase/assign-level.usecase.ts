import { Injectable } from '@angular/core';
import { LevelModel, LevelTier } from '../level.model';

/**
 * Tabla de rangos de nivel (FR-014, fuente única de verdad en
 * `specs/001-trivia-galatea-app/data-model.md#level` — no duplicar en otro
 * lugar del código).
 */
const LEVELS: ReadonlyArray<LevelModel> = [
  { tier: LevelTier.Visitante, title: 'Visitante', minScore: 0, maxScore: 59 },
  { tier: LevelTier.Explorador, title: 'Explorador', minScore: 60, maxScore: 99 },
  { tier: LevelTier.Aprendiz, title: 'Aprendiz', minScore: 100, maxScore: 129 },
  { tier: LevelTier.Constructor, title: 'Constructor', minScore: 130, maxScore: 179 },
  { tier: LevelTier.Estratega, title: 'Estratega', minScore: 180, maxScore: 239 },
  { tier: LevelTier.MaestroGalatea, title: 'Maestro Galatea', minScore: 240, maxScore: 359 },
  { tier: LevelTier.UnicornioGalatea, title: 'Unicornio Galatea 🦄', minScore: 360, maxScore: 360 },
];

/**
 * Caso de uso de dominio puro que asigna el nivel/título correspondiente a
 * un `totalScore` (FR-014), mediante rangos ordenados y no solapados.
 */
@Injectable()
export class AssignLevelUsecase {
  assign(totalScore: number): LevelModel {
    const level = LEVELS.find((tier) => totalScore >= tier.minScore && totalScore <= tier.maxScore);
    if (level) {
      return level;
    }
    return totalScore > LEVELS[LEVELS.length - 1].maxScore ? LEVELS[LEVELS.length - 1] : LEVELS[0];
  }
}
