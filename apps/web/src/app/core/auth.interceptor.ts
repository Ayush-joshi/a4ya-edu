import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ConfigLoaderService } from './config-loader.service';
import { catchError, switchMap, throwError, of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const cfg = inject(ConfigLoaderService).config();
  const router = inject(Router);
  const gatewayUrl = cfg.gatewayUrl;

  let authReq = req;
  if (gatewayUrl && req.url.startsWith(gatewayUrl)) {
    const token = auth.getAccessToken();
    if (token) {
      authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && gatewayUrl && req.url.startsWith(gatewayUrl)) {
        const refreshed = auth.refreshIfNeeded();
        if (refreshed) {
          const retry = authReq.clone({ setHeaders: { Authorization: `Bearer ${refreshed}` } });
          return next(retry).pipe(
            catchError((err2: HttpErrorResponse) => {
              auth.signOut();
              router.navigate(['/login']);
              return throwError(() => err2);
            })
          );
        }
        auth.signOut();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
