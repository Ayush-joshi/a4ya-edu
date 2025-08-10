import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

import { routes } from './app.routes';
import { ConfigLoaderService } from './core/config-loader.service';

function initConfig(config: ConfigLoaderService) {
  return () => config.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideExperimentalZonelessChangeDetection(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initConfig,
      deps: [ConfigLoaderService],
    },
  ],
};
