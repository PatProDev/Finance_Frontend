import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TransactionListComponent } from '../transactions/transactionList/transactionList.component';

@Component({
  selector: 'app-home',
  imports: [TransactionListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly username = this.authService.getUsername();

  signOut(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
