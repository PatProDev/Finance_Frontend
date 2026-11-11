import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { GlobalMessageService } from './globalMessage.service';

@Component({
  selector: 'app-global-message',
  imports: [],
  templateUrl: './globalMessage.component.html',
  styleUrl: './globalMessage.component.css',
  host: {
    '[class.with-sidebar]': 'hasSidebar',
  },
})
export class GlobalMessageComponent {
  readonly messageService = inject(GlobalMessageService);
  private readonly router = inject(Router);
  hasSidebar = this.routeUsesSidebar(this.router.url);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.hasSidebar = this.routeUsesSidebar(event.urlAfterRedirects));
  }

  private routeUsesSidebar(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return path !== '/login' && path !== '/register';
  }
}
