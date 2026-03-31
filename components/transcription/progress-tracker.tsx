'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';
import { getVoxtralLanguageLabel } from '@/lib/voxtral-transcription-languages';
import type { TranscriptionStatus } from '@/types';

interface ProgressTrackerProps {
  status: TranscriptionStatus;
  progress: number;
  fileName?: string;
  className?: string;
  estimatedTimeRemaining?: number; // en secondes
  /** Code langue Voxtral choisi, ou '' si détection automatique */
  speakerLanguageCode?: string;
}

const statusIcons: Record<TranscriptionStatus, React.ReactNode> = {
  idle: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  uploading: (
    <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  processing: (
    <svg className="h-6 w-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  completed: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

/**
 * Formate le temps en minutes et secondes
 */
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (mins > 0) {
    return `~${mins}m ${secs}s`;
  }
  return `~${secs}s`;
}

export function ProgressTracker({
  status,
  progress,
  fileName,
  className,
  estimatedTimeRemaining,
  speakerLanguageCode = '',
}: ProgressTrackerProps) {
  const { t } = useTranslation();
  const isActive = status === 'uploading' || status === 'processing';

  const getStatusMessage = (status: TranscriptionStatus): string => {
    switch (status) {
      case 'uploading':
        return t('progress.uploading');
      case 'processing':
        return t('progress.processing');
      default:
        return '';
    }
  };

  return (
    <div className={cn('bg-card rounded-2xl border border-border p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full text-primary-foreground',
          status === 'completed' ? 'bg-accent' : 
          status === 'error' ? 'bg-destructive' : 
          'bg-primary'
        )}>
          {statusIcons[status]}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{getStatusMessage(status)}</p>
          {fileName && (
            <p className="text-sm text-muted-foreground truncate max-w-md">
              {fileName}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {t('progress.transcriptionLanguage')}:{' '}
            <span className="text-foreground/90 font-medium">
              {speakerLanguageCode.trim()
                ? `${getVoxtralLanguageLabel(speakerLanguageCode.trim()) ?? speakerLanguageCode.trim()} (${speakerLanguageCode.trim()})`
                : t('upload.speakerLanguageAuto')}
            </span>
          </p>
        </div>
      </div>

      {isActive && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {status === 'uploading' 
              ? `${Math.round(progress)}%`
              : status === 'processing' && estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0
                ? `${formatTimeRemaining(estimatedTimeRemaining)} • ${Math.round(progress)}%`
                : `${Math.round(progress)}%`
            }
          </p>
        </div>
      )}
    </div>
  );
}
