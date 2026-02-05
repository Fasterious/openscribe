'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function UploadZone({ onFileSelect, disabled, className }: UploadZoneProps) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isAudioFile(file)) {
        onFileSelect(file);
      }
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
    // Reset input
    e.target.value = '';
  }, [onFileSelect]);

  const isAudioFile = (file: File) => {
    const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/ogg'];
    return audioTypes.some(type => file.type.includes(type.split('/')[1])) || 
           file.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all duration-200',
        isDragOver && !disabled
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      {/* Upload icon */}
      <div className={cn(
        'mb-4 rounded-full p-4 transition-colors',
        isDragOver ? 'bg-primary/10' : 'bg-muted'
      )}>
        <svg
          className={cn(
            'h-8 w-8 transition-colors',
            isDragOver ? 'text-primary' : 'text-muted-foreground'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      <p className="mb-2 text-lg font-medium text-foreground">
        {t('upload.dropzone')}
      </p>
      <p className="text-sm text-muted-foreground">
        {t('upload.or')} <span className="text-primary font-medium">{t('upload.browse')}</span>
      </p>
      <p className="mt-4 text-xs text-muted-foreground/70">
        {t('upload.formats')}
      </p>
    </div>
  );
}
