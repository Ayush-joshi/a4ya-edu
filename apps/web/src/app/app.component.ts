import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { authFeature } from './features/auth/auth.reducer';
import * as AuthActions from './features/auth/auth.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary">
      a4ya-edu
      <span class="spacer"></span>
      <ng-container *ngIf="user(); else login">
        <span class="user">{{ user()?.username }}</span>
        <button mat-button (click)="logout()">Logout</button>
      </ng-container>
      <ng-template #login>
        <a mat-button routerLink="/login">Login</a>
      </ng-template>
    </mat-toolbar>
    <div class="content">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `.content { padding: 1rem; }`,
    `.spacer { flex: 1 1 auto; }`,
    `.user { margin-right: .5rem; }`
  ]
})
export class AppComponent {
  private store = inject(Store);
  user = this.store.selectSignal(authFeature.selectUser);

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
