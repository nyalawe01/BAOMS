import React, { useState, useRef, useEffect } from 'react';

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

  const handleSelect = (id) => {
    setSelectedId(id);
    onChange(id);
    setIsOpen(false);
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

  const selectedItem = items.find(item => item.id === selectedId);

  return (
    <div className="relative space-y-1 w-full text-left font-sans" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
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
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 hover:border-slate-350 focus:outline-none focus:border-indigo-500 shadow-sm transition-all"
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
        <div className="absolute left-0 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1 animate-fadeIn">
          {items.map(item => {
            const isSelected = item.id === selectedId;
            const element = children ? children(item) : null;

            // Extract item customization properties
            const avatarUrl = element?.props?.avatarUrl || item.avatarUrl;
            const supportingText = element?.props?.supportingText || item.supportingText;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left text-xs ${
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
                      <span className="block text-[10px] text-slate-400 font-medium truncate">{supportingText}</span>
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

      {hint && <p className="text-[10px] text-slate-400 font-medium mt-1">{hint}</p>}
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
