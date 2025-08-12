/// <reference lib="webworker" />

interface ProcessRequest {
  id: number;
  op: 'process';
  fileName: string;
  arrayBuffer: ArrayBuffer;
  settings: ResizeSettings;
}

interface ResizeSettings {
  preset?: number | null;
  customWidth?: number | null;
  customHeight?: number | null;
  percentage?: number | null;
  aspectLock: boolean;
  mode: 'fit' | 'cover' | 'stretch' | 'contain';
  background: string;
  format: 'original' | 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number;
  stripMetadata: boolean;
  originalType: string;
}

interface ProcessResult {
  fileName: string;
  arrayBuffer: ArrayBuffer;
  mimeType: string;
  width: number;
  height: number;
  bytes: number;
}

addEventListener('message', async ({ data }) => {
  const msg = data as ProcessRequest;
  if (msg.op !== 'process') return;
  try {
    const blob = new Blob([msg.arrayBuffer]);
    let bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;

    const { targetWidth, targetHeight } = computeTargetDimensions(originalWidth, originalHeight, msg.settings);
    const { canvas, width, height } = drawBitmap(bitmap, targetWidth, targetHeight, msg.settings);

    const mimeType = msg.settings.format === 'original' ? msg.settings.originalType : msg.settings.format;
    const outBlob = await canvas.convertToBlob({ type: mimeType, quality: msg.settings.quality });
    const ab = await outBlob.arrayBuffer();
    const result: ProcessResult = {
      fileName: msg.fileName,
      arrayBuffer: ab,
      mimeType,
      width,
      height,
      bytes: outBlob.size,
    };
    (postMessage as any)({ id: msg.id, status: 'done', result }, [ab]);
  } catch (err: any) {
    (postMessage as any)({ id: msg.id, status: 'error', error: err?.message ?? 'Unknown error' });
  }
});

function computeTargetDimensions(w: number, h: number, s: ResizeSettings) {
  let tw = w;
  let th = h;
  if (s.preset) {
    tw = s.preset;
    th = Math.round((h / w) * tw);
  }
  if (s.percentage) {
    tw = Math.round(w * s.percentage / 100);
    th = Math.round(h * s.percentage / 100);
  }
  if (s.customWidth) {
    tw = s.customWidth;
    th = s.aspectLock ? Math.round((h / w) * tw) : (s.customHeight ?? th);
  }
  if (s.customHeight) {
    th = s.customHeight;
    tw = s.aspectLock ? Math.round((w / h) * th) : (s.customWidth ?? tw);
  }
  if (s.customWidth && s.customHeight && !s.aspectLock) {
    tw = s.customWidth;
    th = s.customHeight;
  }
  return { targetWidth: tw, targetHeight: th };
}

function drawBitmap(bitmap: ImageBitmap, tw: number, th: number, s: ResizeSettings) {
  let canvas: OffscreenCanvas;
  let ctx: OffscreenCanvasRenderingContext2D;
  let width = tw;
  let height = th;
  const ow = bitmap.width;
  const oh = bitmap.height;

  if (s.mode === 'fit') {
    const scale = Math.min(tw / ow, th / oh);
    width = Math.round(ow * scale);
    height = Math.round(oh * scale);
    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, width, height);
  } else if (s.mode === 'cover') {
    canvas = new OffscreenCanvas(tw, th);
    ctx = canvas.getContext('2d')!;
    const scale = Math.max(tw / ow, th / oh);
    const dw = ow * scale;
    const dh = oh * scale;
    const dx = (tw - dw) / 2;
    const dy = (th - dh) / 2;
    ctx.drawImage(bitmap, dx, dy, dw, dh);
    width = tw;
    height = th;
  } else if (s.mode === 'stretch') {
    canvas = new OffscreenCanvas(tw, th);
    ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, tw, th);
    width = tw;
    height = th;
  } else { // contain with background
    canvas = new OffscreenCanvas(tw, th);
    ctx = canvas.getContext('2d')!;
    ctx.fillStyle = s.background || '#ffffff';
    ctx.fillRect(0, 0, tw, th);
    const scale = Math.min(tw / ow, th / oh);
    const dw = ow * scale;
    const dh = oh * scale;
    const dx = (tw - dw) / 2;
    const dy = (th - dh) / 2;
    ctx.drawImage(bitmap, dx, dy, dw, dh);
    width = tw;
    height = th;
  }
  return { canvas, width, height };
}
