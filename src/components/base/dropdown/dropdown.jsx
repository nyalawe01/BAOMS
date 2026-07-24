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

  // Clone trigger to inject click handler and ref
  const clonedTrigger = React.cloneElement(trigger, {
    ref: triggerRef,
    onClick: (e) => {
      if (trigger.props.onClick) trigger.props.onClick(e);
      setIsOpen(!isOpen);
    }
  });

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, popoverRef }}>
      <div className="relative inline-block text-left font-sans">
        {clonedTrigger}
        {isOpen && popover}
      </div>
    </DropdownContext.Provider>
  );
}

export function Popover({ className = '', children }) {
  const { popoverRef } = useContext(DropdownContext);
  return (
    <div
      ref={popoverRef}
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
      onClick={handleClick}
      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
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

      {addon && <span className="text-[9px] font-mono text-slate-400">{addon}</span>}
    </button>
  );
}

export function Section({ children }) {
  return <div className="py-1">{children}</div>;
}

export function SectionHeader({ className = '', children }) {
  return (
    <div className={`px-3.5 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest ${className}`}>
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
