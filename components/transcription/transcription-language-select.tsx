'use client';

import { VOXTRAL_TRANSCRIPTION_LANGUAGES } from '@/lib/voxtral-transcription-languages';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

interface TranscriptionLanguageSelectProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TranscriptionLanguageSelect({
  value,
  onChange,
  disabled,
  className,
}: TranscriptionLanguageSelectProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-border/50 bg-muted/25 px-3 py-2">
        <label
          htmlFor="transcription-language"
          className="text-xs text-muted-foreground whitespace-nowrap"
        >
          {t('upload.speakerLanguage')}
        </label>
        <select
          id="transcription-language"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'min-w-[11rem] max-w-[14rem] rounded-md border border-border/60 bg-background/90 px-2 py-1.5 text-xs text-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <option value="">{t('upload.speakerLanguageAuto')}</option>
          {VOXTRAL_TRANSCRIPTION_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <p className="max-w-md text-center text-[11px] leading-snug text-muted-foreground/80">
        {t('upload.speakerLanguageHint')}
      </p>
    </div>
  );
}
