import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { MainLayoutComponent } from './layout/main-layout.component';
import { authGuard } from './core/auth.guard';
import { ApiDebugComponent } from './features/api-debug/api-debug.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: ApiDebugComponent },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'app' },
];
