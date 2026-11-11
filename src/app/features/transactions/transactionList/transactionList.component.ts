import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { Transaction, TransactionService } from '../transaction.service';

@Component({
  selector: 'app-transaction-list',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './transactionList.component.html',
  styleUrl: './transactionList.component.css',
})
export class TransactionListComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly transactionService = inject(TransactionService);

  transactions: Transaction[] = [];
  isLoading = true;
  loadError = '';

  ngOnInit(): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      this.loadError = 'Unable to identify the signed-in user.';
      this.isLoading = false;
      return;
    }

    this.transactionService.getForUser(userId).subscribe({
      next: (transactions) => {
        this.transactions = transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Unable to load transactions. Please try again later.';
        this.isLoading = false;
      },
    });
  }
}
