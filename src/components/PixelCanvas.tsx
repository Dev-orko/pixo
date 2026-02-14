'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { PixelSettings, PATTERN_LABELS, ConversionResult } from '@/lib/pixelEngine';

interface PixelCanvasProps {
  sourceImage: HTMLImageElement | null;
  resultCanvas: HTMLCanvasElement | null;
  conversionResult: ConversionResult | null;
  isProcessing: boolean;
  settings: PixelSettings;
  sourceCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function PixelCanvas({
  sourceImage,
  resultCanvas,
  conversionResult,
  isProcessing,
  settings,
}: PixelCanvasProps) {
  const displayRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(100);
  const [containerSize, setContainerSize] = useState({ w: 600, h: 400 });
  const [prevResult, setPrevResult] = useState<HTMLCanvasElement | null>(null);

  // Reset zoom on new result
  if (prevResult !== resultCanvas) {
    setPrevResult(resultCanvas);
    setZoom(100);
  }

  // Measure viewport with ResizeObserver
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw result (or source placeholder) onto display canvas
  useEffect(() => {
    const canvas = displayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    if (resultCanvas) {
      canvas.width = resultCanvas.width;
      canvas.height = resultCanvas.height;
      ctx.drawImage(resultCanvas, 0, 0);
    } else if (sourceImage) {
      const max = 800;
      let w = sourceImage.width, h = sourceImage.height;
      if (w > max || h > max) {
        const r = Math.min(max / w, max / h);
        w = Math.floor(w * r); h = Math.floor(h * r);
      }
      canvas.width = w; canvas.height = h;
      ctx.filter = 'grayscale(100%)';
      ctx.drawImage(sourceImage, 0, 0, w, h);
    } else {
      canvas.width = 640; canvas.height = 400;
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, 640, 400);
    }
  }, [resultCanvas, sourceImage]);

  // Zoom helpers — keep viewport center stable
  const doZoom = useCallback((newZoom: number) => {
    const vp = viewportRef.current;
    if (!vp) { setZoom(newZoom); return; }

    const oldZoom = zoom;
    const cx = vp.scrollLeft + vp.clientWidth / 2;
    const cy = vp.scrollTop + vp.clientHeight / 2;

    setZoom(newZoom);

    requestAnimationFrame(() => {
      const scale = newZoom / oldZoom;
      vp.scrollLeft = cx * scale - vp.clientWidth / 2;
      vp.scrollTop = cy * scale - vp.clientHeight / 2;
    });
  }, [zoom]);

  const zoomIn = useCallback(() => doZoom(Math.min(400, zoom + 25)), [zoom, doZoom]);
  const zoomOut = useCallback(() => doZoom(Math.max(25, zoom - 25)), [zoom, doZoom]);
  const zoomFit = useCallback(() => doZoom(100), [doZoom]);

  // Ctrl+Wheel zoom
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -15 : 15;
      setZoom(prev => Math.max(25, Math.min(400, prev + delta)));
    };
    vp.addEventListener('wheel', handleWheel, { passive: false });
    return () => vp.removeEventListener('wheel', handleWheel);
  }, []);

  // Derive canvas dimensions
  const canvasSize = useMemo(() => {
    if (resultCanvas) return { w: resultCanvas.width, h: resultCanvas.height };
    if (sourceImage) {
      const max = 800;
      let w = sourceImage.width, h = sourceImage.height;
      if (w > max || h > max) {
        const r = Math.min(max / w, max / h);
        w = Math.floor(w * r); h = Math.floor(h * r);
      }
      return { w, h };
    }
    return { w: 640, h: 400 };
  }, [resultCanvas, sourceImage]);

  const cw = canvasSize.w;
  const ch = canvasSize.h;
  const pad = 16;
  const availW = Math.max(containerSize.w - pad * 2, 100);
  const availH = Math.max(containerSize.h - pad * 2, 100);
  const fitScale = Math.min(availW / cw, availH / ch, 1);
  const displayW = Math.round(cw * fitScale * (zoom / 100));
  const displayH = Math.round(ch * fitScale * (zoom / 100));

  const innerW = Math.max(displayW + pad * 2, containerSize.w);
  const innerH = Math.max(displayH + pad * 2, containerSize.h);

  const patternLabel = PATTERN_LABELS[settings.pattern] || 'Horizontal';

  return (
    <div className="flex flex-col w-full gap-1 sm:gap-1.5 flex-1 min-h-0">
      {/* Viewport */}
      <div
        ref={viewportRef}
        className="relative w-full overflow-auto rounded-xl sm:rounded-2xl border border-[#d3d3d3] flex-1 min-h-0 overscroll-contain touch-pan-x touch-pan-y"
        style={{ background: settings.invert ? '#1a1a1a' : '#fafafa' }}
        role="img"
        aria-label={resultCanvas ? `Processed image with ${patternLabel} pattern` : 'Image preview'}
      >
        <div
          className="flex items-center justify-center"
          style={{ width: innerW, height: innerH }}
        >
          <canvas
            ref={displayRef}
            style={{
              display: 'block',
              width: displayW,
              height: displayH,
              filter: isProcessing ? 'brightness(0.8) blur(1px)' : 'none',
              transition: 'filter 0.2s ease',
              borderRadius: '4px',
              boxShadow: resultCanvas ? '0 2px 20px rgba(11,11,11,0.06)' : 'none',
            }}
          />
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none" role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-2 bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg shadow-neutral-300/30">
              <div className="w-5 h-5 border-2 border-neutral-300 border-t-[#0b0b0b] rounded-full animate-spin" aria-hidden="true" />
              <span className="text-[10px] sm:text-[11px] text-[#0b0b0b] uppercase tracking-[0.12em] font-semibold">Processing</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!sourceImage && !isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-neutral-400 sm:w-8 sm:h-8" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 text-center">Upload an image to begin</p>
          </div>
        )}

        {/* Zoom controls — floating, touch-friendly */}
        {sourceImage && (
          <div
            className="sticky bottom-2 sm:bottom-3 float-right mr-2 sm:mr-3 z-10 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm border border-[#d3d3d3] rounded-xl px-1 py-1 shadow-sm"
            style={{ marginTop: '-48px' }}
            role="toolbar"
            aria-label="Zoom controls"
          >
            <button
              onClick={zoomOut}
              aria-label="Zoom out"
              className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-[#0b0b0b] hover:bg-neutral-100 active:bg-neutral-200 transition-colors text-base font-medium"
            >
              −
            </button>
            <button
              onClick={zoomFit}
              aria-label={`Zoom level ${zoom}%, click to reset to 100%`}
              className="px-1.5 h-9 sm:h-8 flex items-center justify-center rounded-lg text-[10px] font-mono text-neutral-500 hover:text-[#0b0b0b] hover:bg-neutral-100 transition-colors min-w-[48px] sm:min-w-[42px]"
            >
              {zoom}%
            </button>
            <button
              onClick={zoomIn}
              aria-label="Zoom in"
              className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-[#0b0b0b] hover:bg-neutral-100 active:bg-neutral-200 transition-colors text-base font-medium"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Info bar */}
      {resultCanvas && conversionResult && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-1 shrink-0" aria-live="polite">
          <span className="text-[9px] sm:text-[11px] font-mono text-neutral-400">
            {conversionResult.gridCols}&times;{conversionResult.gridRows} &bull; {conversionResult.totalCells.toLocaleString()} cells &bull; {conversionResult.processingTimeMs}ms
          </span>
          <span className="text-[9px] sm:text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            {settings.gridSize}px &bull; {patternLabel}
            {settings.invert ? ' &bull; Inv' : ''}
            {settings.colorMode ? ' &bull; Color' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
