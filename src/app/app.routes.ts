import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'welcome',
  },
  {
    path: 'welcome',
    loadComponent: () => import('./ui/pages/welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'board',
    loadComponent: () => import('./ui/pages/board/board.page').then((m) => m.BoardPage),
  },
  {
    path: 'results',
    loadComponent: () => import('./ui/pages/results/results.page').then((m) => m.ResultsPage),
  },
];
