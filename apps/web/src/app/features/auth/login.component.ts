import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';
// add these imports at the top if missing:
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-login',
  standalone: true,
imports: [
  NgIf,
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  MatButtonModule,
  MatCardModule,
  // new:
  MatSlideToggleModule,
  MatDividerModule,
  MatTooltipModule,
],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  showPassword = signal(false);

  canSubmit = computed(() =>
    this.email().trim().length > 0 && this.password().length >= 6
  );

  signIn() {
    this.auth.signIn(this.email().trim(), this.password());
    this.router.navigate(['/app']);
  }
}
