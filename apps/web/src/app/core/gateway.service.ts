// apps/web/src/app/core/gateway.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ConfigLoaderService } from './config-loader.service';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private cfg = inject(ConfigLoaderService);
  private http = inject(HttpClient);

  private base(): string {
    const raw = (this.cfg.config().gatewayUrl ?? '').trim();
    const b = raw.replace(/\/$/, '');

    const isProd = !location.hostname.includes('localhost');
    if (isProd && !/^https?:\/\//.test(b)) {
      throw new Error('gatewayUrl missing/invalid in production');
    }
    return b;
  }

  getModels() {
    return this.http
      .get<{ chat: string[]; embeddings: string[] }>(`${this.base()}/v1/models`)
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(`models ${err.status}`))
        )
      );
  }

  chat(payload: { model?: string; messages: ChatMessage[] }) {
    return this.http
      .post<any>(`${this.base()}/v1/chat`, payload)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const msg = `chat ${err.status}: ${err.error ?? ''}`;
          return throwError(() => new Error(msg));
        })
      );
  }
}
