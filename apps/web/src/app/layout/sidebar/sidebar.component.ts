import { Component, signal, inject, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

type NavItem = {
  id: string;
  label: string;
  icon: string;
  route?: string;                 // parent is clickable (points to first child route)
  dividerAbove?: boolean;
  children?: ReadonlyArray<NavItem>;
  bottomAligned?: boolean;   // <— NEW
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive,
    MatListModule, MatIconModule, MatDividerModule, MatButtonModule, MatTooltipModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  private router = inject(Router);

  // internal partial-collapse -> icon rail
  collapsed = signal(false);

  // Only your existing routes (no extras)
  // Parent "Experimental" is a normal option; its route points to the first child.
  readonly nav = signal<ReadonlyArray<NavItem>>([
    {
      id: 'exp',
      label: 'Experimental',
      icon: 'biotech',
      route: 'experimental/api-debug',
      children: [
        { id: 'api', label: 'API Debug', icon: 'code', route: 'experimental/api-debug' },
        { id: 'resize', label: 'Image Resizer', icon: 'image', route: 'experimental/image-resizer' },
      ],
    },
    { id: 'about', label: 'About us', icon: 'info', route: 'about', dividerAbove: true },
    { id: 'logout', label: 'Log out', icon: 'exit_to_app', route: '/', bottomAligned: true, dividerAbove: true },
  ]);
  readonly topNav = computed(() => this.nav().filter(i => !i.bottomAligned));
readonly bottomNav = computed(() => this.nav().filter(i => i.bottomAligned));


  toggleCollapsed() { this.collapsed.set(!this.collapsed()); }

  // ——— active-state helpers ———
  private normalize = (r?: string) => (r ?? '').replace(/^\/+/, ''); // remove leading /
  private current = computed(() => this.router.url.replace(/^\/+/, ''));

  isItemActive(item: NavItem): boolean {
    const cur = this.current();
    const parentRoute = this.normalize(item.route);
    const childHit = (item.children ?? []).some(c => cur.startsWith(this.normalize(c.route)));
    return !!parentRoute && cur.startsWith(parentRoute) || childHit;
  }

  isChildActive(route?: string): boolean {
    const cur = this.current();
    return !!route && cur.startsWith(this.normalize(route));
  }

  trackById = (_: number, it: NavItem) => it.id;
}
