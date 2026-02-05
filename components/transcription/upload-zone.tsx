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
        'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card p-10 transition-all duration-300 shadow-sm',
        isDragOver && !disabled
          ? 'border-primary bg-primary/5 scale-[1.01] shadow-md'
          : 'border-border hover:border-primary/40 hover:shadow-md',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      {/* Upload icon - circular with primary background */}
      <div className={cn(
        'mb-5 rounded-full p-4 transition-all duration-300',
        isDragOver ? 'bg-primary scale-110' : 'bg-primary'
      )}>
        <svg
          className="h-7 w-7 text-primary-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      <p className="mb-2 text-base font-medium text-foreground">
        {t('upload.dropzone')}
      </p>
      <p className="text-sm text-muted-foreground">
        {t('upload.or')} <span className="text-primary font-semibold cursor-pointer hover:underline">{t('upload.browse')}</span>
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        {t('upload.formats')}
      </p>
    </div>
  );
}
