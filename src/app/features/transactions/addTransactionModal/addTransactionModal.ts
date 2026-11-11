import { Component, EventEmitter, inject, Output, Input, OnInit,} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Category, CategoryService, Tag, TagService } from '../../categoriesTags/categoriesAndTags.service';
import { AddCategoryModalComponent } from '../../categoriesTags/addCategoryModal/addCategoryModal';
import { GlobalMessageService } from '../../../components/globalMessage/globalMessage.service';
import { CreateTransactionRequest, UpdateTransactionRequest, TransactionService } from '../transaction.service';


import { Transaction } from '../transaction.service';


type PickerType = 'category' | 'tag';

@Component({
  selector: 'app-add-transaction-modal',
  standalone: true,
  imports: [AddCategoryModalComponent, ReactiveFormsModule],
  templateUrl: './addTransactionModal.html',
  styleUrl: './addTransactionModal.css',
})
export class AddTransactionModalComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  
  @Input() transaction: Transaction | null = null;

  get isEditMode(): boolean {
    return this.transaction !== null;
  }

  private readonly authService = inject(AuthService);
  private readonly categoryService = inject(CategoryService);
  private readonly tagService = inject(TagService);
  private readonly transactionService = inject(TransactionService);
  private readonly globalMessageService = inject(GlobalMessageService);
  private readonly formBuilder = inject(FormBuilder);

  readonly transactionForm = this.formBuilder.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['EUR', Validators.required],
    date: ['', Validators.required],
    description: [''],
    transactionType: ['', Validators.required],
  });

  categories: Category[] = [];
  tags: Tag[] = [];
  selectedCategory: Category | null = null;
  selectedTags: Tag[] = [];
  pickerType: PickerType | null = null;
  pendingCategory: Category | null = null;
  pendingTagIds: number[] = [];
  isPickerLoading = false;
  pickerError = '';
  isAddItemModalOpen = false;
  isSaving = false;
  categoryTouched = false;
  submitError = '';

  
  ngOnInit(): void {
    if (!this.transaction) {
      return;
    }

    const transaction = this.transaction;

    this.transactionForm.patchValue({
      amount: transaction.amount,
      currency: transaction.currency,
      date: this.toDateInputValue(transaction.date),
      description: transaction.description ?? '',
      transactionType: transaction.reducesBalance ? 'outgoing' : 'incoming',
    });

    const userId = this.authService.getUserId();

    if (!userId) {
      this.pickerError = 'Unable to identify the signed-in user.';
      return;
    }

    this.categoryService.getForUser(userId).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.selectedCategory =
          categories.find(c => c.id === transaction.categoryId) ?? null;
      },
      error: () => {
        this.pickerError = 'Unable to load categories. Please try again later.';
      },
    });

    this.tagService.getForUser(userId).subscribe({
      next: (tags) => {
        this.tags = tags;
        const existingTagIds = new Set(
          (transaction.tags ?? []).map(tag => tag.id)
        );

        this.selectedTags = tags.filter(tag => existingTagIds.has(tag.id));
      },
      error: () => {
        this.pickerError = 'Unable to load tags. Please try again later.';
      },
    });
  }

  private toDateInputValue(date: string): string {
    // HTML input[type=date] requires yyyy-MM-dd.
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // Also support dd.MM.yyyy, if that is what the API returns.
    const match = date.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }

    // Fallback for ISO timestamps.
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  close(): void {
    this.closed.emit();
  }

  onConfirm(): void {
    this.categoryTouched = true;
    this.submitError = '';

    if (this.transactionForm.invalid || !this.selectedCategory) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    const userId = this.authService.getUserId();

    if (!userId) {
      this.submitError = 'Unable to identify the signed-in user.';
      return;
    }

    const {
      amount,
      currency,
      date,
      description,
      transactionType
    } = this.transactionForm.getRawValue();

    const trimmedDescription = description.trim();

    const commonData = {
      amount,
      categoryId: this.selectedCategory.id,
      currency: currency.trim(),
      date: this.formatDate(date),
      reducesBalance: transactionType === 'outgoing',
      ...(trimmedDescription && { description: trimmedDescription }),
      ...(this.selectedTags.length > 0 && {
        tagIds: this.selectedTags.map(tag => tag.id)
      })
    };

    this.isSaving = true;

    const saveRequest$ = this.isEditMode
      ? this.transactionService.update(this.transaction!.id, {
          ...commonData
        } satisfies UpdateTransactionRequest)
      : this.transactionService.create({
          ...commonData,
          userId
        } satisfies CreateTransactionRequest);

    saveRequest$
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => {
          this.globalMessageService.show(
            this.isEditMode
              ? 'Transaction updated!'
              : 'Transaction created!'
          );

          this.created.emit();
          this.closed.emit();
        },
        error: () => {
          this.submitError = this.isEditMode
            ? 'Unable to update transaction. Please try again.'
            : 'Unable to create transaction. Please try again.';
        }
      });
  }

  openPicker(type: PickerType): void {
    this.pickerType = type;
    this.pickerError = '';
    this.pendingCategory = this.selectedCategory;
    this.pendingTagIds = this.selectedTags.map((tag) => tag.id);
    this.loadPickerItems(type);
  }

  closePicker(): void {
    this.pickerType = null;
    this.pickerError = '';
  }

  selectCategory(category: Category): void {
    this.pendingCategory = category;
  }

  toggleTag(tag: Tag): void {
    this.pendingTagIds = this.pendingTagIds.includes(tag.id)
      ? this.pendingTagIds.filter((id) => id !== tag.id)
      : [...this.pendingTagIds, tag.id];
  }

  confirmPicker(): void {
    if (this.pickerType === 'category') {
      this.selectedCategory = this.pendingCategory;
      this.categoryTouched = true;
    } else if (this.pickerType === 'tag') {
      this.selectedTags = this.tags.filter((tag) => this.pendingTagIds.includes(tag.id));
    }

    this.closePicker();
  }

  openAddItemModal(): void {
    this.isAddItemModalOpen = true;
  }

  closeAddItemModal(): void {
    this.isAddItemModalOpen = false;
  }

  onItemCreated(item: Category | Tag): void {
    if (this.pickerType === 'category') {
      const category = item as Category;
      this.categories = [...this.categories, category];
      this.pendingCategory = category;
    } else if (this.pickerType === 'tag') {
      const tag = item as Tag;
      this.tags = [...this.tags, tag];
      this.pendingTagIds = [...this.pendingTagIds, tag.id];
    }
  }

  isTagSelected(tagId: number): boolean {
    return this.pendingTagIds.includes(tagId);
  }

  get selectedTagsLabel(): string {
    return this.selectedTags.length === 0
      ? 'Add tags'
      : this.selectedTags.map((tag) => tag.name).join(', ');
  }

  private loadPickerItems(type: PickerType): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      this.pickerError = 'Unable to identify the signed-in user.';
      return;
    }

    this.isPickerLoading = true;
    const request$ = type === 'category'
      ? this.categoryService.getForUser(userId)
      : this.tagService.getForUser(userId);

    request$.subscribe({
      next: (items) => {
        if (type === 'category') {
          this.categories = items as Category[];
        } else {
          this.tags = items as Tag[];
        }
        this.isPickerLoading = false;
      },
      error: () => {
        this.pickerError = `Unable to load ${type === 'category' ? 'categories' : 'tags'}. Please try again later.`;
        this.isPickerLoading = false;
      },
    });
  }

  private formatDate(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year}`;
  }
}
