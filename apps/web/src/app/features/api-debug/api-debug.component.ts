// apps/web/src/app/features/api-debug/api-debug.component.ts
import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgIf, NgFor, JsonPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { GatewayService, ChatMessage } from '../../core/gateway.service';

@Component({
  selector: 'app-api-debug',
  standalone: true,
  imports: [NgIf, NgFor, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, JsonPipe],
  template: `
    <div class="row">
      <mat-form-field appearance="outline" class="field">
        <mat-label>Model</mat-label>
        <mat-select [value]="selectedModel()" (selectionChange)="selectedModel.set($event.value)">
          <mat-option *ngFor="let m of chatModels()" [value]="m">{{ m }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <mat-form-field appearance="outline" class="field">
      <mat-label>Prompt</mat-label>
      <textarea matInput
        [value]="prompt()"
        (input)="prompt.set(($any($event.target)).value ?? '')"
        rows="5">
        </textarea>

    </mat-form-field>

    <div class="row">
      <button mat-raised-button color="primary"
              [disabled]="sendDisabled()"
              (click)="send()">Send</button>
      <button mat-button (click)="clear()">Clear</button>
    </div>

    <div class="meta" *ngIf="loading()">Loading…</div>
    <div class="meta err" *ngIf="error() as e">Error: {{ e }}</div>

    <pre *ngIf="response() as r">{{ r | json }}</pre>
  `,
  styles: [`
    .row { display:flex; gap:.75rem; align-items:center; margin-bottom:.75rem; }
    .field { width:100%; max-width:840px; }
    .meta { margin:.5rem 0; font-size:.9rem; opacity:.85; }
    .meta.err { color:#c62828; }
    pre { white-space:pre-wrap; background:#f6f8fa; padding:1rem; border-radius:8px; }
  `]
})
export class ApiDebugComponent {
  private api = inject(GatewayService);

  // signals
  chatModels = signal<string[]>([]);
  selectedModel = signal<string>('');   // <- string only
  prompt = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  response = signal<any>(null);

  // derived
  sendDisabled = computed(() => this.loading() || !this.prompt().trim() || !this.selectedModel());

  constructor() {
    this.loadModels();
    effect(() => {
      const m = this.selectedModel();
      if (m) console.debug('[api-debug] model =', m);
    });
  }

  private async loadModels() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const { chat } = await this.api.getModels();
      this.chatModels.set(chat ?? []);
      if (chat?.length && !this.selectedModel()) this.selectedModel.set(chat[0]);
    } catch (e: any) {
      this.error.set(String(e?.message ?? e));
      this.chatModels.set([]);
      this.selectedModel.set('');
    } finally {
      this.loading.set(false);
    }
  }

  async send() {
    if (this.sendDisabled()) return;
    this.loading.set(true);
    this.error.set(null);
    this.response.set(null);

    const maybeModel = this.selectedModel().trim() || undefined; // <- undefined if empty

    const payload = {
      model: maybeModel,
      messages: [{ role: 'user', content: this.prompt().trim() } as ChatMessage],
    };

    try {
      const res = await this.api.chat(payload);
      this.response.set(res);
    } catch (e: any) {
      this.error.set(String(e?.message ?? e));
    } finally {
      this.loading.set(false);
    }
  }

  clear() {
    this.prompt.set('');
    this.response.set(null);
    this.error.set(null);
  }
}
