'use client';

// Inline "En clair" glossary term (A3 transparency): every technical word the
// product shows can be hovered for a plain-language definition + example.

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { getGlossary } from '@/lib/persona-v2/glossary';

export function Term({
  k,
  children,
  className = '',
}: {
  k: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const entry = getGlossary(k);
  if (!entry) return <>{children}</>;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 cursor-help ${className}`}
          >
            {children ?? entry.term}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs space-y-1.5 p-3 text-left">
          <p className="font-semibold text-[12px]">{entry.term}</p>
          <p className="text-[12px] leading-relaxed text-background/90">{entry.plain}</p>
          {entry.example && (
            <p className="text-[11px] italic text-background/70">Ex. : {entry.example}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** A small "i" info dot that explains an arbitrary glossary key on hover. */
export function InfoDot({ k }: { k: string }) {
  const entry = getGlossary(k);
  if (!entry) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] leading-none text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label={`En clair : ${entry.term}`}
          >
            i
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs space-y-1.5 p-3 text-left">
          <p className="font-semibold text-[12px]">{entry.term}</p>
          <p className="text-[12px] leading-relaxed text-background/90">{entry.plain}</p>
          {entry.example && (
            <p className="text-[11px] italic text-background/70">Ex. : {entry.example}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Directional band chip (↑ high / ~ mid / ↓ low) with semantic colour. */
export function BandChip({
  label,
  direction,
  agreement,
}: {
  label: string;
  direction: 'low' | 'mid' | 'high';
  agreement?: number;
}) {
  const arrow = direction === 'high' ? '↑' : direction === 'low' ? '↓' : '~';
  const tone =
    direction === 'high'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : direction === 'low'
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return (
    <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${tone}`}>
      {label} {arrow}
      {agreement !== undefined && (
        <span className="opacity-60">{Math.round(agreement * 100)}%</span>
      )}
    </span>
  );
}
