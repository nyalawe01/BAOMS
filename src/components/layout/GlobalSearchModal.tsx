import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  FileText,
  Briefcase,
  Wallet,
  Users,
  Palette,
  LayoutDashboard,
  ArrowRight,
  UserCog,
  Mail,
  BarChart3,
  Layers,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { useAuth } from '@/features/auth/useAuth';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission, isAdmin, hasRole } = useAuth();
  const [query, setQuery] = useState('');

  const searchableItems = [
    {
      id: 'dashboard',
      title: t('nav.dashboard', 'Dashboard'),
      category: 'Overview',
      path: '/',
      icon: LayoutDashboard,
      show: true,
    },
    {
      id: 'users',
      title: t('nav.userManagement', 'User Management'),
      category: 'Administration',
      path: '/users',
      icon: UserCog,
      show: hasPermission('roles.manage') || isAdmin(),
    },
    {
      id: 'documents',
      title: t('nav.documents', 'Documents & Records'),
      category: 'Operations',
      path: '/documents',
      icon: FileText,
      show: hasPermission('documents.view') || isAdmin(),
    },
    {
      id: 'projects',
      title: t('nav.projects', 'Projects & Programs'),
      category: 'Operations',
      path: '/projects',
      icon: Briefcase,
      show: hasPermission('projects.view') || isAdmin(),
    },
    {
      id: 'finance',
      title: t('nav.finance', 'Finance & Budgets'),
      category: 'Finance',
      path: '/finance',
      icon: Wallet,
      show: hasPermission('finance.view') || isAdmin(),
    },
    {
      id: 'hr',
      title: t('nav.hr', 'HR & Personnel'),
      category: 'Human Resources',
      path: '/hr',
      icon: Users,
      show: hasPermission('hr.view') || isAdmin(),
    },
    {
      id: 'correspondence',
      title: t('nav.correspondence', 'Correspondence & Meetings'),
      category: 'Communication',
      path: '/correspondence',
      icon: Mail,
      show: hasPermission('correspondence.view') || isAdmin(),
    },
    {
      id: 'reports',
      title: t('nav.reports', 'Reports & Analytics'),
      category: 'Analytics',
      path: '/reports',
      icon: BarChart3,
      show: hasPermission('reports.view') || isAdmin(),
    },
    {
      id: 'design-system',
      title: 'Design System & Component Showcase',
      category: 'System Preview',
      path: '/design-system',
      icon: Palette,
      show: isAdmin() || hasRole(['system_admin']),
    },
    {
      id: 'foundation',
      title: 'Phase 1 Architectural Baseline',
      category: 'Architecture',
      path: '/foundation',
      icon: Layers,
      show: isAdmin() || hasRole(['system_admin']),
    },
  ].filter((item) => item.show);

  const filtered = query.trim()
    ? searchableItems.filter(
        (i) =>
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          i.category.toLowerCase().includes(query.toLowerCase())
      )
    : searchableItems;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2 text-charcoal">
          <Search className="h-4 w-4 text-[#D68904]" />
          <span>{t('search.title', 'Quick Navigation & Global Search')}</span>
        </div>
      }
    >
      <div className="space-y-4">
        <SearchInput
          autoFocus
          placeholder={t('search.placeholder', 'Search pages, modules, or actions...')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          showShortcut={false}
        />

        <div className="max-h-64 overflow-y-auto divide-y divide-surface-border">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.path)}
                  className="flex w-full items-center justify-between p-2.5 rounded-md hover:bg-surface-hover transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-surface-muted text-charcoal-muted group-hover:text-[#D68904]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-charcoal block">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-charcoal-light">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-charcoal-light group-hover:text-[#D68904] transition-colors" />
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-charcoal-muted">
              No matching pages found for "{query}".
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
