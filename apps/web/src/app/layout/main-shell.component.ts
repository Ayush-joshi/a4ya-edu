import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TopbarComponent } from './topbar.component';
import { SidebarComponent } from './sidebar.component';

@Component({
  selector: 'app-main-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    TopbarComponent,
    SidebarComponent,
  ],
  templateUrl: './main-shell.component.html',
  styleUrls: ['./main-shell.component.scss'],
})
export class MainShellComponent {
  private breakpointObserver = inject(BreakpointObserver);

  isHandset = signal(false);

  constructor() {
    this.breakpointObserver.observe('(max-width: 959px)').subscribe((result) => {
      this.isHandset.set(result.matches);
    });
  }
}
