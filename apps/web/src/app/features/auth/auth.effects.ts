import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, delay, map, switchMap } from 'rxjs/operators';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ username }) =>
        of({ username, token: 'fake-token' }).pipe(
          delay(500),
          map(({ username, token }) =>
            AuthActions.loginSuccess({ user: { username }, token })
          ),
          catchError((err) => of(AuthActions.loginFailure({ error: String(err) })))
        )
      )
    )
  );
}
