/**
 * FullPageStepper — Full-page stepper layout for complex forms
 * BAOMS | Babawatoto Organization Management System
 *
 * Replaces modal-based forms with a dedicated full-page experience.
 * Features:
 * - Fixed sidebar stepper (desktop) / top progress bar (mobile)
 * - Sticky top bar with title and navigation
 * - Main content area with smooth step transitions
 * - Auto-scroll to top on step change
 */

import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, X, Save } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FullPageStep {
  id: string | number;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export interface FullPageStepperProps {
  /** Page title shown in the sticky top bar */
  title: string;
  /** Brief context subtitle */
  subtitle?: string;
  steps: FullPageStep[];
  /** 0-indexed current step */
  currentStep: number;
  onStepChange: (step: number) => void;
  /** Called when user clicks the final submit button */
  onSubmit: () => void;
  /** Called when user clicks Cancel / close */
  onCancel: () => void;
  /** Text for the final step's submit button */
  submitLabel?: string;
  /** Disable the Next / Submit button (e.g. when validating) */
  isSubmitting?: boolean;
  /** Step content */
  children: React.ReactNode;
  /** Additional action in the top-right (e.g. Save Draft) */
  headerAction?: React.ReactNode;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const FullPageStepper: React.FC<FullPageStepperProps> = ({
  title,
  subtitle,
  steps,
  currentStep,
  onStepChange,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  isSubmitting = false,
  children,
  headerAction,
  className,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // Scroll content area to top whenever step changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  const goNext = () => {
    if (!isLast) onStepChange(currentStep + 1);
    else onSubmit();
  };

  const goBack = () => {
    if (!isFirst) onStepChange(currentStep - 1);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-neutral-950',
        className
      )}
    >
      {/* ── Sticky Top Bar ─────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: cancel + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onCancel}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
            <div className="h-5 w-px bg-slate-200 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 truncate leading-tight">{title}</h1>
              {subtitle && (
                <p className="text-[10px] text-slate-400 truncate hidden sm:block">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Mobile: step indicator */}
          <div className="flex md:hidden items-center shrink-0">
            <span className="text-xs font-semibold text-slate-600">
              Step {currentStep + 1} / {steps.length}
            </span>
          </div>

          {/* Right: header action + nav */}
          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={isFirst || isSubmitting}
              className="hidden sm:flex items-center gap-1.5 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={goNext}
              disabled={isSubmitting}
              isLoading={isSubmitting && isLast}
              className="flex items-center gap-1.5 text-xs bg-[#D68904] hover:bg-[#b86e03]"
            >
              {isLast ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting…' : submitLabel}
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="md:hidden h-1 bg-slate-100">
          <div
            className="h-full bg-[#D68904] transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </header>

      {/* ── Body: sidebar + content ────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Desktop Sidebar Stepper ──────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-60 xl:w-64 shrink-0 bg-white border-r border-slate-200 overflow-y-auto py-6 px-4 gap-1">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;
            const isClickable = isCompleted; // only allow jumping back to completed steps

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isClickable && !isCurrent}
                onClick={() => isClickable && onStepChange(index)}
                className={cn(
                  'group flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150',
                  isCurrent && 'bg-amber-50 border border-[#D68904]/30',
                  isCompleted && 'hover:bg-slate-50 cursor-pointer',
                  isUpcoming && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* Circle indicator */}
                <div
                  className={cn(
                    'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all mt-0.5',
                    isCurrent && 'bg-[#D68904] border-[#D68904] text-white',
                    isCompleted && 'bg-[#D68904] border-[#D68904] text-white group-hover:bg-amber-600',
                    isUpcoming && 'bg-slate-50 border-slate-200 text-slate-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    index + 1
                  )}
                </div>
                {/* Labels */}
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-xs font-semibold leading-tight',
                      isCurrent && 'text-[#D68904]',
                      isCompleted && 'text-slate-700 group-hover:text-[#D68904]',
                      isUpcoming && 'text-slate-400'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.subtitle && (
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{step.subtitle}</p>
                  )}
                </div>
              </button>
            );
          })}

          {/* Bottom nav in sidebar */}
          <div className="mt-auto pt-4 space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goBack}
              disabled={isFirst || isSubmitting}
              className="w-full text-xs flex items-center gap-1.5 justify-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous Step
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={goNext}
              disabled={isSubmitting}
              isLoading={isSubmitting && isLast}
              className="w-full text-xs flex items-center gap-1.5 justify-center bg-[#D68904] hover:bg-[#b86e03]"
            >
              {isLast ? submitLabel : 'Next Step'}
              {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </aside>

        {/* ── Main content area ──────────────────────────────────────────────── */}
        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
            {/* Step heading */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#D68904]">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {steps[currentStep]?.title}
              </h2>
              {steps[currentStep]?.subtitle && (
                <p className="text-sm text-slate-500 mt-0.5">{steps[currentStep]?.subtitle}</p>
              )}
            </div>

            {/* Animated step content */}
            <div key={currentStep} className="animate-fadeIn">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* ── Mobile sticky bottom nav ─────────────────────────────────────────── */}
      <div className="md:hidden shrink-0 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goBack}
          disabled={isFirst || isSubmitting}
          className="flex-1 text-xs flex items-center gap-1.5 justify-center"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={goNext}
          disabled={isSubmitting}
          isLoading={isSubmitting && isLast}
          className="flex-1 text-xs flex items-center gap-1.5 justify-center bg-[#D68904] hover:bg-[#b86e03]"
        >
          {isLast ? submitLabel : 'Next'}
          {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
};
