import React, { createContext, useContext } from 'react';

const ButtonGroupContext = createContext(null);

export function ButtonGroup({ selectedKeys = new Set(), onSelectionChange = null, children }) {
  const isSelected = (id) => {
    if (selectedKeys instanceof Set) {
      return selectedKeys.has(id);
    }
    if (Array.isArray(selectedKeys)) {
      return selectedKeys.includes(id);
    }
    return selectedKeys === id;
  };

  const handleSelect = (id) => {
    if (!onSelectionChange) return;

    if (selectedKeys instanceof Set) {
      const next = new Set(selectedKeys);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onSelectionChange(next);
    } else if (Array.isArray(selectedKeys)) {
      const next = selectedKeys.includes(id)
        ? selectedKeys.filter(k => k !== id)
        : [...selectedKeys, id];
      onSelectionChange(next);
    } else {
      onSelectionChange(id);
    }
  };

  return (
    <ButtonGroupContext.Provider value={{ isSelected, handleSelect }}>
      <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm divide-x divide-slate-200">
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
}

export function ButtonGroupItem({ id, iconLeading: IconLeading, children }) {
  const context = useContext(ButtonGroupContext);
  const active = context ? context.isSelected(id) : false;

  const handleClick = () => {
    if (context) {
      context.handleSelect(id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none ${
        active 
          ? 'bg-slate-100 text-slate-900 font-bold' 
          : 'bg-white text-slate-650 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {IconLeading && <IconLeading size={14} className={active ? 'text-slate-900' : 'text-slate-400'} />}
      <span>{children}</span>
    </button>
  );
}
