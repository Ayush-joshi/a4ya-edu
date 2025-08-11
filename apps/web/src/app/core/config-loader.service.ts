import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';

export interface RuntimeConfig {
  gatewayUrl: string;
}

const DEFAULT_CONFIG: RuntimeConfig = {
  gatewayUrl: '',
};

@Injectable({ providedIn: 'root' })
export class ConfigLoaderService {
  private http = inject(HttpClient);
  config = signal<RuntimeConfig>(DEFAULT_CONFIG);

  load() {
    const url = new URL('assets/runtime-config.json', document.baseURI).href;
    return this.http.get<RuntimeConfig>(url).pipe(
      tap((cfg) => this.config.set(cfg)),
      catchError((err) => {
        console.error('Error loading runtime config', err);
        this.config.set(DEFAULT_CONFIG);
        return of(DEFAULT_CONFIG);
      }),
      map(() => void 0)
    );
  }
}
