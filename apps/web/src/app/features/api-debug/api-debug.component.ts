import { Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GatewayService } from '../../core/gateway.service';

@Component({
  selector: 'app-api-debug',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, JsonPipe],
  template: `
    <mat-form-field appearance="outline" class="prompt">
      <textarea matInput [value]="prompt()" (input)="prompt.set($any($event.target).value)" placeholder="Prompt"></textarea>
    </mat-form-field>
    <button mat-raised-button color="primary" (click)="send()">Send</button>
    <pre>{{ response() | json }}</pre>
  `,
  styles: [
    `.prompt { width: 100%; }
     pre { white-space: pre-wrap; background: #f5f5f5; padding: 1rem; }`
  ]
})
export class ApiDebugComponent {
  private gateway = inject(GatewayService);
  prompt = signal('');
  response = signal<any>(null);

  async send() {
    const res = await this.gateway.chat(this.prompt());
    this.response.set(res);
  }
}
