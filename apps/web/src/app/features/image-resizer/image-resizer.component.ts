import { Component, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DownloadService } from './download.service';
import { ZipService } from './zip.service';

interface FileItem {
  id: number;
  file: File;
  name: string;
  size: number;
  originalWidth?: number;
  originalHeight?: number;
  previewUrl?: string;
  selected: boolean;
  status: 'queued' | 'processing' | 'done' | 'error';
  result?: {
    blob: Blob;
    url: string;
    mimeType: string;
    width: number;
    height: number;
    bytes: number;
    fileName: string;
  };
}

@Component({
  selector: 'app-image-resizer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  templateUrl: './image-resizer.component.html',
  styleUrls: ['./image-resizer.component.scss'],
})
export class ImageResizerComponent implements OnDestroy {
  private worker = new Worker(new URL('./image-processing.worker', import.meta.url), {
    type: 'module',
  });
  private nextId = 0;

  readonly files = signal<FileItem[]>([]);
  readonly presets = [256, 512, 1024, 1920, 3840];

  readonly preset = signal<number | null>(null);
  readonly customWidth = signal<number | null>(null);
  readonly customHeight = signal<number | null>(null);
  readonly percentage = signal<number | null>(null);
  readonly aspectLock = signal(true);
  readonly mode = signal<'fit' | 'cover' | 'stretch' | 'contain'>('fit');
  readonly background = signal('#ffffff');
  readonly format = signal<'original' | 'image/jpeg' | 'image/png' | 'image/webp'>('original');
  readonly quality = signal(0.8);
  readonly stripMetadata = signal(true);
  readonly previewMode = signal<'before' | 'after'>('after');
  readonly processing = signal(false);
  allSelected = false;

  readonly selectedFiles = computed(() => this.files().filter(f => f.selected));
  readonly previewFile = computed(() => this.selectedFiles()[0] ?? this.files()[0]);
  readonly filenamePreview = computed(() => {
    const f = this.previewFile();
    if (!f) return '';
    const base = f.name.replace(/\.[^.]+$/, '');
    const width = f.result?.width || f.originalWidth || 0;
    const height = f.result?.height || f.originalHeight || 0;
    const ext = this.format() === 'original' ? (f.file.type.split('/')[1] || 'png') : this.format().split('/')[1];
    return `${base}_${width}x${height}.${ext}`;
  });
  readonly hasAnyProcessed = computed(() => this.files().some(f => f.status === 'done'));
  readonly hasProcessedSelected = computed(() => this.selectedFiles().some(f => f.status === 'done'));

  constructor(private snack: MatSnackBar, private downloader: DownloadService, private zipper: ZipService) {
    this.worker.onmessage = this.onWorkerMessage.bind(this);
    effect(() => {
      const all = this.files().length > 0 && this.files().every(f => f.selected);
      this.allSelected = all;
    });
  }

  private onWorkerMessage(ev: MessageEvent<any>) {
    const { id, status, result, error } = ev.data;
    const files = this.files();
    const idx = files.findIndex(f => f.id === id);
    if (idx === -1) return;
    const item = files[idx];
    if (status === 'done') {
      const blob = new Blob([result.arrayBuffer], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      item.result = {
        blob,
        url,
        mimeType: result.mimeType,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        fileName: this.buildFileName(item, result.mimeType, result.width, result.height),
      };
      item.status = 'done';
    } else {
      item.status = 'error';
      this.snack.open(error || 'Processing failed', undefined, { duration: 3000 });
    }
    this.files.set([...files]);
    if (!this.files().some(f => f.status === 'processing')) {
      this.processing.set(false);
    }
  }

  private buildFileName(item: FileItem, mime: string, w: number, h: number) {
    const base = item.name.replace(/\.[^.]+$/, '');
    const ext = this.format() === 'original' ? (mime.split('/')[1] || 'png') : this.format().split('/')[1];
    return `${base}_${w}x${h}.${ext}`;
  }

  async addFiles(list: FileList) {
    for (const file of Array.from(list)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.snack.open('Unsupported file type', undefined, { duration: 2000 });
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        this.snack.open('File too large', undefined, { duration: 2000 });
        continue;
      }
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (bitmap.width > 10000 || bitmap.height > 10000) {
        this.snack.open('Image dimensions too large', undefined, { duration: 2000 });
        continue;
      }
      const url = URL.createObjectURL(file);
      const item: FileItem = {
        id: ++this.nextId,
        file,
        name: file.name,
        size: file.size,
        originalWidth: bitmap.width,
        originalHeight: bitmap.height,
        previewUrl: url,
        selected: true,
        status: 'queued',
      };
      this.files.set([...this.files(), item]);
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
      input.value = '';
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  applyPreset(p: number) {
    this.preset.set(p);
    this.customWidth.set(null);
    this.customHeight.set(null);
    this.percentage.set(null);
  }

  async processSelected() {
    const items = this.selectedFiles();
    if (!items.length) return;
    this.processing.set(true);
    for (const item of items) {
      if (item.status === 'processing') continue;
      item.status = 'processing';
      const arrayBuffer = await item.file.arrayBuffer();
      const settings = {
        preset: this.preset(),
        customWidth: this.customWidth(),
        customHeight: this.customHeight(),
        percentage: this.percentage(),
        aspectLock: this.aspectLock(),
        mode: this.mode(),
        background: this.background(),
        format: this.format(),
        quality: this.quality(),
        stripMetadata: this.stripMetadata(),
        originalType: item.file.type,
      };
      this.worker.postMessage({ id: item.id, op: 'process', fileName: item.name, arrayBuffer, settings }, [arrayBuffer]);
    }
  }

  downloadSelected() {
    for (const item of this.selectedFiles()) {
      if (item.result) {
        this.downloader.downloadBlob(item.result.fileName, item.result.blob);
      }
    }
  }

  async downloadAll() {
    for (const item of this.files()) {
      if (item.result) {
        this.zipper.addFile(item.result.fileName, item.result.blob);
      }
    }
    const blob = await this.zipper.generate();
    this.downloader.downloadBlob('images.zip', blob);
    this.zipper.reset();
  }

  reset() {
    this.files().forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      if (f.result?.url) URL.revokeObjectURL(f.result.url);
    });
    this.files.set([]);
    this.zipper.reset();
    this.preset.set(null);
    this.customWidth.set(null);
    this.customHeight.set(null);
    this.percentage.set(null);
    this.previewMode.set('after');
  }

  togglePreview() {
    this.previewMode.set(this.previewMode() === 'before' ? 'after' : 'before');
  }

  toggleAll(val: boolean) {
    this.files.set(this.files().map(f => ({ ...f, selected: val })));
  }

  trackById = (_: number, it: FileItem) => it.id;

  ngOnDestroy() {
    this.worker.terminate();
    this.reset();
  }
}
