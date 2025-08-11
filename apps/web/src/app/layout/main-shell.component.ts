import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TopBarComponent } from './top-bar/top-bar.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-main-shell',
  standalone: true,
  imports: [RouterOutlet, TopBarComponent, SidebarComponent],
  templateUrl: './main-shell.component.html',
  styleUrls: ['./main-shell.component.scss'],
})
export class MainShellComponent {
  private breakpointObserver = inject(BreakpointObserver);

  collapsed = signal(true);

  constructor() {
    this.breakpointObserver.observe('(max-width: 959px)').subscribe((result) => {
      if (!result.matches) {
        this.collapsed.set(false);
      }
    });
  }
}
