/**
 * Category Management Modal (Administrator Only)
 * Babawatoto Organization Management System (BAOMS)
 * 
 * Allows System Administrators to configure organizational document categories
 * with bilingual labels and classification codes.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderTree, Plus, AlertCircle, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DocumentCategory } from '../types/document';
import { saveDocumentCategory } from '../services/documentService';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DocumentCategory[];
  onCategoriesUpdated: () => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesUpdated,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('sw') ? 'sw' : 'en';

  const [isAdding, setIsAdding] = useState(false);
  const [code, setCode] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameSw, setNameSw] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descSw, setDescSw] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setIsAdding(false);
    setCode('');
    setNameEn('');
    setNameSw('');
    setDescEn('');
    setDescSw('');
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nameEn.trim() || !nameSw.trim()) {
      setError(t('documents.categoryRequiredFields', 'Category code, English name, and Kiswahili name are required.'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await saveDocumentCategory({
        code: code.trim().toUpperCase(),
        name_en: nameEn.trim(),
        name_sw: nameSw.trim(),
        description_en: descEn.trim() || null,
        description_sw: descSw.trim() || null,
        icon: 'Folder',
        is_active: true,
      });

      onCategoriesUpdated();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-forest-700" />
          <span>{t('documents.manageCategories', 'Document Categories Management')}</span>
        </div>
      }
      description={t(
        'documents.manageCategoriesDesc',
        'Authorized document categories used for reference number generation and storage hierarchy.'
      )}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              {t('documents.activeCategories', 'Active Categories')} ({categories.length})
            </span>
            {!isAdding && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                className="text-xs h-7"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t('documents.addCategory', 'Add Category')}
              </Button>
            )}
          </div>

          <div className="border border-surface-border rounded-lg divide-y divide-surface-border max-h-60 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono font-bold text-forest-700 shrink-0">
                    {cat.code}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-charcoal truncate">
                      {currentLang === 'sw' ? cat.name_sw : cat.name_en}
                    </p>
                    <p className="text-[11px] text-charcoal-muted truncate">
                      {currentLang === 'sw' ? cat.name_en : cat.name_sw}
                    </p>
                  </div>
                </div>
                <span className="text-emerald-700 text-[11px] font-semibold shrink-0">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Add Category Subform */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-3.5 border border-forest-200 bg-forest-50/30 rounded-lg space-y-3">
            <h4 className="text-xs font-semibold text-forest-900 uppercase tracking-wider">
              {t('documents.createNewCategory', 'Create New Category')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Code (3-4 Letters) *"
                placeholder="e.g. MNE"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
              <Input
                label="English Name *"
                placeholder="Monitoring & Evaluation"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                required
              />
              <Input
                label="Kiswahili Name *"
                placeholder="Ufuatiliaji na Tathmini"
                value={nameSw}
                onChange={(e) => setNameSw(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Description (English)"
                placeholder="Evaluation reports and indicator matrices..."
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
              />
              <Input
                label="Maelezo (Kiswahili)"
                placeholder="Ripoti za tathmini na viashiria..."
                value={descSw}
                onChange={(e) => setDescSw(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(false)}
                disabled={isSubmitting}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                className="bg-forest-700 hover:bg-forest-800 text-white"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {isSubmitting ? t('common.loading', 'Saving...') : t('common.save', 'Save Category')}
              </Button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-surface-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel', 'Close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
