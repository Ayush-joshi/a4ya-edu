import { Injectable, inject, signal } from '@angular/core';
import { ConfigLoaderService } from './config-loader.service';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const FAKE_ACCESS_TOKEN = 'fake-access-token';
const FAKE_REFRESH_TOKEN = 'fake-refresh-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private cfg = inject(ConfigLoaderService);
  userEmail = signal<string>('');

  signIn(email: string, _password: string) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, FAKE_ACCESS_TOKEN);
    localStorage.setItem(REFRESH_TOKEN_KEY, FAKE_REFRESH_TOKEN);
    this.userEmail.set(email);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  refreshIfNeeded(): string | null {
    const current = this.getAccessToken();
    if (current) return current;
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refresh) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, FAKE_ACCESS_TOKEN);
      return FAKE_ACCESS_TOKEN;
    }
    return null;
  }

  signOut() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.userEmail.set('');
  }

  get gatewayUrl() {
    return this.cfg.config().gatewayUrl;
  }
}
