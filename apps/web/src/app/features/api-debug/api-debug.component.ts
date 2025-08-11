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
    NgIf, NgFor, JsonPipe,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
  ],
  providers: [ApiDebugStore],
  templateUrl: './api-debug.component.html',
  styleUrls: ['./api-debug.component.scss'],
})
export class ApiDebugComponent {
  store = inject(ApiDebugStore);
}
