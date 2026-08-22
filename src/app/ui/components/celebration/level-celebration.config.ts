import { LevelTier } from '../../../domain/models/level/level.model';

/** Intensidad visual creciente de confetti por nivel (research.md §5). */
export type ConfettiIntensity = 'none' | 'low' | 'medium' | 'medium-high' | 'high' | 'dense' | 'max';

export interface LevelCelebrationConfig {
  /**
   * Token de color Caribe (`--cb-sys-status-*-fill`) usado como acento
   * visual del nivel. Nota: se reutilizan tokens semánticos de estado
   * (p.ej. `error-fill`, `alert-fill`) únicamente por su valor de color, sin
   * implicar un estado de error/alerta real.
   */
  colorToken: string;
  confettiIntensity: ConfettiIntensity;
  /** Clase CSS de animación aplicada cuando el usuario NO tiene `prefers-reduced-motion`. */
  animationClass: string;
  emoji: string | null;
  /** Texto estático mostrado en lugar de la animación cuando `prefers-reduced-motion: reduce` (Principio VIII). */
  reducedMotionLabel: string;
}

/**
 * Configuración declarativa de celebración por nivel (T064). Cada uno de
 * los 7 niveles tiene un color, intensidad de confetti y animación
 * distintos de su nivel adyacente (SC-006).
 */
export const LEVEL_CELEBRATION_CONFIG: Record<LevelTier, LevelCelebrationConfig> = {
  [LevelTier.Visitante]: {
    colorToken: 'var(--cb-sys-status-neutral-fill)',
    confettiIntensity: 'none',
    animationClass: 'tg-celebration--sobria',
    emoji: null,
    reducedMotionLabel: 'Nivel Visitante',
  },
  [LevelTier.Explorador]: {
    colorToken: 'var(--cb-sys-status-info-fill)',
    confettiIntensity: 'low',
    animationClass: 'tg-celebration--confetti-ligero',
    emoji: '✨',
    reducedMotionLabel: 'Nivel Explorador',
  },
  [LevelTier.Aprendiz]: {
    colorToken: 'var(--cb-sys-status-success-fill)',
    confettiIntensity: 'medium',
    animationClass: 'tg-celebration--confetti-medio',
    emoji: '🎉',
    reducedMotionLabel: 'Nivel Aprendiz',
  },
  [LevelTier.Constructor]: {
    colorToken: 'var(--cb-sys-status-alert-fill)',
    confettiIntensity: 'medium-high',
    animationClass: 'tg-celebration--confetti-alto',
    emoji: '🎉',
    reducedMotionLabel: 'Nivel Constructor',
  },
  [LevelTier.Estratega]: {
    colorToken: 'var(--cb-sys-status-error-fill)',
    confettiIntensity: 'high',
    animationClass: 'tg-celebration--trofeo',
    emoji: '🏆',
    reducedMotionLabel: 'Nivel Estratega',
  },
  [LevelTier.MaestroGalatea]: {
    colorToken: 'var(--cb-sys-status-color-b-fill)',
    confettiIntensity: 'dense',
    animationClass: 'tg-celebration--brillo',
    emoji: '🌟',
    reducedMotionLabel: 'Nivel Maestro Galatea',
  },
  [LevelTier.UnicornioGalatea]: {
    colorToken: 'var(--cb-sys-status-color-a-fill)',
    confettiIntensity: 'max',
    animationClass: 'tg-celebration--unicornio',
    emoji: '🦄',
    reducedMotionLabel: 'Nivel Unicornio Galatea',
  },
};
