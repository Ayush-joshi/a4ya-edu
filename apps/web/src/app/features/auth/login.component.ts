import { Component, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { authFeature } from './auth.reducer';
import * as AuthActions from './auth.actions';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, NgIf],
  template: `
    <mat-form-field appearance="outline" class="field">
      <mat-label>Username</mat-label>
      <input matInput [value]="username()" (input)="username.set(($any($event.target)).value)" />
    </mat-form-field>
    <mat-form-field appearance="outline" class="field">
      <mat-label>Password</mat-label>
      <input matInput type="password" [value]="password()" (input)="password.set(($any($event.target)).value)" />
    </mat-form-field>
    <div class="row">
      <button mat-raised-button color="primary" (click)="login()" [disabled]="loading()">Login</button>
    </div>
    <div class="meta err" *ngIf="error() as e">Error: {{ e }}</div>
  `,
  styles: [`
    .field { display:block; margin-bottom:1rem; max-width:320px; }
    .row { margin-top:.5rem; }
    .meta.err { color:#c62828; margin-top:.5rem; }
  `]
})
export class LoginComponent {
  private store = inject(Store);
  username = signal('');
  password = signal('');
  loading = this.store.selectSignal(authFeature.selectLoading);
  error = this.store.selectSignal(authFeature.selectError);

  login() {
    this.store.dispatch(AuthActions.login({ username: this.username(), password: this.password() }));
  }
}
