import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loginError = '';
  readonly registrationSuccess = history.state?.['registrationSuccess'] === true;
  isSubmitting = false;

  onSubmit(): void {
    this.loginError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email, password)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: ({ token }) => {
          this.authService.storeToken(token);
          void this.router.navigateByUrl('/');
        },
        error: (error: HttpErrorResponse) => {
          this.loginError = error.status === 401
            ? 'Invalid email or password'
            : 'Unable to sign in. Please try again.';
        },
      });
  }
}
