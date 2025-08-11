import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideStore, provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { routes } from './app.routes';
import { ConfigLoaderService } from './core/config-loader.service';
import { authFeature } from './features/auth/auth.reducer';
import { AuthEffects } from './features/auth/auth.effects';

function initConfig(config: ConfigLoaderService) {
  return () => config.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideExperimentalZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideStore(),
    provideState(authFeature),
    provideEffects(AuthEffects),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initConfig,
      deps: [ConfigLoaderService],
    },
  ],
};
