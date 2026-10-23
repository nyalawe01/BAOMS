import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                               DATE UTILITIES                               */
/* -------------------------------------------------------------------------- */

export function parseISODate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

export function formatISODate(date?: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(dateStr?: string | null): string {
  const d = parseISODate(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isSameDay(d1?: Date | null, d2?: Date | null): boolean {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isBetween(target: Date, start?: Date | null, end?: Date | null): boolean {
  if (!start || !end) return false;
  const t = target.getTime();
  const s = start.getTime();
  const e = end.getTime();
  return t >= Math.min(s, e) && t <= Math.max(s, e);
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/* -------------------------------------------------------------------------- */
/*                               CONTEXT TYPES                                */
/* -------------------------------------------------------------------------- */

interface DatePickerContextValue {
  mode: 'single' | 'range';
  singleDate: string;
  rangeStart: string;
  rangeEnd: string;
  hoverDate: string | null;
  setHoverDate: (d: string | null) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  viewYear: number;
  viewMonth: number;
  setViewYear: (year: number) => void;
  setViewMonth: (month: number) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  onSelectDate: (dateStr: string) => void;
  clearSelection: () => void;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null);

function useDatePickerContext() {
  const ctx = useContext(DatePickerContext);
  if (!ctx) {
    throw new Error('DatePicker subcomponents must be used within DatePicker or DateRangePicker');
  }
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*                           SUBCOMPONENTS & API                              */
/* -------------------------------------------------------------------------- */

export const Label: React.FC<{
  className?: string;
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
}> = ({ className, children, htmlFor, required }) => (
  <label
    htmlFor={htmlFor}
    className={cn(
      'block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 select-none',
      className
    )}
  >
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

export const DateField = {
  Group: ({
    className,
    children,
    fullWidth = true,
    variant = 'default',
    onClick,
  }: {
    className?: string;
    children: ReactNode;
    fullWidth?: boolean;
    variant?: 'default' | 'secondary' | 'bordered';
    onClick?: () => void;
  }) => {
    return (
      <div
        onClick={onClick}
        className={cn(
          'group relative flex min-h-[44px] items-center rounded-xl border border-slate-300/80 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-2xs transition-all duration-150',
          'hover:border-slate-400 focus-within:border-[#D68904] focus-within:ring-2 focus-within:ring-[#D68904]/20',
          variant === 'secondary' && 'bg-slate-50/50',
          fullWidth ? 'w-full' : 'w-auto',
          className
        )}
      >
        {children}
      </div>
    );
  },

  InputContainer: ({
    className,
    children,
  }: {
    className?: string;
    children: ReactNode;
  }) => {
    return (
      <div className={cn('flex flex-1 items-center gap-2 overflow-hidden', className)}>
        {children}
      </div>
    );
  },

  Input: ({
    slot,
    className,
    children,
    placeholder,
    value,
    onChange,
    disabled,
  }: {
    slot?: 'start' | 'end' | 'single';
    className?: string;
    children?: (segment: string) => ReactNode;
    placeholder?: string;
    value?: string;
    onChange?: (val: string) => void;
    disabled?: boolean;
  }) => {
    const ctx = useContext(DatePickerContext);
    const dateVal =
      value !== undefined
        ? value
        : slot === 'start'
        ? ctx?.rangeStart || ''
        : slot === 'end'
        ? ctx?.rangeEnd || ''
        : ctx?.singleDate || '';

    const formatted = formatDisplayDate(dateVal);

    if (children) {
      return (
        <div className={cn('flex items-center text-sm font-medium text-slate-800', className)}>
          {children(formatted || placeholder || (slot === 'start' ? 'Start date' : slot === 'end' ? 'End date' : 'Select date'))}
        </div>
      );
    }

    return (
      <input
        type="text"
        readOnly
        disabled={disabled ?? ctx?.disabled}
        value={formatted}
        placeholder={placeholder || (slot === 'start' ? 'Start date' : slot === 'end' ? 'End date' : 'Select date')}
        className={cn(
          'w-full bg-transparent font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none cursor-pointer text-sm truncate',
          className
        )}
      />
    );
  },

  Segment: ({
    segment,
    className,
  }: {
    segment: string;
    className?: string;
  }) => {
    return (
      <span className={cn('text-sm font-medium text-slate-800 select-none truncate', className)}>
        {segment}
      </span>
    );
  },

  Suffix: ({
    className,
    children,
  }: {
    className?: string;
    children: ReactNode;
  }) => {
    return (
      <div className={cn('ms-auto flex items-center pl-2 flex-shrink-0', className)}>
        {children}
      </div>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*                            CALENDAR COMPONENTS                             */
/* -------------------------------------------------------------------------- */

export const CalendarHeader: React.FC<{
  className?: string;
  children?: ReactNode;
}> = ({ className, children }) => {
  const ctx = useDatePickerContext();

  return (
    <div className={cn('flex items-center justify-between px-1 pb-3 pt-1 border-b border-slate-100', className)}>
      {children || (
        <>
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-sm">
            <span>{MONTH_NAMES[ctx.viewMonth]}</span>
            <span className="text-slate-500 font-normal">{ctx.viewYear}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={ctx.prevMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={ctx.nextMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const CalendarNavButton: React.FC<{
  slot: 'previous' | 'next';
  className?: string;
}> = ({ slot, className }) => {
  const ctx = useDatePickerContext();
  const isPrev = slot === 'previous';

  return (
    <button
      type="button"
      onClick={isPrev ? ctx.prevMonth : ctx.nextMonth}
      className={cn(
        'p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors select-none',
        className
      )}
      title={isPrev ? 'Previous Month' : 'Next Month'}
    >
      {isPrev ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
  );
};

export const CalendarHeading: React.FC<{
  className?: string;
}> = ({ className }) => {
  const ctx = useDatePickerContext();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Quick year options (+- 10 years or 50 years back for birth dates)
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const arr: number[] = [];
    for (let y = current + 10; y >= current - 70; y--) {
      arr.push(y);
    }
    return arr;
  }, []);

  return (
    <div className={cn('relative flex items-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => setIsPickerOpen(!isPickerOpen)}
        className="text-sm font-semibold text-slate-800 hover:text-[#D68904] flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-100 transition-colors"
      >
        <span>{MONTH_NAMES[ctx.viewMonth]}</span>
        <span>{ctx.viewYear}</span>
      </button>

      {isPickerOpen && (
        <div className="absolute top-full left-0 mt-1 z-30 p-2 bg-white rounded-xl shadow-xl border border-slate-200 grid grid-cols-2 gap-2 w-48 max-h-48 overflow-y-auto">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Month</div>
            {MONTH_NAMES.map((m, idx) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  ctx.setViewMonth(idx);
                  setIsPickerOpen(false);
                }}
                className={cn(
                  'w-full text-left text-xs px-2 py-1 rounded hover:bg-amber-50 hover:text-[#D68904]',
                  idx === ctx.viewMonth && 'bg-[#D68904] text-white font-semibold hover:bg-[#D68904] hover:text-white'
                )}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Year</div>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  ctx.setViewYear(y);
                  setIsPickerOpen(false);
                }}
                className={cn(
                  'w-full text-left text-xs px-2 py-1 rounded hover:bg-amber-50 hover:text-[#D68904]',
                  y === ctx.viewYear && 'bg-[#D68904] text-white font-semibold hover:bg-[#D68904] hover:text-white'
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CalendarGridHeader: React.FC<{
  children?: (day: string) => ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('grid grid-cols-7 gap-1 pt-2 pb-1', className)}>
      {WEEKDAY_NAMES.map((day) =>
        children ? (
          <React.Fragment key={day}>{children(day)}</React.Fragment>
        ) : (
          <div
            key={day}
            className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-1"
          >
            {day}
          </div>
        )
      )}
    </div>
  );
};

export const CalendarHeaderCell: React.FC<{
  className?: string;
  children: ReactNode;
}> = ({ className, children }) => (
  <div className={cn('text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-1', className)}>
    {children}
  </div>
);

export const CalendarGridBody: React.FC<{
  children?: (date: { date: Date; dateStr: string; isCurrentMonth: boolean }) => ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const ctx = useDatePickerContext();

  const daysInGrid = useMemo(() => {
    const year = ctx.viewYear;
    const month = ctx.viewMonth;
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Adjust for Monday start (0 = Sunday, 1 = Monday, ...)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Preceding days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, dateStr: formatISODate(d), isCurrentMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const current = new Date(year, month, d);
      days.push({ date: current, dateStr: formatISODate(current), isCurrentMonth: true });
    }

    // Trailing days to fill 5 or 6 rows (multiples of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({ date: d, dateStr: formatISODate(d), isCurrentMonth: false });
      }
    }

    return days;
  }, [ctx.viewYear, ctx.viewMonth]);

  return (
    <div className={cn('grid grid-cols-7 gap-y-1 gap-x-0.5', className)}>
      {daysInGrid.map((item) =>
        children ? (
          <React.Fragment key={item.dateStr}>{children(item)}</React.Fragment>
        ) : (
          <CalendarCell key={item.dateStr} date={item} />
        )
      )}
    </div>
  );
};

export const CalendarCell: React.FC<{
  date: { date: Date; dateStr: string; isCurrentMonth: boolean };
  className?: string;
}> = ({ date, className }) => {
  const ctx = useDatePickerContext();
  const d = date.date;
  const dateStr = date.dateStr;

  const todayStr = useMemo(() => formatISODate(new Date()), []);
  const isToday = dateStr === todayStr;

  const isDisabled = useMemo(() => {
    if (ctx.minDate && dateStr < ctx.minDate) return true;
    if (ctx.maxDate && dateStr > ctx.maxDate) return true;
    return false;
  }, [ctx.minDate, ctx.maxDate, dateStr]);

  if (ctx.mode === 'single') {
    const isSelected = ctx.singleDate === dateStr;

    return (
      <div className="relative p-0.5 flex items-center justify-center">
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => ctx.onSelectDate(dateStr)}
          className={cn(
            'w-8 h-8 rounded-full text-xs flex items-center justify-center font-medium transition-all select-none',
            !date.isCurrentMonth && 'text-slate-300',
            date.isCurrentMonth && !isSelected && 'text-slate-700 hover:bg-slate-100',
            isToday && !isSelected && 'border border-[#D68904] font-bold text-[#D68904]',
            isSelected && 'bg-[#D68904] text-white font-semibold shadow-xs hover:bg-[#b86e03]',
            isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent text-slate-300',
            className
          )}
        >
          {d.getDate()}
        </button>
      </div>
    );
  }

  // RANGE MODE
  const startObj = parseISODate(ctx.rangeStart);
  const endObj = parseISODate(ctx.rangeEnd);
  const hoverObj = parseISODate(ctx.hoverDate);

  const isStart = ctx.rangeStart === dateStr;
  const isEnd = ctx.rangeEnd === dateStr;
  const isSingleDayRange = isStart && isEnd;

  // If start is set but end is not, use hover date to preview the range
  const isPreviewing = Boolean(ctx.rangeStart && !ctx.rangeEnd && ctx.hoverDate);
  const effectiveEndObj = isPreviewing ? hoverObj : endObj;

  const inSelectedRange =
    startObj && effectiveEndObj ? isBetween(d, startObj, effectiveEndObj) : false;

  const isBetweenDates = inSelectedRange && !isStart && !isEnd;

  return (
    <div
      onMouseEnter={() => {
        if (ctx.rangeStart && !ctx.rangeEnd) {
          ctx.setHoverDate(dateStr);
        }
      }}
      className={cn(
        'relative p-0 flex items-center justify-center h-8',
        inSelectedRange && 'bg-amber-50/80',
        isStart && !isSingleDayRange && 'rounded-l-full',
        (isEnd || (isPreviewing && ctx.hoverDate === dateStr)) && !isSingleDayRange && 'rounded-r-full',
        isSingleDayRange && 'rounded-full'
      )}
    >
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => ctx.onSelectDate(dateStr)}
        className={cn(
          'w-8 h-8 text-xs flex items-center justify-center font-medium transition-all select-none',
          !date.isCurrentMonth && 'text-slate-300',
          date.isCurrentMonth && !isStart && !isEnd && !isBetweenDates && 'text-slate-700 hover:bg-slate-100 rounded-full',
          isBetweenDates && 'text-amber-900 font-semibold',
          isToday && !isStart && !isEnd && 'font-bold text-[#D68904]',
          (isStart || isEnd) &&
            'bg-[#D68904] text-white font-semibold shadow-xs hover:bg-[#b86e03] rounded-full z-10',
          isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent text-slate-300',
          className
        )}
      >
        {d.getDate()}
      </button>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                        RANGE CALENDAR COMPOSED ROOT                        */
/* -------------------------------------------------------------------------- */

export const RangeCalendar = Object.assign(
  ({
    className,
    children,
    'aria-label': ariaLabel,
  }: {
    className?: string;
    children?: ReactNode;
    'aria-label'?: string;
  }) => {
    return (
      <div
        aria-label={ariaLabel}
        className={cn('w-72 select-none rounded-2xl bg-white p-2.5', className)}
      >
        {children || (
          <>
            <CalendarHeader>
              <CalendarHeading />
              <div className="flex items-center gap-1">
                <CalendarNavButton slot="previous" />
                <CalendarNavButton slot="next" />
              </div>
            </CalendarHeader>
            <div className="pt-2">
              <CalendarGridHeader />
              <CalendarGridBody />
            </div>
          </>
        )}
      </div>
    );
  },
  {
    Header: CalendarHeader,
    Heading: CalendarHeading,
    NavButton: CalendarNavButton,
    Grid: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={cn('pt-2', className)}>{children}</div>
    ),
    GridHeader: CalendarGridHeader,
    HeaderCell: CalendarHeaderCell,
    GridBody: CalendarGridBody,
    Cell: CalendarCell,
  }
);

export const Calendar = Object.assign(
  ({
    className,
    children,
    'aria-label': ariaLabel,
  }: {
    className?: string;
    children?: ReactNode;
    'aria-label'?: string;
  }) => {
    return (
      <div
        aria-label={ariaLabel}
        className={cn('w-72 select-none rounded-2xl bg-white p-2.5', className)}
      >
        {children || (
          <>
            <CalendarHeader>
              <CalendarHeading />
              <div className="flex items-center gap-1">
                <CalendarNavButton slot="previous" />
                <CalendarNavButton slot="next" />
              </div>
            </CalendarHeader>
            <div className="pt-2">
              <CalendarGridHeader />
              <CalendarGridBody />
            </div>
          </>
        )}
      </div>
    );
  },
  {
    Header: CalendarHeader,
    Heading: CalendarHeading,
    NavButton: CalendarNavButton,
    Grid: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={cn('pt-2', className)}>{children}</div>
    ),
    GridHeader: CalendarGridHeader,
    HeaderCell: CalendarHeaderCell,
    GridBody: CalendarGridBody,
    Cell: CalendarCell,
  }
);

/* -------------------------------------------------------------------------- */
/*                               POPOVER & TRIGGER                            */
/* -------------------------------------------------------------------------- */

export const DatePickerPopover: React.FC<{
  className?: string;
  children: ReactNode;
}> = ({ className, children }) => {
  const ctx = useDatePickerContext();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        // Check if click was on the trigger button or input
        const trigger = popoverRef.current.parentElement?.querySelector('[data-datepicker-trigger]');
        if (trigger && trigger.contains(e.target as Node)) {
          return;
        }
        ctx.setIsOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        ctx.setIsOpen(false);
      }
    };

    if (ctx.isOpen) {
      document.addEventListener('mousedown', handleOutside);
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [ctx]);

  if (!ctx.isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className={cn(
        'absolute left-0 top-full mt-1.5 z-50 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl animate-fadeIn',
        className
      )}
    >
      {children}
    </div>
  );
};

export const DatePickerTrigger: React.FC<{
  className?: string;
  children?: ReactNode;
}> = ({ className, children }) => {
  const ctx = useDatePickerContext();

  return (
    <button
      type="button"
      data-datepicker-trigger="true"
      onClick={(e) => {
        e.stopPropagation();
        if (!ctx.disabled) ctx.setIsOpen(!ctx.isOpen);
      }}
      disabled={ctx.disabled}
      className={cn(
        'inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors select-none',
        ctx.isOpen && 'text-[#D68904] bg-amber-50',
        className
      )}
      title="Open Calendar"
    >
      {children || <CalendarIcon className="w-4 h-4" />}
    </button>
  );
};

export const DatePickerTriggerIndicator: React.FC<{
  className?: string;
}> = ({ className }) => <CalendarIcon className={cn('w-4 h-4', className)} />;

export const RangeSeparator: React.FC<{
  className?: string;
  children?: ReactNode;
}> = ({ className, children }) => (
  <span className={cn('text-slate-400 font-medium select-none px-1 text-xs', className)}>
    {children || '–'}
  </span>
);

/* -------------------------------------------------------------------------- */
/*                    HIGH-LEVEL SINGLE DATE PICKER                           */
/* -------------------------------------------------------------------------- */

export interface DatePickerProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (val: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  id?: string;
  name?: string;
  children?: ReactNode;
}

export const DatePicker = Object.assign(
  React.forwardRef<HTMLDivElement, DatePickerProps>(
    (
      {
        label,
        value,
        defaultValue = '',
        onChange,
        minDate,
        maxDate,
        placeholder = 'Select date',
        required,
        disabled,
        error,
        helperText,
        className,
        id,
        name,
        children,
      },
      ref
    ) => {
      const [internalDate, setInternalDate] = useState(defaultValue);
      const isControlled = value !== undefined;
      const singleDate = isControlled ? value || '' : internalDate;

      const [isOpen, setIsOpen] = useState(false);

      // Default month/year view to selected date or current date
      const initialDate = parseISODate(singleDate) || new Date();
      const [viewYear, setViewYear] = useState(initialDate.getFullYear());
      const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

      useEffect(() => {
        if (singleDate) {
          const parsed = parseISODate(singleDate);
          if (parsed) {
            setViewYear(parsed.getFullYear());
            setViewMonth(parsed.getMonth());
          }
        }
      }, [singleDate]);

      const nextMonth = useCallback(() => {
        setViewMonth((prev) => {
          if (prev === 11) {
            setViewYear((y) => y + 1);
            return 0;
          }
          return prev + 1;
        });
      }, []);

      const prevMonth = useCallback(() => {
        setViewMonth((prev) => {
          if (prev === 0) {
            setViewYear((y) => y - 1);
            return 11;
          }
          return prev - 1;
        });
      }, []);

      const onSelectDate = useCallback(
        (dateStr: string) => {
          if (!isControlled) setInternalDate(dateStr);
          onChange?.(dateStr);
          setIsOpen(false);
        },
        [isControlled, onChange]
      );

      const clearSelection = useCallback(() => {
        if (!isControlled) setInternalDate('');
        onChange?.('');
      }, [isControlled, onChange]);

      const contextValue: DatePickerContextValue = {
        mode: 'single',
        singleDate,
        rangeStart: '',
        rangeEnd: '',
        hoverDate: null,
        setHoverDate: () => {},
        isOpen,
        setIsOpen,
        viewYear,
        viewMonth,
        setViewYear,
        setViewMonth,
        nextMonth,
        prevMonth,
        onSelectDate,
        clearSelection,
        minDate,
        maxDate,
        disabled,
      };

      const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

      return (
        <DatePickerContext.Provider value={contextValue}>
          <div ref={ref} className={cn('relative w-full space-y-1.5', className)}>
            {label && (
              <Label htmlFor={inputId} required={required}>
                {label}
              </Label>
            )}

            {children ? (
              children
            ) : (
              <>
                <DateField.Group
                  onClick={() => {
                    if (!disabled) setIsOpen(!isOpen);
                  }}
                  className={cn(
                    error && 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20',
                    disabled && 'bg-slate-100 cursor-not-allowed opacity-60'
                  )}
                >
                  <DateField.Input
                    placeholder={placeholder}
                    value={singleDate}
                    disabled={disabled}
                  />

                  {name && <input type="hidden" name={name} value={singleDate} />}

                  <DateField.Suffix>
                    {singleDate && !disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSelection();
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors mr-1"
                        title="Clear date"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <DatePickerTrigger />
                  </DateField.Suffix>
                </DateField.Group>

                <DatePickerPopover>
                  <Calendar />
                  <div className="flex items-center justify-between pt-2 px-1 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const today = formatISODate(new Date());
                        onSelectDate(today);
                      }}
                      className="text-[#D68904] font-medium hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Today
                    </button>
                    {singleDate && (
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-slate-400 hover:text-slate-700 font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </DatePickerPopover>
              </>
            )}

            {error ? (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            ) : helperText ? (
              <p className="text-xs text-slate-500">{helperText}</p>
            ) : null}
          </div>
        </DatePickerContext.Provider>
      );
    }
  ),
  {
    Trigger: DatePickerTrigger,
    TriggerIndicator: DatePickerTriggerIndicator,
    Popover: DatePickerPopover,
  }
);

/* -------------------------------------------------------------------------- */
/*                     HIGH-LEVEL DATE RANGE PICKER                           */
/* -------------------------------------------------------------------------- */

export interface DateRangePickerProps {
  label?: string;
  startDate?: string;
  endDate?: string;
  value?: { start: string; end: string };
  defaultValue?: { start: string; end: string };
  onChange?: (range: { start: string; end: string }) => void;
  onRangeChange?: (start: string, end: string) => void;
  startName?: string;
  endName?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  id?: string;
  children?: ReactNode;
}

export const DateRangePicker = Object.assign(
  React.forwardRef<HTMLDivElement, DateRangePickerProps>(
    (
      {
        label,
        startDate: controlledStart,
        endDate: controlledEnd,
        value: controlledValue,
        defaultValue = { start: '', end: '' },
        onChange,
        onRangeChange,
        startName = 'startDate',
        endName = 'endDate',
        minDate,
        maxDate,
        required,
        disabled,
        error,
        helperText,
        className,
        id,
        children,
      },
      ref
    ) => {
      const [internalRange, setInternalRange] = useState(defaultValue);
      const isControlledValue = controlledValue !== undefined;
      const isControlledParts = controlledStart !== undefined || controlledEnd !== undefined;

      const rangeStart = isControlledValue
        ? controlledValue?.start || ''
        : isControlledParts
        ? controlledStart || ''
        : internalRange.start;

      const rangeEnd = isControlledValue
        ? controlledValue?.end || ''
        : isControlledParts
        ? controlledEnd || ''
        : internalRange.end;

      const [hoverDate, setHoverDate] = useState<string | null>(null);
      const [isOpen, setIsOpen] = useState(false);

      // Default month/year view to start date or today
      const initialDate = parseISODate(rangeStart) || new Date();
      const [viewYear, setViewYear] = useState(initialDate.getFullYear());
      const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

      useEffect(() => {
        if (rangeStart) {
          const parsed = parseISODate(rangeStart);
          if (parsed) {
            setViewYear(parsed.getFullYear());
            setViewMonth(parsed.getMonth());
          }
        }
      }, [rangeStart]);

      const nextMonth = useCallback(() => {
        setViewMonth((prev) => {
          if (prev === 11) {
            setViewYear((y) => y + 1);
            return 0;
          }
          return prev + 1;
        });
      }, []);

      const prevMonth = useCallback(() => {
        setViewMonth((prev) => {
          if (prev === 0) {
            setViewYear((y) => y - 1);
            return 11;
          }
          return prev - 1;
        });
      }, []);

      const updateRange = useCallback(
        (start: string, end: string) => {
          if (!isControlledValue && !isControlledParts) {
            setInternalRange({ start, end });
          }
          onChange?.({ start, end });
          onRangeChange?.(start, end);
        },
        [isControlledValue, isControlledParts, onChange, onRangeChange]
      );

      const onSelectDate = useCallback(
        (dateStr: string) => {
          // If no start date, or both start & end are already set, begin new range
          if (!rangeStart || (rangeStart && rangeEnd)) {
            updateRange(dateStr, '');
            setHoverDate(null);
          } else if (rangeStart && !rangeEnd) {
            // Second click: finalize range
            if (dateStr < rangeStart) {
              // User clicked an earlier date, make it start
              updateRange(dateStr, rangeStart);
            } else {
              updateRange(rangeStart, dateStr);
            }
            setHoverDate(null);
            setIsOpen(false);
          }
        },
        [rangeStart, rangeEnd, updateRange]
      );

      const clearSelection = useCallback(() => {
        updateRange('', '');
        setHoverDate(null);
      }, [updateRange]);

      const contextValue: DatePickerContextValue = {
        mode: 'range',
        singleDate: '',
        rangeStart,
        rangeEnd,
        hoverDate,
        setHoverDate,
        isOpen,
        setIsOpen,
        viewYear,
        viewMonth,
        setViewYear,
        setViewMonth,
        nextMonth,
        prevMonth,
        onSelectDate,
        clearSelection,
        minDate,
        maxDate,
        disabled,
      };

      const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

      return (
        <DatePickerContext.Provider value={contextValue}>
          <div ref={ref} className={cn('relative w-full space-y-1.5', className)}>
            {label && (
              <Label htmlFor={inputId} required={required}>
                {label}
              </Label>
            )}

            {children ? (
              children
            ) : (
              <>
                <DateField.Group
                  onClick={() => {
                    if (!disabled) setIsOpen(!isOpen);
                  }}
                  className={cn(
                    error && 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20',
                    disabled && 'bg-slate-100 cursor-not-allowed opacity-60'
                  )}
                >
                  <DateField.InputContainer>
                    <DateField.Input slot="start" placeholder="Start date" />
                    <RangeSeparator className="text-slate-400" />
                    <DateField.Input slot="end" placeholder="End date" />
                  </DateField.InputContainer>

                  {startName && <input type="hidden" name={startName} value={rangeStart} />}
                  {endName && <input type="hidden" name={endName} value={rangeEnd} />}

                  <DateField.Suffix>
                    {(rangeStart || rangeEnd) && !disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSelection();
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors mr-1"
                        title="Clear range"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <DatePickerTrigger />
                  </DateField.Suffix>
                </DateField.Group>

                <DatePickerPopover>
                  <div className="flex flex-col gap-2">
                    <RangeCalendar />
                    {/* Quick presets for convenience */}
                    <div className="flex flex-wrap items-center justify-between gap-1 pt-2 px-1 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const todayStr = formatISODate(now);
                            const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                            updateRange(todayStr, formatISODate(next30));
                            setIsOpen(false);
                          }}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-50 hover:text-[#D68904] text-slate-600 font-medium transition-colors"
                        >
                          +30 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const todayStr = formatISODate(now);
                            const next90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
                            updateRange(todayStr, formatISODate(next90));
                            setIsOpen(false);
                          }}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-50 hover:text-[#D68904] text-slate-600 font-medium transition-colors"
                        >
                          +3 Months
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const todayStr = formatISODate(now);
                            const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                            updateRange(todayStr, formatISODate(nextYear));
                            setIsOpen(false);
                          }}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-50 hover:text-[#D68904] text-slate-600 font-medium transition-colors"
                        >
                          +1 Year
                        </button>
                      </div>

                      {(rangeStart || rangeEnd) && (
                        <button
                          type="button"
                          onClick={clearSelection}
                          className="text-slate-400 hover:text-slate-700 font-medium ml-auto"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </DatePickerPopover>
              </>
            )}

            {error ? (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            ) : helperText ? (
              <p className="text-xs text-slate-500">{helperText}</p>
            ) : null}
          </div>
        </DatePickerContext.Provider>
      );
    }
  ),
  {
    Trigger: DatePickerTrigger,
    TriggerIndicator: DatePickerTriggerIndicator,
    Popover: DatePickerPopover,
    RangeSeparator,
  }
);
