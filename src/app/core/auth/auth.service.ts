import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, map, Observable, shareReplay, tap, throwError } from 'rxjs';
import { GlobalMessageService } from '../../components/globalMessage/globalMessage.service';

interface LoginResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loginUrl = 'http://localhost:8080/auth/login';
  private readonly refreshUrl = 'http://localhost:8080/auth/refresh';
  private readonly registerUrl = 'http://localhost:8080/users';
  private readonly tokenStorageKey = 'authToken';
  private refreshRequest$?: Observable<string>;

  constructor(
    private readonly http: HttpClient, 
    private readonly router: Router, 
    private readonly globalMessageService: GlobalMessageService
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginUrl, { email, password }, {
      withCredentials: true,
    });
  }

  register(username: string, email: string, password: string): Observable<unknown> {
    return this.http.post(this.registerUrl, { username, email, password });
  }

  storeToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  refreshToken(): Observable<string> {
    if (!this.getToken()) {
      return throwError(() => new Error('No token is available to refresh.'));
    }

    if (!this.refreshRequest$) {
      this.refreshRequest$ = this.http.post<LoginResponse>(this.refreshUrl, {}, {
        withCredentials: true,
      }).pipe(
        map(({ token }) => token),
        tap((token) => this.storeToken(token)),
        finalize(() => this.refreshRequest$ = undefined),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.refreshRequest$;
  }

  getUsername(): string | null {
    const username = this.getTokenPayload()?.['username'];
    return typeof username === 'string' ? username : null;
  }

  getUserId(): number | null {
    const payload = this.getTokenPayload();
    const userId = payload?.['userId'] ?? payload?.['sub'];
    const numericUserId = typeof userId === 'number' ? userId : Number(userId);

    return Number.isInteger(numericUserId) && numericUserId > 0 ? numericUserId : null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
    this.router.navigate(['/login']);
    this.globalMessageService.show('You have been logged out', 'success');
  }

  private getTokenPayload(): Record<string, unknown> | null {
    const token = this.getToken();
    const encodedPayload = token?.split('.')[1];

    if (!encodedPayload) {
      return null;
    }

    try {
      const base64Payload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=');
      const json = new TextDecoder().decode(
        Uint8Array.from(atob(paddedPayload), (character) => character.charCodeAt(0)),
      );

      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
