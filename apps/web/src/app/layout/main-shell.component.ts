import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-main-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: './main-shell.component.html',
  styleUrls: ['./main-shell.component.scss'],
})
export class MainShellComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  auth = inject(AuthService);

  isHandset = signal(false);

  constructor() {
    this.breakpointObserver.observe('(max-width: 959px)').subscribe((result) => {
      this.isHandset.set(result.matches);
    });
  }

  logout() {
    this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
