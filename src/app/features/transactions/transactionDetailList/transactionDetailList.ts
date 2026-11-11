
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { Transaction, TransactionService } from '../transaction.service';
import { Category, CategoryService } from '../../categoriesTags/categoriesAndTags.service';
import { AddTransactionModalComponent } from '../addTransactionModal/addTransactionModal';
import { GlobalMessageService } from '../../../components/globalMessage/globalMessage.service';

@Component({
  selector: 'app-transaction-detail-list',
  standalone: true,
  imports: [AddTransactionModalComponent, DatePipe, DecimalPipe],
  templateUrl: './transactionDetailList.html',
  styleUrl: './transactionDetailList.css',
})
export class TransactionDetailListComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly globalMessageService = inject(GlobalMessageService);

  transactions: Transaction[] = [];
  categories: Category[] = [];

  isLoading = true;
  loadError = '';

  isAddTransactionModalOpen = false;
  isEditTransactionModalOpen = false;
  selectedTransaction: Transaction | null = null;
  isDeleteModalOpen = false;
  transactionToDelete: number | null = null;
  isDeleting = false;

  ngOnInit(): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      this.loadError = 'Unable to identify the signed-in user.';
      this.isLoading = false;
      return;
    }

    this.categoryService.getForUser(userId).subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: () => {
        this.loadError = 'Unable to load categories. Please try again later.';
        this.isLoading = false;
      },
    });

    this.loadTransactions(userId);
  }

  private loadTransactions(userId: number): void {
    this.transactionService.getForUser(userId).subscribe({
      next: (transactions) => {
        this.transactions = transactions.sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Unable to load transactions. Please try again.';
        this.isLoading = false;
      },
    });
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find(c => c.id === categoryId)?.name || 'Unknown';
  }

  onAddTransaction(): void {
    this.isAddTransactionModalOpen = true;
  }

  closeAddTransactionModal(): void {
    this.isAddTransactionModalOpen = false;
  }

  onEditTransaction(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.isEditTransactionModalOpen = true;
  }

  closeEditTransactionModal(): void {
    this.isEditTransactionModalOpen = false;
    this.selectedTransaction = null;
  }

  onTransactionCreated(): void {
    const userId = this.authService.getUserId();

    if (userId) {
      this.loadTransactions(userId);
    }
  }

  
  onDeleteTransaction(transactionId: number): void {
    this.transactionToDelete = transactionId;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) {
      return;
    }

    this.isDeleteModalOpen = false;
    this.transactionToDelete = null;
  }

  confirmDeleteTransaction(): void {
    if (this.transactionToDelete === null || this.isDeleting) {
      return;
    }

    const transactionId = this.transactionToDelete;
    this.isDeleting = true;

    this.transactionService.delete(transactionId).subscribe({
      next: () => {
        this.globalMessageService.show('Transaction deleted');

        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.transactionToDelete = null;

        const userId = this.authService.getUserId();

        if (userId) {
          this.loadTransactions(userId);
        }
      },
      error: () => {
        this.isDeleting = false;
        this.globalMessageService.show(
          'Unable to delete transaction. Please try again.'
        );
      },
    });
  }

}
