'use client';

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';
import PixelCanvas from '@/components/PixelCanvas';
import ControlsPanel from '@/components/ControlsPanel';
import {
  PixelSettings,
  DEFAULT_SETTINGS,
  loadImage,
  drawImageToCanvas,
  convertToPixelArt,
  downloadCanvas,
  ConversionResult,
  ExportFormat,
} from '@/lib/pixelEngine';

export default function Home() {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [resultCanvas, setResultCanvas] = useState<HTMLCanvasElement | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [settings, setSettings] = useState<PixelSettings>(DEFAULT_SETTINGS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showMobileControls, setShowMobileControls] = useState(false);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Auto-convert with optimized scheduling ───
  useEffect(() => {
    if (!sourceCanvasRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setIsProcessing(true);

      const scheduleWork = typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback
        : (cb: () => void) => requestAnimationFrame(() => setTimeout(cb, 0));

      scheduleWork(() => {
        try {
          const result = convertToPixelArt(sourceCanvasRef.current!, settings);
          setResultCanvas(result.canvas);
          setConversionResult(result);
        } catch (err) {
          console.error('Processing failed:', err);
        } finally {
          setIsProcessing(false);
        }
      });
    }, 100);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [settings, sourceImage]);

  // ─── Handlers ───
  const handleImageSelect = useCallback(async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      alert('Image is too large. Please use an image under 20 MB.');
      return;
    }
    try {
      setFileName(file.name);
      setIsProcessing(true);
      const img = await loadImage(file);
      const canvas = drawImageToCanvas(img, 1200, 1200);
      sourceCanvasRef.current = canvas;
      setSourceImage(img);
      setResultCanvas(null);
      setConversionResult(null);
    } catch {
      console.error('Failed to load image');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setSourceImage(null);
    setResultCanvas(null);
    setConversionResult(null);
    setSettings(DEFAULT_SETTINGS);
    setFileName('');
    setIsProcessing(false);
    sourceCanvasRef.current = null;
  }, []);

  const handleDownload = useCallback((format: ExportFormat) => {
    if (!resultCanvas) return;
    const baseName = fileName.replace(/\.[^.]+$/, '') || 'pixo-art';
    downloadCanvas(resultCanvas, `${baseName}_pixo.${format}`, format);
  }, [resultCanvas, fileName]);

  // ─── Render ───
  return (
    <div className="h-dvh flex flex-col bg-[#f4f4f4] overflow-hidden">
      {/* Skip link — a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0b0b0b] focus:text-white focus:rounded-lg focus:text-sm"
      >
        Skip to main content
      </a>

      {/* ─── Header ─── */}
      <header
        role="banner"
        className="z-30 bg-[#f4f4f4]/80 backdrop-blur-xl border-b border-[#d3d3d3] shrink-0 safe-top animate-slide-down"
      >
        <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between safe-x">
          <button
            onClick={handleReset}
            aria-label="Pixo — Return to homepage"
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer"
          >
            <Image
              src="/pixo.svg"
              alt=""
              width={44}
              height={44}
              className="w-10 h-10 sm:w-11 sm:h-11"
              priority
            />
            <div className="text-left">
              <span className="text-base sm:text-lg font-extrabold text-[#0b0b0b] tracking-tight leading-none block">
                Pixo
              </span>
              <span className="text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-semibold leading-none mt-0.5 block">
                Grid Art Maker
              </span>
            </div>
          </button>

          {sourceImage && (
            <div className="flex items-center gap-2 text-[11px] text-neutral-500" aria-live="polite">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="truncate max-w-24 sm:max-w-40 hidden sm:inline">{fileName}</span>
            </div>
          )}
        </nav>
      </header>

      {/* ─── Main ─── */}
      <main
        id="main-content"
        role="main"
        className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 overflow-hidden flex flex-col safe-x"
      >
        {!sourceImage ? (
          <>
            {/* Hero */}
            <section
              className="relative flex flex-col items-center text-center mb-3 sm:mb-5 shrink-0 overflow-hidden"
              aria-label="Welcome"
            >
              {/* Decorative grid */}
              <div
                className="absolute inset-0 -z-10 opacity-[0.04]"
                aria-hidden="true"
                style={{
                  backgroundImage: `repeating-linear-gradient(0deg, #0b0b0b 0px, transparent 1px, transparent 24px),
                    repeating-linear-gradient(90deg, #0b0b0b 0px, transparent 1px, transparent 24px)`,
                  backgroundSize: '24px 24px',
                  maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%)',
                }}
              />

              <h2
                className="text-[1.65rem] leading-[1.15] sm:text-4xl md:text-5xl font-black text-[#0b0b0b] tracking-tight sm:leading-[1.1] max-w-3xl px-2 sm:px-4 animate-fade-up animation-delay-250"
              >
                Turn photos into
                <br className="hidden sm:block" />
                <span className="relative inline-block mt-0.5 sm:mt-1">
                  <span className="relative z-10">stunning grid art</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 w-full h-2 sm:h-3 bg-[#0b0b0b]/8 -skew-x-2 rounded-sm origin-left animate-scale-x animation-delay-550" aria-hidden="true" />
                </span>
              </h2>

              <p
                className="mt-2 sm:mt-3 text-[11px] sm:text-sm md:text-base text-neutral-500 max-w-[280px] sm:max-w-xl leading-relaxed px-2 sm:px-4 animate-fade-up animation-delay-450"
              >
                Upload any photo and transform it into beautiful pattern artwork.
                <span className="hidden sm:inline"> 7 styles, real-time tuning, hi-res export.</span>
              </p>
            </section>

            {/* Upload + Features */}
            <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col min-h-0 animate-fade-up-scale animation-delay-400">
              <div className="flex-1 min-h-[160px] sm:min-h-[220px]">
                <ImageUpload onImageSelect={handleImageSelect} isProcessing={isProcessing} />
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mt-3 sm:mt-4 shrink-0 pb-1" role="list" aria-label="Features">
                <FeatureCard icon="patterns" title="7 Patterns" desc="Lines, dots, waves & more" number="01" className="animate-fade-up-scale animation-delay-600" />
                <FeatureCard icon="realtime" title="Real-time" desc="Instant live preview" number="02" className="animate-fade-up-scale animation-delay-680" />
                <FeatureCard icon="export" title="Hi-Res" desc="PNG & JPG export" number="03" className="animate-fade-up-scale animation-delay-760" />
              </div>
            </div>
          </>
        ) : (
          /* ─── Editor view ─── */
          <div className="relative flex flex-col lg:flex-row gap-3 lg:gap-4 flex-1 min-h-0 animate-fade-up animation-delay-0">
            {/* Canvas area — full screen on mobile */}
            <div className="flex-1 min-w-0 flex flex-col gap-2 min-h-0">
              {/* Canvas preview wrapper */}
              <div className="flex-1 min-h-0 bg-gradient-to-br from-neutral-50/50 to-neutral-100/30 rounded-xl p-1.5 border border-neutral-200/50">
                <PixelCanvas
                  sourceImage={sourceImage}
                  resultCanvas={resultCanvas}
                  conversionResult={conversionResult}
                  isProcessing={isProcessing}
                  settings={settings}
                  sourceCanvasRef={sourceCanvasRef}
                />
              </div>

              {/* Desktop replace button */}
              <div className="hidden lg:flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => document.getElementById('file-input-bottom')?.click()}
                  aria-label="Replace current image"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b0b0b] text-white
                    text-[11px] font-bold uppercase tracking-wider
                    hover:bg-[#222] active:bg-black transition-all shadow-sm"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                  </svg>
                  Replace
                </button>
                <input
                  id="file-input-bottom"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageSelect(f);
                    e.target.value = '';
                  }}
                  className="hidden"
                  aria-label="Choose replacement image"
                />
                <span className="text-[10px] text-neutral-500 truncate flex-1 font-medium">{fileName}</span>
              </div>
            </div>

            {/* Desktop controls panel — sticky sidebar */}
            <div className="hidden lg:block w-[330px] xl:w-[345px] shrink-0">
              <div className="sticky top-[65px] max-h-[calc(100vh-73px)] overflow-y-auto scrollbar-thin">
                <ControlsPanel
                  settings={settings}
                  onSettingsChange={setSettings}
                  onReset={handleReset}
                  onDownload={handleDownload}
                  hasResult={!!resultCanvas}
                  isProcessing={isProcessing}
                />
              </div>
            </div>

            {/* Mobile: Bottom action bar (when controls hidden) */}
            <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#d3d3d3] safe-bottom transition-all duration-300 z-40 ${showMobileControls ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <button
                  onClick={() => document.getElementById('file-input-mobile')?.click()}
                  className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#f4f4f4] text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300 transition-colors"
                  aria-label="Replace image"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                  </svg>
                </button>
                <input
                  id="file-input-mobile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageSelect(f);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => setShowMobileControls(true)}
                  className="flex-1 flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#0b0b0b] text-white font-semibold text-sm hover:bg-[#222] active:bg-[#000] transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6M12 17v6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M1 12h6M17 12h6M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2" strokeLinecap="round" />
                  </svg>
                  Settings
                </button>
                <button
                  onClick={() => handleDownload('png')}
                  disabled={!resultCanvas}
                  className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#f4f4f4] text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Download PNG"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile: Bottom sheet controls */}
            {showMobileControls && (
              <>
                {/* Backdrop overlay */}
                <div
                  className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
                  onClick={() => setShowMobileControls(false)}
                  aria-hidden="true"
                />
                {/* Bottom sheet */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[85dvh] flex flex-col animate-slide-up safe-bottom">
                  {/* Drag handle */}
                  <div className="flex items-center justify-center py-2 px-4 shrink-0">
                    <button
                      onClick={() => setShowMobileControls(false)}
                      className="w-10 h-1 bg-neutral-300 rounded-full"
                      aria-label="Close settings"
                    />
                  </div>
                  {/* Controls content */}
                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    <ControlsPanel
                      settings={settings}
                      onSettingsChange={setSettings}
                      onReset={() => { handleReset(); setShowMobileControls(false); }}
                      onDownload={(fmt) => { handleDownload(fmt); setShowMobileControls(false); }}
                      hasResult={!!resultCanvas}
                      isProcessing={isProcessing}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer role="contentinfo" className="bg-[#0b0b0b] shrink-0 safe-bottom animate-fade-up animation-delay-500">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between safe-x">
          <div className="flex items-center gap-1.5">
            <Image src="/pixo.svg" alt="" width={20} height={20} className="w-5 h-5" loading="lazy" />
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Pixo</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-neutral-500">
            Made by{' '}
            <a
              href="https://www.biswasorko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-semibold hover:underline focus-visible:underline"
            >
              Orko Biswas
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

// ─── Feature Card — memoized ────────────────────────────────────────────────

const FEATURE_ICONS = {
  patterns: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  realtime: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  export: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
} as const;

const FeatureCard = memo(function FeatureCard({
  icon, title, desc, number, className = '',
}: {
  icon: keyof typeof FEATURE_ICONS;
  title: string;
  desc: string;
  number?: string;
  className?: string;
}) {
  return (
    <div className={`relative flex flex-col items-center text-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#d3d3d3] ${className}`} role="listitem">
      {number && (
        <span className="absolute top-1.5 right-2 text-[8px] sm:text-[9px] font-mono text-neutral-300 font-medium" aria-hidden="true">{number}</span>
      )}
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#f4f4f4] flex items-center justify-center mb-1.5 sm:mb-2.5">
        <div className="text-neutral-400">{FEATURE_ICONS[icon]}</div>
      </div>
      <p className="text-[9px] sm:text-[11px] font-bold text-[#0b0b0b] mb-0.5">{title}</p>
      <p className="text-[7px] sm:text-[9px] text-neutral-400 leading-relaxed">{desc}</p>
    </div>
  );
});
