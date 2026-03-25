'use client';

import { STEP_ORDER, STEP_LABELS, getStepNumber } from '@/types/csv-analysis';
import type { AnalysisStep } from '@/types/csv-analysis';

interface PipelineStepperProps {
  currentStep: AnalysisStep;
  isProcessing?: boolean;
}

export function PipelineStepper({ currentStep, isProcessing }: PipelineStepperProps) {
  const currentNum = getStepNumber(currentStep);
  const steps = STEP_ORDER.filter((s) => s !== 'complete');

  return (
    <div className="flex items-center gap-2 w-full">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isActive = step === currentStep;
        const isDone = currentNum > stepNum || currentStep === 'complete';
        const isError = currentStep === 'error' && stepNum === currentNum;

        return (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isError
                    ? 'bg-destructive text-white'
                    : isDone
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-secondary text-muted-foreground'
                }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive && isProcessing ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs font-medium truncate hidden lg:inline ${
                  isActive ? 'text-foreground' : isDone ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 min-w-4 ${
                  isDone ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
