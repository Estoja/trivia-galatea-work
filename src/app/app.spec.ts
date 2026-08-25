import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { CurrentMatchStore } from './shared/foundational/state/current-match.store';
import { MatchStoreService } from './shared/foundational/state/match-store.service';

@Component({ selector: 'tg-stub', template: '' })
class StubPage {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'welcome', component: StubPage },
          { path: 'board', component: StubPage },
          { path: 'results', component: StubPage },
        ]),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render a router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  describe('advertencia beforeunload (FR-023/FR-029, T085/T086)', () => {
    let addEventListenerSpy: jest.SpyInstance;
    let removeEventListenerSpy: jest.SpyInstance;

    beforeEach(() => {
      addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('no registra el listener si no hay ninguna tarjeta respondida', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('registra el listener nativo cuando answeredCount() >= 1 fuera de welcome/results', async () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      await TestBed.inject(Router).navigateByUrl('/board');

      const matchStore = TestBed.inject(MatchStoreService);
      matchStore.initializeSession('Jugador1', 'Historia');
      matchStore.setQuestions([{ id: 'card-0', category: 'galatea', state: 'faceDown' }]);
      matchStore.openCard('card-0');
      matchStore.confirmAnswer('card-0', '0', true);
      fixture.detectChanges();

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('remueve el listener al navegar a /results aunque answeredCount() >= 1', async () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      await TestBed.inject(Router).navigateByUrl('/board');

      const matchStore = TestBed.inject(MatchStoreService);
      matchStore.initializeSession('Jugador1', 'Historia');
      matchStore.setQuestions([{ id: 'card-0', category: 'galatea', state: 'faceDown' }]);
      matchStore.openCard('card-0');
      matchStore.confirmAnswer('card-0', '0', true);
      fixture.detectChanges();
      addEventListenerSpy.mockClear();

      await TestBed.inject(Router).navigateByUrl('/results');
      fixture.detectChanges();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('remueve el listener al navegar a /welcome (reinicio, FR-023)', async () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      await TestBed.inject(Router).navigateByUrl('/board');

      const matchStore = TestBed.inject(MatchStoreService);
      matchStore.initializeSession('Jugador1', 'Historia');
      matchStore.setQuestions([{ id: 'card-0', category: 'galatea', state: 'faceDown' }]);
      matchStore.openCard('card-0');
      matchStore.confirmAnswer('card-0', '0', true);
      fixture.detectChanges();
      addEventListenerSpy.mockClear();

      await TestBed.inject(Router).navigateByUrl('/welcome');
      fixture.detectChanges();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
  });

  describe('listeners online/offline (FR-025)', () => {
    let addEventListenerSpy: jest.SpyInstance;
    let removeEventListenerSpy: jest.SpyInstance;

    beforeEach(() => {
      addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('registra los listeners online y offline al crear el componente', () => {
      TestBed.createComponent(App);

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('marca CurrentMatchStore.isOffline en true cuando se dispara el evento offline', () => {
      TestBed.createComponent(App);
      const currentMatchStore = TestBed.inject(CurrentMatchStore);

      window.dispatchEvent(new Event('offline'));

      expect(currentMatchStore.isOffline()).toBe(true);
    });

    it('marca CurrentMatchStore.isOffline en false cuando se dispara el evento online (recupera conexión)', () => {
      TestBed.createComponent(App);
      const currentMatchStore = TestBed.inject(CurrentMatchStore);

      window.dispatchEvent(new Event('offline'));
      expect(currentMatchStore.isOffline()).toBe(true);

      window.dispatchEvent(new Event('online'));
      expect(currentMatchStore.isOffline()).toBe(false);
    });

    it('remueve los listeners online/offline al destruir el componente', () => {
      const fixture = TestBed.createComponent(App);
      fixture.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
});
