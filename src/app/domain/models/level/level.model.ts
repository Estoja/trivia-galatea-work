export enum LevelTier {
  Visitante = 'visitante',
  Explorador = 'explorador',
  Aprendiz = 'aprendiz',
  Constructor = 'constructor',
  Estratega = 'estratega',
  MaestroGalatea = 'maestro-galatea',
  UnicornioGalatea = 'unicornio-galatea',
}

export interface LevelModel {
  tier: LevelTier;
  /** Título visible en pantalla, ej. "Unicornio Galatea 🦄" */
  title: string;
  minScore: number;
  maxScore: number;
}
