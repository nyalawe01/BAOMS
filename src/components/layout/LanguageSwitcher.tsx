import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('sw') ? 'sw' : 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'sw' : 'en';
    i18n.changeLanguage(nextLang);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('baoms_language', nextLang);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-[#374151] hover:bg-slate-50 transition-colors',
        className
      )}
      title={currentLang === 'en' ? 'Badili lugha kuwa Kiswahili' : 'Switch language to English'}
      aria-label="Toggle language"
    >
      <Languages className="h-3.5 w-3.5 text-[#374151]" />
      <span className="uppercase text-[11px] font-mono tracking-wider">
        {currentLang === 'en' ? 'EN' : 'SW'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
