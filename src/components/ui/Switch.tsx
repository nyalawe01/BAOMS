import React, { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
export { Label, Description } from './Dropdown';

export type SwitchSize = 'sm' | 'md' | 'lg';

interface SwitchContextValue {
  isSelected: boolean;
  size: SwitchSize;
  isDisabled: boolean;
}

const SwitchContext = createContext<SwitchContextValue>({
  isSelected: false,
  size: 'md',
  isDisabled: false,
});

/* -------------------------------------------------------------------------- */
/*                                SWITCH THUMB                                */
/* -------------------------------------------------------------------------- */

export interface SwitchThumbProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

export const SwitchThumb: React.FC<SwitchThumbProps> = ({ className, children, ...props }) => {
  const { isSelected, size } = useContext(SwitchContext);

  const thumbSizeStyles: Record<SwitchSize, string> = {
    sm: 'size-3 data-[selected=true]:translate-x-3.5',
    md: 'size-4 data-[selected=true]:translate-x-4',
    lg: 'size-5 data-[selected=true]:translate-x-5',
  };

  return (
    <span
      data-selected={isSelected ? 'true' : undefined}
      className={cn(
        'switch__thumb inline-flex items-center justify-center rounded-full bg-white shadow-xs transition-transform duration-200 ease-out transform translate-x-0',
        thumbSizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 SWITCH ICON                                */
/* -------------------------------------------------------------------------- */

export const SwitchIcon: React.FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => {
  return (
    <span className={cn('switch__icon flex items-center justify-center text-slate-700', className)}>
      {children}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*                                SWITCH CONTROL                              */
/* -------------------------------------------------------------------------- */

export interface SwitchControlProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

export const SwitchControl: React.FC<SwitchControlProps> = ({ className, children, ...props }) => {
  const { isSelected, size } = useContext(SwitchContext);

  const trackSizeStyles: Record<SwitchSize, string> = {
    sm: 'h-4 w-7.5 p-0.5',
    md: 'h-5 w-9.5 p-0.5',
    lg: 'h-6.5 w-12 p-0.5',
  };

  return (
    <span
      data-selected={isSelected ? 'true' : undefined}
      className={cn(
        'switch__control shrink-0 inline-flex items-center rounded-full transition-colors duration-200 ease-out cursor-pointer',
        isSelected
          ? 'bg-[#D68904] dark:bg-[#eaaf4a]'
          : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400/80',
        trackSizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*                                SWITCH CONTENT                              */
/* -------------------------------------------------------------------------- */

export const SwitchContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('switch__content inline-flex items-center gap-2.5 select-none', className)} {...props}>
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 SWITCH ROOT                                */
/* -------------------------------------------------------------------------- */

export interface SwitchProps extends Omit<React.HTMLAttributes<HTMLLabelElement>, 'onChange' | 'children'> {
  size?: SwitchSize;
  isSelected?: boolean;
  defaultSelected?: boolean;
  isDisabled?: boolean;
  name?: string;
  value?: string;
  'aria-label'?: string;
  onChange?: (isSelected: boolean) => void;
  children?: ReactNode | ((values: { isSelected: boolean }) => ReactNode);
}

export const SwitchRoot: React.FC<SwitchProps> = ({
  size = 'md',
  isSelected: controlledSelected,
  defaultSelected = false,
  isDisabled = false,
  name,
  value = 'on',
  'aria-label': ariaLabel,
  onChange,
  className,
  children,
  ...props
}) => {
  const [uncontrolledSelected, setUncontrolledSelected] = useState(defaultSelected);
  const isControlled = controlledSelected !== undefined;
  const isSelected = isControlled ? controlledSelected : uncontrolledSelected;

  const handleToggle = () => {
    if (isDisabled) return;
    const next = !isSelected;
    if (!isControlled) {
      setUncontrolledSelected(next);
    }
    onChange?.(next);
  };

  const content = typeof children === 'function' ? children({ isSelected }) : children;

  // If plain children provided without Switch.Control, auto-wrap
  const hasCompoundControl = React.Children.toArray(content).some(
    (child) => React.isValidElement(child) && (child.type === SwitchControl || child.type === SwitchContent)
  );

  return (
    <SwitchContext.Provider value={{ isSelected, size, isDisabled }}>
      <label
        aria-label={ariaLabel}
        data-selected={isSelected ? 'true' : undefined}
        data-disabled={isDisabled ? 'true' : undefined}
        className={cn(
          'switch inline-flex items-center gap-2.5 cursor-pointer select-none group',
          isDisabled && 'opacity-50 pointer-events-none cursor-not-allowed',
          className
        )}
        onClick={handleToggle}
        {...props}
      >
        <input
          type="checkbox"
          name={name}
          value={value}
          checked={isSelected}
          disabled={isDisabled}
          onChange={() => {}}
          className="sr-only"
          aria-hidden="true"
        />
        {hasCompoundControl ? (
          content
        ) : (
          <SwitchContent>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            {content && <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">{content}</span>}
          </SwitchContent>
        )}
      </label>
    </SwitchContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*                                SWITCH GROUP                                */
/* -------------------------------------------------------------------------- */

export interface SwitchGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  children: ReactNode;
}

export const SwitchGroup: React.FC<SwitchGroupProps> = ({
  orientation = 'vertical',
  className,
  children,
  ...props
}) => {
  return (
    <div
      role="group"
      className={cn(
        'switch-group flex gap-3',
        orientation === 'horizontal' ? 'flex-row items-center flex-wrap' : 'flex-col',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               COMPOUND EXPORT                              */
/* -------------------------------------------------------------------------- */

export const Switch = Object.assign(SwitchRoot, {
  Content: SwitchContent,
  Control: SwitchControl,
  Thumb: SwitchThumb,
  Icon: SwitchIcon,
});
