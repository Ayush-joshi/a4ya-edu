import { Routes } from '@angular/router';
import { ApiDebugComponent } from '../api-debug/api-debug.component';

export const EXPERIMENTAL_ROUTES: Routes = [
  { path: 'api-debug', component: ApiDebugComponent },
  { path: '', pathMatch: 'full', redirectTo: 'api-debug' },
  { path: '**', redirectTo: 'api-debug' },
];
