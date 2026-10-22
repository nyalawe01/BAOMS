import React, { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonOrientation = 'horizontal' | 'vertical';

export interface ButtonGroupContextValue {
  variant?: ButtonVariant;
  size?: ButtonSize;
  orientation?: ButtonOrientation;
  fullWidth?: boolean;
  isDisabled?: boolean;
  isInGroup?: boolean;
}

export const ButtonGroupContext = createContext<ButtonGroupContextValue>({
  isInGroup: false,
});

export const useButtonGroup = () => useContext(ButtonGroupContext);

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  orientation?: ButtonOrientation;
  fullWidth?: boolean;
  isDisabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const ButtonGroupSeparator: React.FC<{ className?: string }> = ({ className }) => {
  const { orientation = 'horizontal' } = useButtonGroup();
  return (
    <span
      aria-hidden="true"
      className={cn(
        'button-group__separator shrink-0 bg-current opacity-20 pointer-events-none select-none transition-opacity',
        orientation === 'horizontal' ? 'w-[1px] h-3.5 mx-1 inline-block align-middle' : 'h-[1px] w-3.5 my-1 block mx-auto',
        className
      )}
    />
  );
};

export const ButtonGroup = Object.assign(
  React.forwardRef<HTMLDivElement, ButtonGroupProps>(
    (
      {
        variant,
        size,
        orientation = 'horizontal',
        fullWidth = false,
        isDisabled = false,
        className,
        children,
        ...props
      },
      ref
    ) => {
      const isHorizontal = orientation === 'horizontal';

      return (
        <ButtonGroupContext.Provider
          value={{
            variant,
            size,
            orientation,
            fullWidth,
            isDisabled,
            isInGroup: true,
          }}
        >
          <div
            ref={ref}
            role="group"
            data-orientation={orientation}
            className={cn(
              'button-group inline-flex items-center isolate rounded-xl border border-slate-200/80 shadow-none',
              isHorizontal ? 'flex-row' : 'flex-col items-stretch',
              fullWidth && 'w-full button-group--full-width',
              /* HeroUI Connected Border Radii and Border Deduplication */
              isHorizontal && [
                '[&>button:not(:first-child)]:rounded-l-none [&>button:not(:first-child)]:-ml-[1px]',
                '[&>button:not(:last-child)]:rounded-r-none',
                '[&>div:not(:first-child)>button]:rounded-l-none [&>div:not(:first-child)]:-ml-[1px]',
                '[&>div:not(:last-child)>button]:rounded-r-none',
              ],
              !isHorizontal && [
                '[&>button:not(:first-child)]:rounded-t-none [&>button:not(:first-child)]:-mt-[1px]',
                '[&>button:not(:last-child)]:rounded-b-none',
                '[&>div:not(:first-child)>button]:rounded-t-none [&>div:not(:first-child)]:-mt-[1px]',
                '[&>div:not(:last-child)>button]:rounded-b-none',
              ],
              className
            )}
            {...props}
          >
            {children}
          </div>
        </ButtonGroupContext.Provider>
      );
    }
  ),
  {
    Separator: ButtonGroupSeparator,
  }
);

ButtonGroup.displayName = 'ButtonGroup';
