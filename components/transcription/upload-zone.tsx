'use client';

import { useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';

// Formats supportés par Voxtral (Mistral AI) - officiellement: mp3, wav, m4a, flac, ogg
const ALLOWED_EXTENSIONS = ['mp3', 'wav', 'm4a', 'flac', 'ogg'];

// Taille maximale: 1 GB (limite Mistral et Cloudflare R2)
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
const MAX_FILE_SIZE_DISPLAY = '1 GB';
const MAX_DURATION_SECONDS = 7200; // 2h — au-delà, le timeout Vercel (5 min) peut être dépassé
const MAX_DURATION_DISPLAY = '2h';
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3', 
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
];

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

function getAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(audio.duration) ? audio.duration : null);
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(null);
    });
    audio.src = url;
  });
}

export function UploadZone({ onFileSelect, disabled, className }: UploadZoneProps) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Auto-hide error toast after 5 seconds
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const isAudioFile = useCallback((file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const hasValidExtension = ALLOWED_EXTENSIONS.includes(extension);
    const hasValidMimeType = ALLOWED_MIME_TYPES.some(type => file.type === type || file.type.includes(type.split('/')[1]));
    return hasValidExtension || hasValidMimeType;
  }, []);

  const isFileSizeValid = useCallback((file: File) => {
    return file.size <= MAX_FILE_SIZE_BYTES;
  }, []);

  const validateAndSelect = useCallback(async (file: File) => {
    if (!isAudioFile(file)) {
      setErrorToast(t('upload.invalidFormat'));
      return;
    }
    if (!isFileSizeValid(file)) {
      setErrorToast(t('upload.fileTooLarge', { maxSize: MAX_FILE_SIZE_DISPLAY }));
      return;
    }
    setChecking(true);
    try {
      const duration = await getAudioDuration(file);
      if (duration !== null && duration > MAX_DURATION_SECONDS) {
        setErrorToast(t('upload.tooLong', { maxDuration: MAX_DURATION_DISPLAY }));
        return;
      }
    } finally {
      setChecking(false);
    }
    onFileSelect(file);
  }, [isAudioFile, isFileSizeValid, onFileSelect, t]);

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

    if (disabled || checking) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSelect(files[0]);
    }
  }, [disabled, checking, validateAndSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSelect(files[0]);
    }
    e.target.value = '';
  }, [validateAndSelect]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card p-10 transition-all duration-300 shadow-sm',
        isDragOver && !disabled && !checking
          ? 'border-primary bg-primary/5 scale-[1.01] shadow-md'
          : 'border-border hover:border-primary/40 hover:shadow-md',
        (disabled || checking) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        type="file"
        accept=".mp3,.wav,.m4a,.flac,.ogg,audio/mpeg,audio/wav,audio/mp4,audio/flac,audio/ogg"
        onChange={handleFileInput}
        disabled={disabled || checking}
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

      {/* Error toast for invalid file types */}
      {errorToast && (
        <div className="absolute -bottom-16 left-0 right-0 mx-auto max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-3 text-sm text-destructive-foreground shadow-lg">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorToast}</span>
            <button 
              onClick={() => setErrorToast(null)}
              className="ml-auto hover:opacity-70 transition-opacity"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
