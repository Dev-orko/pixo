/**
 * Pixo Engine v4 — High-Performance Grid-Based Image Processor
 *
 * Patterns: horizontal, vertical, cross, diagonal, dots, concentric, wave
 * Preprocessing: contrast, brightness, sharpening
 * Modes: B&W, color, invert
 *
 * Optimizations:
 * - Typed array pixel access with minimal allocations
 * - Batched canvas path operations
 * - Object URL lifecycle management
 * - Alpha-disabled context for faster compositing
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PatternStyle =
  | 'line-h'
  | 'line-v'
  | 'cross'
  | 'diagonal'
  | 'dots'
  | 'concentric'
  | 'wave';

export interface PixelSettings {
  gridSize: number;        // 10–200
  pattern: PatternStyle;
  lineWeight: number;      // 0.2–2.0 multiplier
  contrast: number;        // -100 to 100
  brightness: number;      // -100 to 100
  sharpen: number;         // 0–100
  invert: boolean;
  colorMode: boolean;
  bgOpacity: number;       // 0–100
}

export const DEFAULT_SETTINGS: PixelSettings = {
  gridSize: 80,
  pattern: 'line-h',
  lineWeight: 1.0,
  contrast: 0,
  brightness: 0,
  sharpen: 0,
  invert: false,
  colorMode: false,
  bgOpacity: 100,
};

export const PATTERN_LABELS: Record<PatternStyle, string> = {
  'line-h': 'Horizontal',
  'line-v': 'Vertical',
  cross: 'Cross',
  diagonal: 'Diagonal',
  dots: 'Dots',
  concentric: 'Rings',
  wave: 'Wave',
};

export interface Preset {
  name: string;
  description: string;
  settings: PixelSettings;
}

export const PRESETS: Preset[] = [
  { name: 'Classic', description: 'Clean horizontal lines', settings: { ...DEFAULT_SETTINGS } },
  { name: 'Halftone', description: 'Newspaper dot grid', settings: { ...DEFAULT_SETTINGS, pattern: 'dots', gridSize: 60, lineWeight: 1.2 } },
  { name: 'Blueprint', description: 'Inverted cross hatch', settings: { ...DEFAULT_SETTINGS, pattern: 'cross', invert: true, gridSize: 70, contrast: 20 } },
  { name: 'Fine Detail', description: 'High density thin lines', settings: { ...DEFAULT_SETTINGS, gridSize: 150, lineWeight: 0.5, sharpen: 40 } },
  { name: 'Bold', description: 'Thick strokes high contrast', settings: { ...DEFAULT_SETTINGS, gridSize: 40, lineWeight: 1.6, contrast: 40 } },
  { name: 'Waves', description: 'Organic sine wave pattern', settings: { ...DEFAULT_SETTINGS, pattern: 'wave', gridSize: 80, lineWeight: 1.0 } },
  { name: 'Retro', description: 'Concentric rings', settings: { ...DEFAULT_SETTINGS, pattern: 'concentric', gridSize: 50, lineWeight: 0.8, contrast: 15 } },
  { name: 'Sketch', description: 'Diagonal hatching', settings: { ...DEFAULT_SETTINGS, pattern: 'diagonal', gridSize: 90, lineWeight: 0.7, sharpen: 30 } },
];

// ─── Image Loading (with URL cleanup) ───────────────────────────────────────

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url); // Prevent memory leaks
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function drawImageToCanvas(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  let w = img.width, h = img.height;
  if (w > maxWidth || h > maxHeight) {
    const r = Math.min(maxWidth / w, maxHeight / h);
    w = Math.floor(w * r);
    h = Math.floor(h * r);
  }
  // Even dimensions for subsampling compatibility
  w = Math.floor(w / 2) * 2;
  h = Math.floor(h / 2) * 2;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

// ─── Preprocessing (in-place typed array ops) ───────────────────────────────

function applyBrightnessContrast(
  data: Uint8ClampedArray,
  brightness: number,
  contrast: number,
): void {
  const b = brightness * 2.55;
  const c = contrast / 100;
  const factor = (1 + c) / (1.0001 - c);
  const len = data.length;

  // Process 4 channels at a time, skip alpha
  for (let i = 0; i < len; i += 4) {
    data[i]     = Math.max(0, Math.min(255, factor * (data[i]     - 128) + 128 + b));
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128 + b));
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128 + b));
  }
}

function applySharpen(imageData: ImageData, amount: number): ImageData {
  if (amount <= 0) return imageData;
  const { width: w, height: h, data: src } = imageData;
  const out = new ImageData(w, h);
  const d = out.data;
  const k = amount / 100;

  // Inner pixels — 4-tap Laplacian
  for (let y = 1; y < h - 1; y++) {
    const rowOff = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = (rowOff + x) * 4;
      const up = ((y - 1) * w + x) * 4;
      const dn = ((y + 1) * w + x) * 4;
      const lt = (rowOff + x - 1) * 4;
      const rt = (rowOff + x + 1) * 4;

      for (let ch = 0; ch < 3; ch++) {
        const center = src[idx + ch];
        d[idx + ch] = Math.max(0, Math.min(255,
          center + k * (4 * center - src[up + ch] - src[dn + ch] - src[lt + ch] - src[rt + ch])
        ));
      }
      d[idx + 3] = 255;
    }
  }

  // Copy border pixels
  for (let x = 0; x < w; x++) {
    const t = x * 4, b2 = ((h - 1) * w + x) * 4;
    d[t] = src[t]; d[t+1] = src[t+1]; d[t+2] = src[t+2]; d[t+3] = src[t+3];
    d[b2] = src[b2]; d[b2+1] = src[b2+1]; d[b2+2] = src[b2+2]; d[b2+3] = src[b2+3];
  }
  for (let y = 0; y < h; y++) {
    const l = (y * w) * 4, r = (y * w + w - 1) * 4;
    d[l] = src[l]; d[l+1] = src[l+1]; d[l+2] = src[l+2]; d[l+3] = src[l+3];
    d[r] = src[r]; d[r+1] = src[r+1]; d[r+2] = src[r+2]; d[r+3] = src[r+3];
  }
  return out;
}

// ─── Region Analysis (luminance + color sampling) ───────────────────────────

function regionStats(
  data: Uint8ClampedArray, imgW: number,
  x0: number, y0: number, cw: number, ch: number,
): { luminance: number; r: number; g: number; b: number } {
  let sumL = 0, sumR = 0, sumG = 0, sumB = 0, count = 0;
  const yEnd = y0 + ch, xEnd = x0 + cw;

  for (let y = y0; y < yEnd; y++) {
    const rowBase = y * imgW;
    for (let x = x0; x < xEnd; x++) {
      const idx = (rowBase + x) << 2; // *4 via bit shift
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      sumL += 0.299 * r + 0.587 * g + 0.114 * b;
      sumR += r; sumG += g; sumB += b;
      count++;
    }
  }
  if (count === 0) return { luminance: 255, r: 255, g: 255, b: 255 };
  const inv = 1 / count;
  return { luminance: sumL * inv, r: sumR * inv, g: sumG * inv, b: sumB * inv };
}

// ─── Pattern Renderers ──────────────────────────────────────────────────────

type PR = (
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, cw: number, ch: number,
  darkness: number, lineThick: number, cx: number, cy: number,
) => void;

const renderLineH: PR = (ctx, x0, _y0, cw, _ch, _d, lt, _cx, cy) => {
  ctx.lineWidth = lt;
  ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x0 + cw, cy); ctx.stroke();
};

const renderLineV: PR = (ctx, x0, y0, _cw, ch, _d, lt, cx) => {
  ctx.lineWidth = lt;
  ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, y0 + ch); ctx.stroke();
};

const renderCross: PR = (ctx, x0, y0, cw, ch, _d, lt, cx, cy) => {
  ctx.lineWidth = lt;
  ctx.beginPath();
  ctx.moveTo(x0, cy); ctx.lineTo(x0 + cw, cy);
  ctx.moveTo(cx, y0); ctx.lineTo(cx, y0 + ch);
  ctx.stroke();
};

const renderDiagonal: PR = (ctx, x0, y0, cw, ch, darkness, lt) => {
  ctx.lineWidth = lt;
  ctx.beginPath(); ctx.moveTo(x0, y0 + ch); ctx.lineTo(x0 + cw, y0); ctx.stroke();
  if (darkness > 0.45) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + cw, y0 + ch); ctx.stroke();
  }
};

const renderDots: PR = (ctx, _x0, _y0, cw, ch, darkness, _lt, cx, cy) => {
  const maxR = Math.min(cw, ch) * 0.45;
  const r = Math.max(0.5, darkness * maxR);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
};

const renderConcentric: PR = (ctx, _x0, _y0, cw, ch, darkness, lt, cx, cy) => {
  const maxR = Math.min(cw, ch) * 0.45;
  const rings = Math.max(1, Math.floor(darkness * 3));
  ctx.lineWidth = Math.max(0.5, lt * 0.6);
  for (let i = 1; i <= rings; i++) {
    const r = (i / rings) * maxR * darkness;
    if (r < 0.5) continue;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }
};

const renderWave: PR = (ctx, x0, _y0, cw, ch, darkness, lt, _cx, cy) => {
  ctx.lineWidth = lt;
  const amp = ch * 0.35 * darkness;
  const steps = 12;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x0 + t * cw;
    const py = cy + Math.sin(t * Math.PI * 2) * amp;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
};

const RENDERERS: Record<PatternStyle, PR> = {
  'line-h': renderLineH, 'line-v': renderLineV, cross: renderCross,
  diagonal: renderDiagonal, dots: renderDots, concentric: renderConcentric, wave: renderWave,
};

// ─── Main Conversion ────────────────────────────────────────────────────────

export interface ConversionResult {
  canvas: HTMLCanvasElement;
  processingTimeMs: number;
  gridCols: number;
  gridRows: number;
  totalCells: number;
}

export function convertToPixelArt(
  sourceCanvas: HTMLCanvasElement,
  settings: PixelSettings,
): ConversionResult {
  const t0 = performance.now();
  const { gridSize, pattern, lineWeight, contrast, brightness, sharpen, invert, colorMode, bgOpacity } = settings;

  const srcCtx = sourceCanvas.getContext('2d', { alpha: false })!;
  const W = sourceCanvas.width, H = sourceCanvas.height;
  let imgData = srcCtx.getImageData(0, 0, W, H);

  // Preprocessing
  if (brightness !== 0 || contrast !== 0) applyBrightnessContrast(imgData.data, brightness, contrast);
  if (sharpen > 0) imgData = applySharpen(imgData, sharpen);
  const data = imgData.data;

  // Grid calculations
  const cellW = W / gridSize;
  const aspectRatio = H / W;
  const gridH = Math.max(1, Math.round(gridSize * aspectRatio));
  const cellH = H / gridH;

  // Output canvas (alpha: false for faster compositing)
  const outCanvas = document.createElement('canvas');
  outCanvas.width = W; outCanvas.height = H;
  const ctx = outCanvas.getContext('2d', { alpha: false })!;

  // Background fill
  if (invert) {
    ctx.fillStyle = bgOpacity >= 100 ? '#0f0f0f' : `rgba(15,15,15,${bgOpacity / 100})`;
  } else {
    ctx.fillStyle = bgOpacity >= 100 ? '#ffffff' : `rgba(255,255,255,${bgOpacity / 100})`;
  }
  ctx.fillRect(0, 0, W, H);

  // Drawing setup
  const fgBase = invert ? '#ffffff' : '#000000';
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  const renderer = RENDERERS[pattern];

  // Pre-set stroke/fill for non-color mode (avoid per-cell state changes)
  if (!colorMode) {
    ctx.strokeStyle = fgBase;
    ctx.fillStyle = fgBase;
  }

  // Render grid
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const x0 = Math.floor(gx * cellW);
      const y0 = Math.floor(gy * cellH);
      const cw = Math.floor((gx + 1) * cellW) - x0;
      const ch2 = Math.floor((gy + 1) * cellH) - y0;

      const stats = regionStats(data, W, x0, y0, cw, ch2);
      let darkness = 1 - stats.luminance / 255;
      if (invert) darkness = 1 - darkness;
      if (darkness < 0.03) continue;

      const maxThick = Math.min(cw, ch2) * 0.85;
      const lineThick = Math.max(0.3, darkness * maxThick * lineWeight);

      if (colorMode) {
        const r = Math.round(invert ? 255 - stats.r : stats.r);
        const g = Math.round(invert ? 255 - stats.g : stats.g);
        const b = Math.round(invert ? 255 - stats.b : stats.b);
        const color = `rgb(${255 - r},${255 - g},${255 - b})`;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
      }

      renderer(ctx, x0, y0, cw, ch2, darkness, lineThick, x0 + cw / 2, y0 + ch2 / 2);
    }
  }

  return {
    canvas: outCanvas,
    processingTimeMs: Math.round(performance.now() - t0),
    gridCols: gridSize,
    gridRows: gridH,
    totalCells: gridSize * gridH,
  };
}

// ─── Export Utilities ────────────────────────────────────────────────────────

export type ExportFormat = 'png' | 'jpeg' | 'webp';

export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  format: ExportFormat = 'png',
  quality = 1.0,
) {
  const mimeType = `image/${format}`;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL(mimeType, quality);
  link.click();
}

export function exportAtScale(
  sourceCanvas: HTMLCanvasElement,
  settings: PixelSettings,
  scale: number,
): HTMLCanvasElement {
  const up = document.createElement('canvas');
  up.width = Math.round(sourceCanvas.width * scale);
  up.height = Math.round(sourceCanvas.height * scale);
  const ctx = up.getContext('2d', { alpha: false })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, up.width, up.height);
  return convertToPixelArt(up, settings).canvas;
}
