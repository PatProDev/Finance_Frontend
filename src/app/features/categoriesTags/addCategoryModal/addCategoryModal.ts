import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { GlobalMessageService } from '../../../components/globalMessage/globalMessage.service';
import { Category, CategoryService, Tag, TagService } from '../categoriesAndTags.service';

export type CreatableItemType = 'category' | 'tag';

@Component({
  selector: 'app-add-category-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './addCategoryModal.html',
  styleUrl: './addCategoryModal.css',
})
export class AddCategoryModalComponent {
  @Input() itemType: CreatableItemType = 'category';
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<Category | Tag>();

  private readonly authService = inject(AuthService);
  private readonly categoryService = inject(CategoryService);
  private readonly tagService = inject(TagService);
  private readonly globalMessageService = inject(GlobalMessageService);
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
  });

  isSaving = false;
  error = '';

  get itemLabel(): string {
    return this.itemType === 'category' ? 'Category' : 'Tag';
  }

  close(): void {
    if (!this.isSaving) {
      this.closed.emit();
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userId = this.authService.getUserId();
    const name = this.form.getRawValue().name.trim();

    if (!userId) {
      this.error = 'Unable to identify the signed-in user.';
      return;
    }

    if (!name) {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    this.isSaving = true;
    this.error = '';
    const request$ = this.itemType === 'category'
      ? this.categoryService.create(userId, name)
      : this.tagService.create(userId, name);

    request$.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: (item) => {
        this.globalMessageService.show(`${this.itemLabel} created!`);
        this.created.emit(item);
        this.closed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.status == 400
          ? `${this.itemType} with that name already exists.`
          : `Unable to create ${this.itemType}. Please try again.`;
      },
    });
  }
}
