// apps/web/src/app/core/gateway.service.ts
import { Injectable, inject } from '@angular/core';
import { ConfigLoaderService } from './config-loader.service';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private cfg = inject(ConfigLoaderService);

  private base(): string {
    // Be permissive: support cfg.gatewayUrl or cfg.config.gatewayUrl, else ''
    const anyCfg: any = this.cfg as any;
    const raw =
      (typeof anyCfg?.gatewayUrl === 'string' && anyCfg.gatewayUrl) ||
      (typeof anyCfg?.config?.gatewayUrl === 'string' && anyCfg.config.gatewayUrl) ||
      '';
    const b = raw.trim().replace(/\/$/, '');
    if (!b) {
      const msg =
        'Gateway base URL is not configured. Please set "gatewayUrl" in runtime-config.json';
      console.error(msg);
      throw new Error(msg);
    }
    return b;
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
