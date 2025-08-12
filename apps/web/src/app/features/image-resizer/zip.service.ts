import { Injectable } from '@angular/core';
import JSZip from 'jszip';

@Injectable({ providedIn: 'root' })
export class ZipService {
  private zip = new JSZip();

  addFile(name: string, blob: Blob) {
    this.zip.file(name, blob);
  }

  async generate(): Promise<Blob> {
    return await this.zip.generateAsync({ type: 'blob' });
  }

  reset() {
    this.zip = new JSZip();
  }
}
