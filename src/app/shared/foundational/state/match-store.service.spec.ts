import { MatchStoreService } from './match-store.service';

describe('MatchStoreService', () => {
  let store: MatchStoreService;

  beforeEach(() => {
    store = new MatchStoreService();
    store.initializeSession('alias', 'topic');
    store.setQuestions(
      Array.from({ length: 8 }, (_, idx) => ({
        id: `c${idx + 1}`,
        category: idx < 4 ? 'galatea' : 'chosen-topic',
        state: 'faceDown' as const,
      })),
    );
  });

  it('should keep a single active card', () => {
    expect(store.openCard('c1').ok).toBe(true);
    expect(store.openCard('c2')).toEqual({ ok: false, reason: 'already-active' });
  });

  it('should cap answers at six', () => {
    for (let i = 1; i <= 6; i += 1) {
      expect(store.openCard(`c${i}`).ok).toBe(true);
      expect(store.confirmAnswer(`c${i}`, 'opt', true).ok).toBe(true);
    }
    expect(store.openCard('c7').ok).toBe(true);
    expect(store.confirmAnswer('c7', 'opt', true)).toEqual({
      ok: false,
      reason: 'max-answers-reached',
    });
  });

  it('should move card state from faceDown to flipped to answered', () => {
    expect(store.openCard('c1').ok).toBe(true);
    expect(store.confirmAnswer('c1', 'opt', true).ok).toBe(true);
    expect(store.answeredCount()).toBe(1);
  });

  it('should derive answeredCount from confirmed answers only', () => {
    expect(store.answeredCount()).toBe(0);
    store.openCard('c1');
    store.confirmAnswer('c1', 'opt', true);
    store.openCard('c2');
    store.confirmAnswer('c2', 'opt', false);
    expect(store.answeredCount()).toBe(2);
  });

  it('should derive isMatchComplete as false before six answers and true at six', () => {
    for (let i = 1; i <= 5; i += 1) {
      store.openCard(`c${i}`);
      store.confirmAnswer(`c${i}`, 'opt', true);
    }
    expect(store.isMatchComplete()).toBe(false);

    store.openCard('c6');
    store.confirmAnswer('c6', 'opt', true);
    expect(store.isMatchComplete()).toBe(true);
  });

  it('should derive liveScore as 10 points per correct answer, ignoring incorrect ones', () => {
    store.openCard('c1');
    store.confirmAnswer('c1', 'opt', true);
    store.openCard('c2');
    store.confirmAnswer('c2', 'opt', false);
    store.openCard('c3');
    store.confirmAnswer('c3', 'opt', true);

    expect(store.liveScore()).toBe(20);
  });
}
);