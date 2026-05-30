import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.label}
              className={cn('flex items-center', !isLast && 'flex-1')}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200',
                    isCompleted && 'bg-[#2D6A4F] text-white',
                    isCurrent && 'bg-[#E3EFE9] text-[#2D6A4F] ring-2 ring-[#2D6A4F]',
                    !isCompleted && !isCurrent && 'bg-[#F1EEE7] text-[#8A8A8A]'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <div className="text-center">
                  <span
                    className={cn(
                      'block text-xs font-semibold',
                      (isCompleted || isCurrent) ? 'text-[#1A1A1A]' : 'text-[#8A8A8A]'
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="block text-[10px] text-[#8A8A8A] mt-0.5 hidden sm:block">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 rounded-full transition-colors duration-200',
                    isCompleted ? 'bg-[#2D6A4F]' : 'bg-[#E8E5DE]'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
