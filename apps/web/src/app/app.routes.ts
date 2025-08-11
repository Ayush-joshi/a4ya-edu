import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-shell.component').then((m) => m.MainShellComponent),
    children: [
      {
        path: 'experimental',
        loadChildren: () =>
          import('./features/experimental/experimental.routes').then(
            (m) => m.EXPERIMENTAL_ROUTES
          ),
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/about/about-us.component').then(
            (m) => m.AboutUsComponent
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'experimental/api-debug' },
      { path: '**', redirectTo: 'experimental/api-debug' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
