import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Search,
  X,
  SearchX,
  FolderKanban,
  Users,
  HeartHandshake,
  Receipt,
  CalendarDays
} from 'lucide-react';

// Cap per category so the results panel never becomes an unwieldy wall of
// matches - a "N more results" line surfaces the overflow count instead.
const MAX_RESULTS_PER_CATEGORY = 5;
const MIN_QUERY_LENGTH = 2;

// Category definitions: how to build the searchable haystack per record,
// how to render the primary/secondary line, and which tab onNavigate
// should jump to when a result is clicked.
const CATEGORIES = [
  {
    key: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    target: 'admin_projects',
    fields: (p) => [p.name, p.description],
    title: (p) => p.name || 'Untitled Project',
    subtitle: (p) => p.description || ''
  },
  {
    key: 'users',
    label: 'People',
    icon: Users,
    target: 'admin_hr',
    fields: (u) => [u.name, u.email, u.role],
    title: (u) => u.name || u.email || 'Unnamed User',
    subtitle: (u) => [u.role, u.email].filter(Boolean).join(' • ')
  },
  {
    key: 'beneficiaries',
    label: 'Beneficiaries',
    icon: HeartHandshake,
    target: 'me_beneficiaries',
    fields: (b) => [b.name, b.location, b.category],
    title: (b) => b.name || 'Unnamed Beneficiary',
    subtitle: (b) => [b.location, b.category].filter(Boolean).join(' • ')
  },
  {
    key: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    target: 'fin_expenses',
    fields: (e) => [e.description, e.projectName, e.submittedByName],
    title: (e) => e.description || 'Untitled Expense',
    subtitle: (e) => [e.projectName, e.submittedByName].filter(Boolean).join(' • ')
  },
  {
    key: 'events',
    label: 'Events',
    icon: CalendarDays,
    target: 'admin_events',
    fields: (ev) => [ev.title, ev.location],
    title: (ev) => ev.title || 'Untitled Event',
    subtitle: (ev) => ev.location || ''
  }
];

export default function GlobalSearch({ onNavigate }) {
  const { projects, users, beneficiaries, expenses, events } = useProject();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const dataByCategory = {
    projects,
    users,
    beneficiaries,
    expenses,
    events
  };

  const trimmedQuery = query.trim();
  const showPanel = isFocused && trimmedQuery.length >= MIN_QUERY_LENGTH;

  const groupedResults = useMemo(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) return [];
    const needle = trimmedQuery.toLowerCase();

    return CATEGORIES.map((category) => {
      const records = dataByCategory[category.key] || [];
      const matches = records.filter((record) =>
        category.fields(record).some((field) =>
          typeof field === 'string' && field.toLowerCase().includes(needle)
        )
      );
      return {
        category,
        total: matches.length,
        results: matches.slice(0, MAX_RESULTS_PER_CATEGORY)
      };
    }).filter((group) => group.total > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedQuery, projects, users, beneficiaries, expenses, events]);

  const hasAnyResults = groupedResults.length > 0;

  // Outside-click-to-close, matching the overlay backdrop technique used by
  // TopUtilityHeader's profile dropdown and NotificationCenter.
  const closePanel = () => {
    setIsFocused(false);
  };

  // Escape closes the panel and returns focus handling to a clean state.
  useEffect(() => {
    if (!isFocused) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closePanel();
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  const handleSelect = (category) => {
    setQuery('');
    setIsFocused(false);
    onNavigate?.(category.target);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-48 sm:w-56 lg:w-72 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-colors">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search..."
          className="bg-transparent outline-none text-xs text-slate-700 placeholder:text-slate-400 w-full min-w-0"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            title="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {showPanel && (
        <>
          {/* Overlay Backdrop to close */}
          <div
            className="fixed inset-0 z-20 cursor-default"
            onClick={closePanel}
          ></div>

          <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-30 animate-fadeIn overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {!hasAnyResults ? (
                <div className="px-4 py-10 flex flex-col items-center justify-center text-center gap-2">
                  <SearchX size={22} className="text-slate-300" />
                  <p className="text-xs text-slate-400 font-medium">No results for "{trimmedQuery}"</p>
                </div>
              ) : (
                groupedResults.map(({ category, results, total }) => {
                  const CategoryIcon = category.icon;
                  const remaining = total - results.length;
                  return (
                    <div key={category.key} className="border-b border-slate-50 last:border-b-0">
                      <div className="px-4 pt-2.5 pb-1 flex items-center gap-1.5">
                        <CategoryIcon size={11} className="text-slate-400" />
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {category.label}
                        </p>
                      </div>
                      {results.map((record) => (
                        <button
                          key={record.id}
                          type="button"
                          onClick={() => handleSelect(category)}
                          className="w-full flex flex-col items-start gap-0.5 px-4 py-2 text-left hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-xs font-semibold text-slate-800 leading-snug truncate w-full">
                            {category.title(record)}
                          </span>
                          {category.subtitle(record) && (
                            <span className="text-[11px] text-slate-500 truncate w-full">
                              {category.subtitle(record)}
                            </span>
                          )}
                        </button>
                      ))}
                      {remaining > 0 && (
                        <p className="px-4 pb-2 text-[10px] text-slate-400 font-medium">
                          {remaining} more result{remaining === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
