import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BuildMatchUsecase } from '../../../domain/models/match/usecase/build-match.usecase';
import { CurrentMatchStore } from '../../../shared/foundational/state/current-match.store';
import { MatchStoreService } from '../../../shared/foundational/state/match-store.service';
import { WelcomePage } from './welcome.page';

expect.extend(toHaveNoViolations);

describe('WelcomePage accessibility', () => {
  function createFixture() {
    TestBed.configureTestingModule({
      imports: [WelcomePage],
      providers: [
        { provide: BuildMatchUsecase, useValue: { build: jest.fn() } },
        {
          provide: MatchStoreService,
          useValue: { initializeSession: jest.fn(), setQuestions: jest.fn() },
        },
        { provide: CurrentMatchStore, useValue: { setMatch: jest.fn() } },
        { provide: Router, useValue: { navigateByUrl: jest.fn() } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(WelcomePage);
    fixture.detectChanges();
    return fixture;
  }

  it('no tiene violaciones de accesibilidad detectables por axe-core', async () => {
    const fixture = createFixture();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
