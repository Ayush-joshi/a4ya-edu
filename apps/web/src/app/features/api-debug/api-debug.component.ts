import { Component, inject, signal, effect } from '@angular/core';
import { JsonPipe, NgIf, NgFor } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { GatewayService } from '../../core/gateway.service';

@Component({
  selector: 'app-api-debug',
  standalone: true,
  imports: [NgIf, NgFor, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, JsonPipe],
  template: `
    <div class="row">
      <mat-form-field appearance="outline" class="model">
        <mat-label>Model</mat-label>
        <mat-select [value]="selectedModel()" (selectionChange)="selectedModel.set($event.value)">
          <mat-option *ngFor="let m of chatModels()" [value]="m">{{ m }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <mat-form-field appearance="outline" class="prompt">
      <textarea matInput
        [value]="prompt()"
        (input)="prompt.set($any($event.target).value)"
        placeholder="Prompt"></textarea>
    </mat-form-field>

    <button mat-raised-button color="primary" (click)="send()">Send</button>
    <pre>{{ response() | json }}</pre>
  `,
  styles: [`
    .row { display: flex; gap: 1rem; }
    .model { width: 100%; max-width: 600px; }
    .prompt { width: 100%; margin-top: 1rem; }
    pre { white-space: pre-wrap; background: #f5f5f5; padding: 1rem; margin-top: 1rem; }
  `]
})
export class ApiDebugComponent {
  private gateway = inject(GatewayService);

  prompt = signal('');
  response = signal<any>(null);
  chatModels = signal<string[]>([]);
  selectedModel = signal<string | null>(null);

  constructor() {
    // load models once
    this.loadModels();
  }

  private async loadModels() {
    try {
      const models = await this.gateway.getModels();
      this.chatModels.set(models.chat || []);
      // preselect first model
      if (models.chat?.length) this.selectedModel.set(models.chat[0]);
    } catch (e) {
      console.error('Failed to load models', e);
      this.chatModels.set([]);
      this.selectedModel.set(null);
    }
  }

  async send() {
    const model = this.selectedModel();
    const prompt = this.prompt().trim();
    if (!prompt) return;

    const res = await this.gateway.chat({
      model, // <-- runtime selection
      messages: [{ role: 'user', content: prompt }]
    });

    this.response.set(res);
  }
}
