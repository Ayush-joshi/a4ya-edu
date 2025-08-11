import { computed, effect, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { patchState } from '@ngrx/signals';              // ← add this
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { GatewayService, ChatMessage } from '../../core/gateway.service';

interface ApiDebugState {
  chatModels: string[];
  selectedModel: string;
  prompt: string;
  loading: boolean;
  error: string | null;
  response: any;
}

const initialState: ApiDebugState = {
  chatModels: [],
  selectedModel: '',
  prompt: '',
  loading: false,
  error: null,
  response: null,
};

export const ApiDebugStore = signalStore(
  withState(initialState),

  withComputed(({ loading, prompt, selectedModel }) => ({
    sendDisabled: computed(() => loading() || !prompt().trim() || !selectedModel()),
  })),

  withMethods((store, api = inject(GatewayService)) => ({
    setSelectedModel(value: string) {
    patchState(store, { selectedModel: value });
  },
  setPrompt(value: string) {
    patchState(store, { prompt: value });
  },
    loadModels() {
      patchState(store, { loading: true, error: null });
      api.getModels().pipe(
        tap(({ chat }) => {
          patchState(store, {
            chatModels: chat ?? [],
            selectedModel: chat?.[0] ?? '',
          });
        }),
        catchError((e: any) => {
          patchState(store, {
            error: String(e?.message ?? e),
            chatModels: [],
            selectedModel: '',
          });
          return EMPTY;
        }),
        finalize(() => patchState(store, { loading: false })),
      ).subscribe();
    },

    send() {
      if (store.sendDisabled()) return;

      patchState(store, { loading: true, error: null, response: null });

      const maybeModel = store.selectedModel().trim() || undefined;
      const payload = {
        model: maybeModel,
        messages: [
          { role: 'user', content: store.prompt().trim() } as ChatMessage,
        ],
      };

      api.chat(payload).pipe(
        tap((res) => patchState(store, { response: res })),
        catchError((e: any) => {
          patchState(store, { error: String(e?.message ?? e) });
          return EMPTY;
        }),
        finalize(() => patchState(store, { loading: false })),
      ).subscribe();
    },

    clear() {
      patchState(store, { prompt: '', response: null, error: null });
    },
  })),

  withHooks((store) => ({
    onInit() {
      store.loadModels();
      effect(() => {
        const m = store.selectedModel();
        if (m) console.debug('[api-debug] model =', m);
      });
    },
  })),
);
