import { Injectable } from '@angular/core';
import { ConfigLoaderService } from './config-loader.service';

@Injectable({ providedIn: 'root' })
export class GatewayService {
  constructor(private configLoader: ConfigLoaderService) {}

  async chat(prompt: string) {
    const cfg = this.configLoader.config();
    if (!cfg) throw new Error('Config not loaded');
    const url = `${cfg.gatewayUrl}/v1/chat`;
    const start = performance.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json();
    return { data, status: res.status, duration: performance.now() - start };
  }
}
