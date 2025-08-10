import { Injectable, inject } from '@angular/core';
import { ConfigLoaderService } from './config-loader.service';

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private cfg = inject(ConfigLoaderService);

  private base() {
    const b = this.cfg.gatewayUrl?.trim() || '';
    return b ? b.replace(/\/$/, '') : '';
  }

  async getModels(): Promise<{ chat: string[]; embeddings: string[] }> {
    const res = await fetch(`${this.base()}/v1/models`, { method: 'GET' });
    if (!res.ok) throw new Error(`Failed to load models: ${res.status}`);
    return res.json();
  }

  async chat(promptOrPayload: string | { messages?: any[]; model?: string }) {
    const payload =
      typeof promptOrPayload === 'string'
        ? { messages: [{ role: 'user', content: promptOrPayload }] }
        : promptOrPayload;

    const res = await fetch(`${this.base()}/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // If your worker enforces X-API-Key, add it here from a non-secret public key value in runtime-config.json (optional)
    // headers: { 'Content-Type': 'application/json', 'X-API-Key': '...' },

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Chat failed: ${res.status} ${t}`);
    }
    return res.json();
  }
}
