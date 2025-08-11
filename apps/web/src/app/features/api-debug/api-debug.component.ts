// apps/web/src/app/features/api-debug/api-debug.component.ts
import { Component, inject } from '@angular/core';
import { NgIf, NgFor, JsonPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiDebugStore } from './api-debug.store';

@Component({
  selector: 'app-api-debug',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    JsonPipe,
  ],
  template: `
    <div class="row">
      <mat-form-field appearance="outline" class="field">
        <mat-label>Model</mat-label>
        <mat-select
          [value]="store.selectedModel()"
          (selectionChange)="store.patchState({ selectedModel: $event.value })"
        >
          <mat-option *ngFor="let m of store.chatModels()" [value]="m"
            >{{ m }}</mat-option
          >
        </mat-select>
      </mat-form-field>
    </div>

    <mat-form-field appearance="outline" class="field">
      <mat-label>Prompt</mat-label>
      <textarea
        matInput
        [value]="store.prompt()"
        (input)="store.patchState({ prompt: ($any($event.target)).value ?? '' })"
        rows="5"
      ></textarea>
    </mat-form-field>

    <div class="row">
      <button
        mat-raised-button
        color="primary"
        [disabled]="store.sendDisabled()"
        (click)="store.send()"
      >
        Send
      </button>
      <button mat-button (click)="store.clear()">Clear</button>
    </div>

    <div class="meta" *ngIf="store.loading()">Loading…</div>
    <div class="meta err" *ngIf="store.error() as e">Error: {{ e }}</div>

    <pre *ngIf="store.response() as r">{{ r | json }}</pre>
  `,
  styles: [
    `
      .row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        margin-bottom: 0.75rem;
      }
      .field {
        width: 100%;
        max-width: 840px;
      }
      .meta {
        margin: 0.5rem 0;
        font-size: 0.9rem;
        opacity: 0.85;
      }
      .meta.err {
        color: #c62828;
      }
      pre {
        white-space: pre-wrap;
        background: #f6f8fa;
        padding: 1rem;
        border-radius: 8px;
      }
    `,
  ],
})
export class ApiDebugComponent {
  store = inject(ApiDebugStore);
}
