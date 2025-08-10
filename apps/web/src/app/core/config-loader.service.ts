import { Injectable, signal } from '@angular/core';

export interface RuntimeConfig {
  gatewayUrl: string;
}

const DEFAULT_CONFIG: RuntimeConfig = {
  gatewayUrl: '',
};

@Injectable({ providedIn: 'root' })
export class ConfigLoaderService {
  config = signal<RuntimeConfig | null>(null);

  async load(): Promise<void> {
    try {
      const res = await fetch('assets/runtime-config.json');
      if (!res.ok) {
        console.error(
          `Failed to load runtime config: ${res.status} ${res.statusText}`,
        );
        this.config.set(DEFAULT_CONFIG);
        return;
      }
      this.config.set(await res.json());
    } catch (err) {
      console.error('Error loading runtime config', err);
      this.config.set(DEFAULT_CONFIG);
    }
  }
}
