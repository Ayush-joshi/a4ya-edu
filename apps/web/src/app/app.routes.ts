import { Routes } from '@angular/router';
import { ApiDebugComponent } from './features/api-debug/api-debug.component';
import { LoginComponent } from './features/auth/login.component';

export const routes: Routes = [
  { path: '', component: ApiDebugComponent },
  { path: 'login', component: LoginComponent },
];
