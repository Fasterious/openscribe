'use client';

// The transparent pipeline (A3): the engine returns one summary per step, each
// with a plain "why this exists" line, so the analysis is never a black box.

import type { PipelineStep, V2StepId } from '@/types/persona-v2';

const STEP_NUM: Record<V2StepId, string> = {
  prep: '1',
  'core-target': '2',
  mining: '3',
  selection: '4',
  assignment: '5',
  'model-selection': '6',
  validation: '7',
};

export function PipelineStepper({
  steps,
  elapsedMs,
  backendUsed,
}: {
  steps: PipelineStep[];
  elapsedMs: number;
  backendUsed: 'surprise' | 'co-agreement';
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Pipeline (transparent)</h3>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
            moteur : {backendUsed === 'co-agreement' ? 'co-accord' : 'surprise'}
          </span>
          <span className="text-muted-foreground">{elapsedMs} ms</span>
        </div>
      </div>

      <ol className="relative space-y-3 border-l border-border pl-6">
        {steps.map((s) => (
          <li key={s.id} className="relative">
            <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[11px] font-semibold text-primary">
              {STEP_NUM[s.id]}
            </span>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[13px] font-medium text-foreground">{s.title}</p>
              <p className="mt-0.5 text-[11px] italic text-muted-foreground">{s.why}</p>
              <p className="mt-1.5 text-[12px] text-foreground/80">{s.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
