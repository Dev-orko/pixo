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
    <div className="w-full bg-white rounded-xl sm:rounded-2xl border border-[#d3d3d3] overflow-hidden" role="form" aria-label="Image controls">
      <div className="p-3.5 sm:p-5 space-y-4 sm:space-y-6">
        {/* Pattern Style Grid */}
        <Section title="Pattern Style">
          <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Pattern style">
            {PATTERNS.map((p) => (
              <button
                key={p}
                onClick={() => update('pattern', p)}
                role="radio"
                aria-checked={settings.pattern === p}
                aria-label={PATTERN_LABELS[p]}
                className={`flex flex-col items-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-medium transition-all duration-150 border
                  ${settings.pattern === p
                    ? 'bg-[#0b0b0b] text-white border-[#0b0b0b] shadow-sm'
                    : 'bg-[#f4f4f4] text-neutral-500 border-[#d3d3d3] hover:border-neutral-400 hover:text-neutral-700 active:bg-neutral-200'
                  }`}
              >
                <PatternIcon pattern={p} active={settings.pattern === p} />
                <span className="truncate w-full text-center">{PATTERN_LABELS[p]}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Sliders */}
        <SliderControl
          label="Grid Density"
          value={settings.gridSize}
          min={10} max={200} step={1}
          displayValue={`${settings.gridSize}`}
          onChange={(v) => update('gridSize', v)}
        />
        <SliderControl
          label="Line Weight"
          value={settings.lineWeight}
          min={0.2} max={2.0} step={0.05}
          displayValue={`${settings.lineWeight.toFixed(2)}x`}
          onChange={(v) => update('lineWeight', parseFloat(v.toFixed(2)))}
        />
        <SliderControl
          label="Contrast"
          value={settings.contrast}
          min={-100} max={100} step={1}
          displayValue={`${settings.contrast > 0 ? '+' : ''}${settings.contrast}`}
          onChange={(v) => update('contrast', v)}
        />
        <SliderControl
          label="Brightness"
          value={settings.brightness}
          min={-100} max={100} step={1}
          displayValue={`${settings.brightness > 0 ? '+' : ''}${settings.brightness}`}
          onChange={(v) => update('brightness', v)}
        />
        <SliderControl
          label="Sharpen"
          value={settings.sharpen}
          min={0} max={100} step={1}
          displayValue={`${settings.sharpen}%`}
          onChange={(v) => update('sharpen', v)}
        />
        <SliderControl
          label="BG Opacity"
          value={settings.bgOpacity}
          min={0} max={100} step={1}
          displayValue={`${settings.bgOpacity}%`}
          onChange={(v) => update('bgOpacity', v)}
        />

        {/* Toggles */}
        <div className="flex gap-2 sm:gap-3 pt-1" role="group" aria-label="Toggle options">
          <ToggleButton label="Invert" active={settings.invert} onClick={() => update('invert', !settings.invert)} />
          <ToggleButton label="Color" active={settings.colorMode} onClick={() => update('colorMode', !settings.colorMode)} />
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-100" role="separator" />

        {/* Export */}
        <div className="space-y-2.5 sm:space-y-3" role="group" aria-label="Export options">
          <div className="flex gap-2" role="radiogroup" aria-label="Export format">
            {(['png', 'jpeg'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setExportFormat(f)}
                role="radio"
                aria-checked={exportFormat === f}
                className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all border
                  ${exportFormat === f
                    ? 'bg-[#0b0b0b] text-white border-[#0b0b0b] shadow-sm'
                    : 'bg-[#f4f4f4] text-neutral-500 border-[#d3d3d3] hover:border-neutral-400 active:bg-neutral-200'
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
            className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm uppercase tracking-[0.12em] font-bold
              bg-[#0b0b0b] text-white hover:bg-[#222] transition-all active:scale-[0.98]
              shadow-lg shadow-neutral-400/20
              disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none
              flex items-center justify-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export {exportFormat.toUpperCase()}
          </button>
        </div>

        {/* New Image */}
        <button
          onClick={onReset}
          aria-label="Start over with a new image"
          className="w-full py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs uppercase tracking-wider font-medium
            text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-all active:bg-neutral-200"
        >
          New Image
        </button>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2" role="status" aria-live="polite">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse" aria-hidden="true" />
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Processing…</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components (memoized) ──────────────────────────────────────────────

const Section = memo(function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2 sm:space-y-2.5 border-none p-0 m-0">
      <legend className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
        {title}
      </legend>
      {children}
    </fieldset>
  );
});

const SliderControl = memo(function SliderControl({
  label, value, min, max, step, displayValue, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  displayValue: string; onChange: (v: number) => void;
}) {
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="space-y-1 sm:space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
          {label}
        </label>
        <output htmlFor={id} className="text-[10px] sm:text-[11px] font-mono text-[#0b0b0b] tabular-nums font-medium">
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

const ToggleButton = memo(function ToggleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={active}
      aria-label={`${label}: ${active ? 'on' : 'off'}`}
      className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all border
        ${active
          ? 'bg-[#0b0b0b] text-white border-[#0b0b0b] shadow-sm'
          : 'bg-[#f4f4f4] text-neutral-500 border-[#d3d3d3] hover:border-neutral-400 hover:text-neutral-700 active:bg-neutral-200'
        }`}
    >
      {label}
    </button>
  );
});

const PatternIcon = memo(function PatternIcon({ pattern, active }: { pattern: PatternStyle; active: boolean }) {
  const color = active ? '#fff' : '#888';
  const size = 18;
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
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
