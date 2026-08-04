import React, { useState, createContext, useContext, useRef, useEffect } from 'react';

const DropdownContext = createContext(null);

export function Root({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popoverRef.current && !popoverRef.current.contains(event.target) &&
        triggerRef.current && !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Split trigger and popover
  const childrenArray = React.Children.toArray(children);
  const trigger = childrenArray[0];
  const popover = childrenArray.slice(1);

  const handleTriggerKeyDown = (e) => {
    if (trigger.props.onKeyDown) trigger.props.onKeyDown(e);
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsOpen(true);
    } else if (isOpen && e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Clone trigger to inject click handler, ref and ARIA attributes
  const clonedTrigger = React.cloneElement(trigger, {
    ref: triggerRef,
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    onClick: (e) => {
      if (trigger.props.onClick) trigger.props.onClick(e);
      setIsOpen(!isOpen);
    },
    onKeyDown: handleTriggerKeyDown
  });

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, popoverRef, triggerRef }}>
      <div className="relative inline-block text-left font-sans">
        {clonedTrigger}
        {isOpen && popover}
      </div>
    </DropdownContext.Provider>
  );
}

export function Popover({ className = '', children }) {
  const { popoverRef, setIsOpen, triggerRef } = useContext(DropdownContext);

  // Move focus into the menu as soon as it opens so arrow keys work immediately.
  useEffect(() => {
    const firstItem = popoverRef.current?.querySelector('[role="menuitem"]');
    firstItem?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e) => {
    const menuItems = Array.from(popoverRef.current?.querySelectorAll('[role="menuitem"]') || []);
    if (menuItems.length === 0) return;
    const currentIndex = menuItems.indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % menuItems.length;
      menuItems[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex < 0 ? menuItems.length - 1 : (currentIndex - 1 + menuItems.length) % menuItems.length;
      menuItems[prevIndex]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      ref={popoverRef}
      role="menu"
      onKeyDown={handleKeyDown}
      className={`absolute left-0 mt-1.5 rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden z-50 animate-fadeIn ${className}`}
    >
      {children}
    </div>
  );
}

export function Menu({ children, selectionMode = 'none', selectedKeys = new Set(), onSelectionChange = () => {} }) {
  return (
    <div className="py-1 min-w-[140px] flex flex-col">
      {React.Children.map(children, child => {
        if (!child) return null;

        // Pass selections to items if needed
        if (child.type === Item) {
          const isSelected = selectedKeys instanceof Set
            ? selectedKeys.has(child.props.id)
            : Array.isArray(selectedKeys)
              ? selectedKeys.includes(child.props.id)
              : selectedKeys === child.props.id;

          return React.cloneElement(child, {
            isSelected,
            selectionMode,
            onClick: () => {
              if (selectionMode === 'multiple') {
                const next = new Set(selectedKeys);
                if (next.has(child.props.id)) {
                  next.delete(child.props.id);
                } else {
                  next.add(child.props.id);
                }
                onSelectionChange(next);
              } else if (selectionMode === 'single') {
                onSelectionChange(child.props.id);
              }
              if (child.props.onClick) child.props.onClick();
            }
          });
        }
        return child;
      })}
    </div>
  );
}

export function Item({
  id,
  icon: Icon = null,
  avatarUrl = '',
  selectionIndicator = 'none',
  isSelected = false,
  addon = '',
  onClick = () => {},
  children
}) {
  const { setIsOpen } = useContext(DropdownContext);

  const handleClick = (e) => {
    onClick(e);
    // Auto-close dropdown unless multiple selection is active
    if (selectionIndicator !== 'checkbox') {
      setIsOpen(false);
    }
  };

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={handleClick}
      className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
    >
      <div className="flex items-center gap-2 truncate">
        {selectionIndicator === 'checkbox' && (
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-3.5 h-3.5"
          />
        )}

        {selectionIndicator === 'radio' && (
          <input
            type="radio"
            checked={isSelected}
            readOnly
            className="border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
          />
        )}

        {avatarUrl && (
          <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
        )}

        {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
        <span className="font-semibold text-slate-700 truncate">{children}</span>
      </div>

      {addon && <span className="text-xs font-mono text-slate-400">{addon}</span>}
    </button>
  );
}

export function Section({ children }) {
  return <div className="py-1">{children}</div>;
}

export function SectionHeader({ className = '', children }) {
  return (
    <div className={`px-3.5.5 py-1 text-xs font-bold text-slate-400 uppercase tracking-widest ${className}`}>
      {children}
    </div>
  );
}

export function Separator() {
  return <div className="h-px bg-slate-150 my-1" />;
}

export const Dropdown = {
  Root,
  Popover,
  Menu,
  Item,
  Section,
  SectionHeader,
  Separator
};
