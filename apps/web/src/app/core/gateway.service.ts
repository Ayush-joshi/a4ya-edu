// apps/web/src/app/core/gateway.service.ts
import { Injectable, inject } from '@angular/core';
import { ConfigLoaderService } from './config-loader.service';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private cfg = inject(ConfigLoaderService);

  private base(): string {
    // read the signal value, then normalize
    const raw = (this.cfg.config().gatewayUrl ?? '').trim();
    const b = raw.replace(/\/$/, '');

    // hard guard in prod so we never fall back to GitHub Pages
    const isProd = !location.hostname.includes('localhost');
    if (isProd && !/^https?:\/\//.test(b)) {
      throw new Error('gatewayUrl missing/invalid in production');
    }
    return b; // may be '' in dev (if you proxy), but absolute in prod
  }

  async getModels(): Promise<{ chat: string[]; embeddings: string[] }> {
    const res = await fetch(`${this.base()}/v1/models`, { method: 'GET' });
    if (!res.ok) throw new Error(`models ${res.status}`);
    return res.json();
  }

  async chat(payload: { model?: string; messages: ChatMessage[] }) {
    const res = await fetch(`${this.base()}/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`chat ${res.status}: ${t}`);
    }
    return res.json();
  }
}
