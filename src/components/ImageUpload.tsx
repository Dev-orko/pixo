'use client';

import React, { useCallback, useState, useRef } from 'react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isProcessing: boolean;
}

const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif']);

export default function ImageUpload({ onImageSelect, isProcessing }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/') && !ACCEPTED_TYPES.has(file.type)) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('Image is too large. Please use an image under 20 MB.');
      return;
    }
    onImageSelect(file);
  }, [onImageSelect]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [validateAndSelect],
  );

  const openFilePicker = useCallback(() => {
    if (!isProcessing) inputRef.current?.click();
  }, [isProcessing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  }, [openFilePicker]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={openFilePicker}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isProcessing ? -1 : 0}
      aria-label="Upload image — drag and drop or click to browse"
      aria-disabled={isProcessing}
      className={`
        relative flex flex-col items-center justify-center
        w-full h-full rounded-2xl sm:rounded-3xl
        border-2 border-dashed transition-all duration-300 group
        ${isDragOver
          ? 'border-neutral-900 bg-neutral-100 scale-[1.005]'
          : 'border-neutral-300 hover:border-neutral-500 bg-white'
        }
        ${isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Icon */}
      <div className="mb-2.5 sm:mb-4 relative">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center transition-all duration-300
          ${isDragOver ? 'bg-neutral-200 scale-110' : 'bg-neutral-100 group-hover:bg-neutral-200'}`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-neutral-500 sm:w-7 sm:h-7"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <p className="text-xs sm:text-sm font-semibold text-neutral-800 mb-0.5">
        Drop your image here
      </p>
      <p className="text-[10px] sm:text-xs text-neutral-400 mb-2 sm:mb-3">
        or tap to browse files
      </p>

      <div className="flex items-center gap-1.5 sm:gap-3" aria-hidden="true">
        {['PNG', 'JPG', 'WEBP', 'GIF'].map(f => (
          <span key={f} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-neutral-100 rounded-md text-[8px] sm:text-[10px] text-neutral-400 uppercase tracking-wider font-medium">
            {f}
          </span>
        ))}
      </div>

      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#0b0b0b] flex items-center justify-center shadow-lg shadow-neutral-400/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
                <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-neutral-800">Release to upload</p>
          </div>
        </div>
      )}
    </div>
  );
}
