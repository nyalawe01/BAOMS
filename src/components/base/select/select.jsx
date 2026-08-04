import React, { useState, useRef, useEffect, useId } from 'react';

export function Select({
  isRequired = false,
  label = '',
  tooltip = '',
  hint = '',
  placeholder = 'Select option',
  icon: Icon = null,
  items = [],
  value = '',
  onChange = () => {},
  children
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(value);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const listboxId = useId();

  const handleSelect = (id) => {
    setSelectedId(id);
    onChange(id);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    setSelectedId(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When the listbox opens, move focus onto the currently selected option
  // (or the first option) so arrow keys work immediately.
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = items.findIndex(item => item.id === selectedId);
      const focusIndex = selectedIndex >= 0 ? selectedIndex : 0;
      optionRefs.current[focusIndex]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleTriggerKeyDown = (event) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      setIsOpen(true);
    } else if (isOpen && event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleOptionKeyDown = (event, index) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = Math.min(index + 1, items.length - 1);
      optionRefs.current[nextIndex]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = Math.max(index - 1, 0);
      optionRefs.current[prevIndex]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
    // Enter / Space are handled natively since options render as <button>.
  };

  const selectedItem = items.find(item => item.id === selectedId);

  return (
    <div className="relative space-y-1 w-full text-left font-sans" ref={containerRef}>
      {label && (
        <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <span>{label}</span>
          {isRequired && <span className="text-rose-500">*</span>}
          {tooltip && (
            <span className="text-slate-400 cursor-help hover:text-slate-650" title={tooltip}>
              ⓘ
            </span>
          )}
        </label>
      )}

      <button
        type="button"
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className="w-full flex items-center justify-between px-3.5.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 hover:border-slate-350 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus:border-indigo-500 shadow-sm transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon size={16} className="text-slate-400 shrink-0" />}
          {selectedItem?.avatarUrl && (
            <img src={selectedItem.avatarUrl} alt={selectedItem.label} className="w-5 h-5 rounded-full object-cover shrink-0" />
          )}
          <span className={selectedItem ? 'text-slate-800 font-semibold' : 'text-slate-400 font-medium'}>
            {selectedItem ? selectedItem.label : placeholder}
          </span>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1 animate-fadeIn"
        >
          {items.map((item, index) => {
            const isSelected = item.id === selectedId;
            const element = children ? children(item) : null;

            // Extract item customization properties
            const avatarUrl = element?.props?.avatarUrl || item.avatarUrl;
            const supportingText = element?.props?.supportingText || item.supportingText;

            return (
              <button
                key={item.id}
                type="button"
                ref={(el) => { optionRefs.current[index] = el; }}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onClick={() => handleSelect(item.id)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                className={`w-full flex items-center justify-between px-3.5.5 py-3 hover:bg-slate-50 transition-colors text-left text-sm focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                  isSelected ? 'bg-indigo-50/50 text-indigo-900 font-bold' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {avatarUrl && (
                    <img src={avatarUrl} alt={item.label} className="w-6 h-6 rounded-full object-cover shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="block font-semibold">{item.label}</span>
                    {supportingText && (
                      <span className="block text-xs text-slate-400 font-medium truncate">{supportingText}</span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <svg className="w-4 h-4 text-indigo-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {hint && <p className="text-xs text-slate-400 font-medium mt-1">{hint}</p>}
    </div>
  );
}

function Item({ id, supportingText, isDisabled, icon, avatarUrl, children }) {
  return (
    <div data-id={id} data-supporting-text={supportingText} data-avatar-url={avatarUrl}>
      {children}
    </div>
  );
}

Select.Item = Item;
