import { Injectable, signal } from '@angular/core';

export interface RuntimeConfig {
  gatewayUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigLoaderService {
  config = signal<RuntimeConfig | null>(null);

  async load(): Promise<void> {
    const res = await fetch('assets/runtime-config.json');
    this.config.set(await res.json());
  }
}
