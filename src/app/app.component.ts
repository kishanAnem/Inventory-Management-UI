import { Component, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { TopbarComponent } from './shared/components/topbar/topbar.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'client';
  sidebarCollapsed = signal(false);
  showLayout = signal(true);

  // Routes that should NOT show the main layout (topbar/sidebar)
  private readonly authRoutes = ['/login', '/callback', '/unauthorized', '/debug'];

  constructor(private router: Router) {
    // Listen to route changes to determine if layout should be shown
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.url)
    ).subscribe(url => {
      const shouldHideLayout = this.authRoutes.some(route => url.startsWith(route));
      this.showLayout.set(!shouldHideLayout);
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(value => !value);
  }

  onSidebarToggled(collapsed: boolean) {
    this.sidebarCollapsed.set(collapsed);
  }
}
