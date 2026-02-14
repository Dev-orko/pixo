'use client';

import React, { useState, useCallback, memo } from 'react';
import {
  PixelSettings,
  PatternStyle,
  PATTERN_LABELS,
  ExportFormat,
} from '@/lib/pixelEngine';

interface ControlsPanelProps {
  settings: PixelSettings;
  onSettingsChange: (settings: PixelSettings) => void;
  onReset: () => void;
  onDownload: (format: ExportFormat) => void;
  hasResult: boolean;
  isProcessing: boolean;
}

const PATTERNS: PatternStyle[] = ['line-h', 'line-v', 'cross', 'diagonal', 'dots', 'concentric', 'wave'];

export default function ControlsPanel({
  settings,
  onSettingsChange,
  onReset,
  onDownload,
  hasResult,
  isProcessing,
}: ControlsPanelProps) {
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');

  const update = useCallback(<K extends keyof PixelSettings>(key: K, val: PixelSettings[K]) => {
    onSettingsChange({ ...settings, [key]: val });
  }, [settings, onSettingsChange]);

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-xl border border-neutral-200/80 overflow-hidden shadow-sm" role="form" aria-label="Image controls">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* Pattern Selection */}
        <section>
          <h4 className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-neutral-800 mb-2 flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Pattern Style
          </h4>
          <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Pattern style">
            {PATTERNS.map((p) => (
              <button
                key={p}
                onClick={() => update('pattern', p)}
                role="radio"
                aria-checked={settings.pattern === p}
                aria-label={PATTERN_LABELS[p]}
                className={`group relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[8px] font-bold uppercase transition-all border
                  ${settings.pattern === p
                    ? 'bg-[#0b0b0b] text-white border-[#0b0b0b] shadow-md scale-[1.02]'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:shadow-sm active:scale-95'
                  }`}
              >
                <PatternIcon pattern={p} active={settings.pattern === p} />
                <span className="text-center leading-none tracking-tight">{PATTERN_LABELS[p]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Grid Controls */}
        <section className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50 rounded-lg border border-neutral-200 p-3 space-y-2.5">
          <h4 className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-neutral-800 flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
              <line x1="21" y1="10" x2="7" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="21" y1="18" x2="7" y2="18" />
            </svg>
            Grid Controls
          </h4>
          
          <Slider
            label="Grid Density"
            value={settings.gridSize}
            min={10}
            max={200}
            step={1}
            displayValue={settings.gridSize.toString()}
            onChange={(v) => update('gridSize', v)}
          />
          
          <Slider
            label="Line Weight"
            value={settings.lineWeight}
            min={0.2}
            max={2.0}
            step={0.05}
            displayValue={`${settings.lineWeight.toFixed(2)}x`}
            onChange={(v) => update('lineWeight', parseFloat(v.toFixed(2)))}
          />
        </section>

        {/* Image Adjustments */}
        <section className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50 rounded-lg border border-neutral-200 p-3 space-y-2.5">
          <h4 className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-neutral-800 flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6M23 12h-6m-2 0H1" />
            </svg>
            Image Adjustments
          </h4>
          
          <Slider
            label="Contrast"
            value={settings.contrast}
            min={-100}
            max={100}
            step={1}
            displayValue={`${settings.contrast > 0 ? '+' : ''}${settings.contrast}`}
            onChange={(v) => update('contrast', v)}
          />
          
          <Slider
            label="Brightness"
            value={settings.brightness}
            min={-100}
            max={100}
            step={1}
            displayValue={`${settings.brightness > 0 ? '+' : ''}${settings.brightness}`}
            onChange={(v) => update('brightness', v)}
          />
          
          <Slider
            label="Sharpen"
            value={settings.sharpen}
            min={0}
            max={100}
            step={1}
            displayValue={`${settings.sharpen}%`}
            onChange={(v) => update('sharpen', v)}
          />
          
          <Slider
            label="Background"
            value={settings.bgOpacity}
            min={0}
            max={100}
            step={1}
            displayValue={`${settings.bgOpacity}%`}
            onChange={(v) => update('bgOpacity', v)}
          />
        </section>

        {/* Display Options */}
        <section>
          <h4 className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-neutral-800 mb-2 flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Display Options
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            <ToggleButton
              label="Invert Colors"
              active={settings.invert}
              onClick={() => update('invert', !settings.invert)}
            />
            <ToggleButton
              label="Color Mode"
              active={settings.colorMode}
              onClick={() => update('colorMode', !settings.colorMode)}
            />
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-neutral-200/60" role="separator" />

        {/* Export Section */}
        <section className="pt-2">
          <h4 className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-neutral-800 mb-2 flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </h4>
          
          {/* Format Selection */}
          <div className="flex gap-1.5 mb-2.5" role="radiogroup" aria-label="Export format">
            {(['png', 'jpeg'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setExportFormat(f)}
                role="radio"
                aria-checked={exportFormat === f}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border
                  ${exportFormat === f
                    ? 'bg-[#0b0b0b] text-white border-[#0b0b0b] shadow-md'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:shadow-sm'
                  }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>


          <button
            onClick={() => onDownload(exportFormat)}
            disabled={!hasResult || isProcessing}
            aria-label={`Export as ${exportFormat.toUpperCase()}`}
            className="w-full py-3 rounded-xl text-xs uppercase tracking-[0.15em] font-bold
              bg-[#0b0b0b] text-white hover:bg-[#222] active:bg-black transition-all active:scale-[0.98]
              shadow-md hover:shadow-lg
              disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none
              flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export {exportFormat.toUpperCase()}</span>
          </button>

          <button
            onClick={onReset}
            aria-label="Start over with a new image"
            className="w-full mt-2 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold
              text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 
              border border-neutral-200 hover:border-neutral-300 transition-all"
          >
            New Image
          </button>
        </section>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 py-2" role="status" aria-live="polite">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0b0b0b] animate-pulse" aria-hidden="true" />
            <span className="text-[9px] text-neutral-600 uppercase tracking-wider font-bold">Processing…</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components (memoized) ──────────────────────────────────────────────

const Slider = memo(function Slider({
  label, value, min, max, step, displayValue, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  displayValue: string; onChange: (v: number) => void;
}) {
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[9px] font-bold uppercase tracking-wider text-neutral-600">
          {label}
        </label>
        <output htmlFor={id} className="text-[9px] font-mono text-[#0b0b0b] tabular-nums font-bold">
          {displayValue}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayValue}
      />
    </div>
  );
});

const ToggleButton = memo(function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={active}
      aria-label={`${label}: ${active ? 'on' : 'off'}`}
      className={`py-2.5 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border
        ${active
          ? 'bg-[#0b0b0b] text-white border-[#0b0b0b] shadow-md'
          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:shadow-sm'
        }`}
    >
      {label}
    </button>
  );
});

const PatternIcon = memo(function PatternIcon({
  pattern,
  active,
}: {
  pattern: PatternStyle;
  active: boolean;
}) {
  const color = active ? '#fff' : '#737373';
  const size = 16;
  
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.8" aria-hidden="true">
      {pattern === 'line-h' && (
        <><line x1="2" y1="6" x2="16" y2="6" /><line x1="2" y1="9" x2="16" y2="9" /><line x1="2" y1="12" x2="16" y2="12" /></>
      )}
      {pattern === 'line-v' && (
        <><line x1="6" y1="2" x2="6" y2="16" /><line x1="9" y1="2" x2="9" y2="16" /><line x1="12" y1="2" x2="12" y2="16" /></>
      )}
      {pattern === 'cross' && (
        <><line x1="9" y1="2" x2="9" y2="16" /><line x1="2" y1="9" x2="16" y2="9" /></>
      )}
      {pattern === 'diagonal' && (
        <><line x1="2" y1="16" x2="16" y2="2" /><line x1="2" y1="2" x2="16" y2="16" /></>
      )}
      {pattern === 'dots' && (
        <>
          <circle cx="5" cy="5" r="1.5" fill={color} stroke="none" />
          <circle cx="13" cy="5" r="1.5" fill={color} stroke="none" />
          <circle cx="9" cy="9" r="1.5" fill={color} stroke="none" />
          <circle cx="5" cy="13" r="1.5" fill={color} stroke="none" />
          <circle cx="13" cy="13" r="1.5" fill={color} stroke="none" />
        </>
      )}
      {pattern === 'concentric' && (
        <><circle cx="9" cy="9" r="3" /><circle cx="9" cy="9" r="6" /></>
      )}
      {pattern === 'wave' && (
        <path d="M2 9 C5 5, 7 13, 9 9 S13 5, 16 9" />
      )}
    </svg>
  );
});
