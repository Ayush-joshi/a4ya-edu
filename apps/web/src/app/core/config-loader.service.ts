import { Injectable, signal } from '@angular/core';

export interface RuntimeConfig {
  gatewayUrl: string;
}

const DEFAULT_CONFIG: RuntimeConfig = {
  gatewayUrl: '',
};

@Injectable({ providedIn: 'root' })
export class ConfigLoaderService {
  config = signal<RuntimeConfig>(DEFAULT_CONFIG);

  async load(): Promise<void> {
    const url = new URL('assets/runtime-config.json', document.baseURI).href;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(
          `Failed to load runtime config: ${res.status} ${res.statusText}`,
        );
        return;
      }
      this.config.set(await res.json());
    } catch (err) {
      console.error('Error loading runtime config', err);
    }
  }
}
