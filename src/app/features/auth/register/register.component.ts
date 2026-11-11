import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const repeatPassword = control.get('repeatPassword')?.value;

  return password && repeatPassword && password !== repeatPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly registerForm = this.formBuilder.nonNullable.group(
    {
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      repeatPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  registerError = '';
  isSubmitting = false;

  onSubmit(): void {
    this.registerError = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { username, email, password } = this.registerForm.getRawValue();

    this.authService.register(username, email, password)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          void this.router.navigate(['/login'], {
            state: { registrationSuccess: true },
          });
        },
        error: (error: HttpErrorResponse) => {
          this.registerError = error.status === 400
            && error.error?.error === "Entity 'User' already exists."
            ? 'User with that email already exists'
            : 'Unable to register. Please try again.';
        },
      });
  }
}
