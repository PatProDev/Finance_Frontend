import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin, Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Category, CategoryService, Tag, TagService } from './categoriesAndTags.service';
import { GlobalMessageService } from '../../components/globalMessage/globalMessage.service';

type ItemType = 'category' | 'tag';
type NamedItem = Category | Tag;

interface ModalState {
  type: ItemType;
  id: number | null;
}

@Component({
  selector: 'app-categories-tags',
  imports: [ReactiveFormsModule],
  templateUrl: './categoriesAndTags.component.html',
  styleUrl: './categoriesAndTags.component.css',
})
export class CategoriesAndTagsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly categoryService = inject(CategoryService);
  private readonly tagService = inject(TagService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly globalMessageService = inject(GlobalMessageService);

  readonly itemForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
  });

  categories: Category[] = [];
  tags: Tag[] = [];
  isLoading = true;
  loadError = '';
  isSaving = false;
  modalError = '';
  modal: ModalState | null = null;

  ngOnInit(): void {
    this.loadItems();
  }

  openCreate(type: ItemType): void {
    this.modal = { type, id: null };
    this.itemForm.reset({ name: '' });
    this.modalError = '';
  }

  openEdit(type: ItemType, item: NamedItem): void {
    this.modal = { type, id: item.id };
    this.itemForm.reset({ name: item.name });
    this.modalError = '';
  }

  closeModal(): void {
    if (!this.isSaving) {
      this.modal = null;
      this.modalError = '';
    }
  }

  save(): void {
    const modal = this.modal;

    if (!modal) {
      return;
    }

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const name = this.itemForm.getRawValue().name.trim();

    if (!name) {
      this.itemForm.controls.name.setErrors({ required: true });
      return;
    }

    const userId = this.authService.getUserId();

    if (modal.id === null && !userId) {
      this.modalError = 'Unable to identify the signed-in user.';
      return;
    }

    this.isSaving = true;
    this.modalError = '';
    const isNewItem = modal.id === null;
    const request$ = modal.id === null
      ? this.createItem(modal.type, userId!, name)
      : this.updateItem(modal.type, modal.id, name);

    request$.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => {
        this.modal = null;
        if (isNewItem) {
          this.globalMessageService.show(`${this.itemTypeLabel(modal.type)} created!`);
        }
        this.loadItems();
      },
      error: (error: HttpErrorResponse) => {
        this.modalError = error.status == 400
          ? `${modal.type} with that name already exists.`
          : `Unable to create ${modal.type}. Please try again.`;
      },
    });
  }

  delete(): void {
    const modal = this.modal;

    if (!modal || modal.id === null) {
      return;
    }

    this.isSaving = true;
    this.modalError = '';
    this.deleteItem(modal.type, modal.id)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => {
          this.modal = null;
          this.globalMessageService.show(`${this.itemTypeLabel(modal.type)} deleted!`, 'success');
          this.loadItems();
        },
        error: (error: HttpErrorResponse) => {
          this.modalError = error.status === 401
            ? `Unable to delete ${modal.type}, because it's used by at least 1 transaction or budget.`
            : `Unable to delete ${modal.type}. Please try again.`;
        },
      });
  }

  private loadItems(): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      this.loadError = 'Unable to identify the signed-in user.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.loadError = '';

    forkJoin({
      categories: this.categoryService.getForUser(userId),
      tags: this.tagService.getForUser(userId),
    }).subscribe({
      next: ({ categories, tags }) => {
        this.categories = categories;
        this.tags = tags;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Unable to load categories and tags. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  private createItem(type: ItemType, userId: number, name: string): Observable<NamedItem> {
    return type === 'category'
      ? this.categoryService.create(userId, name)
      : this.tagService.create(userId, name);
  }

  private updateItem(type: ItemType, id: number, name: string): Observable<NamedItem> {
    return type === 'category'
      ? this.categoryService.update(id, name)
      : this.tagService.update(id, name);
  }

  private deleteItem(type: ItemType, id: number): Observable<void> {
    return type === 'category'
      ? this.categoryService.delete(id)
      : this.tagService.delete(id);
  }

  private itemTypeLabel(type: ItemType): string {
    return type === 'category' ? 'Category' : 'Tag';
  }
}
