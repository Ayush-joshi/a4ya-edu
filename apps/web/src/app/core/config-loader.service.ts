import { Injectable, signal } from '@angular/core';

export type RuntimeConfig = {
  gatewayUrl: string;
};

const DEFAULT_CONFIG: RuntimeConfig = {
  // Safe local default; change if your local API differs.
  gatewayUrl: 'https://gateway-worker.ayush-joshi03.workers.dev',
};

@Injectable({ providedIn: 'root' })
export class ConfigLoaderService {
  private readonly cfg = signal<RuntimeConfig>(DEFAULT_CONFIG);

  get config() { return this.cfg(); }
  get gatewayUrl() { return this.cfg().gatewayUrl; }

  /**
   * Loads /assets/runtime-config.json and merges with defaults.
   * Falls back to defaults if the file is missing, HTML (index.html), or invalid.
   */
  async load(): Promise<void> {
    try {
      const res = await fetch('assets/runtime-config.json', { cache: 'no-store' });
      if (!res.ok) {
        console.warn(`[ConfigLoader] runtime-config.json not found (${res.status}); using defaults.`);
        this.cfg.set(DEFAULT_CONFIG);
        return;
      }
      const text = await res.text();
      const t = text.trim();
      if (t.startsWith('<!DOCTYPE') || t.startsWith('<html')) {
        console.warn('[ConfigLoader] Got HTML instead of JSON; using defaults.');
        this.cfg.set(DEFAULT_CONFIG);
        return;
      }
      const json = JSON.parse(text);
      this.cfg.set({ ...DEFAULT_CONFIG, ...json });
    } catch (err) {
      console.warn('[ConfigLoader] Failed to load config; using defaults.', err);
      this.cfg.set(DEFAULT_CONFIG);
    }
  }
}
