import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-side-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sideBar.component.html',
  styleUrl: './sideBar.component.css'
})
export class SideBarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly username = this.authService.getUsername();

  signOut(): void {
    this.authService.logout();
  }
}
