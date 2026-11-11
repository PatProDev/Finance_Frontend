import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const isBackendRequest = request.url.startsWith('http://localhost:8080/');
  const requestWithCredentials = isBackendRequest
    ? request.clone({ withCredentials: true })
    : request;
  const token = authService.getToken();
  const isLoginOrRefreshRequest = requestWithCredentials.url.endsWith('/auth/login')
    || requestWithCredentials.url.endsWith('/auth/refresh');

  if (!token) {
    return next(requestWithCredentials);
  }

  const authenticatedRequest = requestWithCredentials.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (isLoginOrRefreshRequest) {
    return next(authenticatedRequest);
  }

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap((refreshedToken) => next(requestWithCredentials.clone({
          setHeaders: {
            Authorization: `Bearer ${refreshedToken}`,
          },
        }))),
        catchError((refreshError: unknown) => {
          authService.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
