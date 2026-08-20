import { MatchStorePort } from './match-store.port';
import { MatchStoreService } from './match-store.service';

describe('MatchStorePort contract', () => {
  let store: MatchStorePort;

  beforeEach(() => {
    store = new MatchStoreService();
    store.initializeSession('alias', 'topic');
    store.setQuestions([
      { id: 'c1', category: 'galatea', state: 'faceDown' },
      { id: 'c2', category: 'chosen-topic', state: 'faceDown' },
    ]);
  });

  it('should return already-active when opening a second card', () => {
    expect(store.openCard('c1')).toEqual({ ok: true });
    expect(store.openCard('c2')).toEqual({ ok: false, reason: 'already-active' });
  });

  it('should enforce no-active-card guard on confirmation', () => {
    expect(store.confirmAnswer('c1', 'opt')).toEqual({ ok: false, reason: 'no-active-card' });
  });
});
