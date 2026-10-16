import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
  id: string | number;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 0-indexed
  completedSteps?: number[];
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Mobile Stepper View (< md) */}
      <div className="block md:hidden bg-white border border-surface-border rounded-lg p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-charcoal-700 uppercase tracking-wider">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="font-bold text-[#D68904]">
            {steps[currentStep]?.title}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-surface-border">
          <div
            className="bg-[#D68904] h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        {steps[currentStep]?.subtitle && (
          <p className="text-xs text-charcoal-muted mt-1.5">
            {steps[currentStep]?.subtitle}
          </p>
        )}
      </div>

      {/* Desktop Stepper View (>= md) */}
      <div className="hidden md:flex items-center justify-between relative bg-white border border-surface-border rounded-lg p-4">
        {/* Background Connecting Bar */}
        <div
          className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-200 -z-0"
          aria-hidden="true"
        />

        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index) || index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = !isCompleted && !isCurrent;
          const isClickable = Boolean(onStepClick && (isCompleted || isCurrent));

          return (
            <div
              key={step.id}
              className={cn(
                'relative z-10 flex flex-col items-center flex-1 transition-all',
                isClickable && 'cursor-pointer group'
              )}
              onClick={() => {
                if (isClickable && onStepClick) {
                  onStepClick(index);
                }
              }}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 border-2 select-none',
                  isCompleted &&
                    'bg-[#D68904] border-[#D68904] text-white group-hover:bg-[#b86e03]',
                  isCurrent &&
                    'bg-white border-[#D68904] text-[#D68904] ring-4 ring-amber-50 font-bold',
                  isUpcoming &&
                    'bg-slate-50 border-surface-border text-charcoal-muted group-hover:border-charcoal-400'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white stroke-[2.5]" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Labels */}
              <div className="text-center mt-2 px-1">
                <span
                  className={cn(
                    'text-xs font-semibold block transition-colors leading-tight',
                    isCurrent && 'text-charcoal-900 font-bold',
                    isCompleted && 'text-charcoal-800 group-hover:text-[#D68904]',
                    isUpcoming && 'text-charcoal-muted'
                  )}
                >
                  {step.title}
                </span>
                {step.subtitle && (
                  <span className="text-[11px] text-charcoal-muted block mt-0.5 max-w-[120px] truncate">
                    {step.subtitle}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
