/**
 * DocumentUploadSection — Reusable supporting document upload panel
 * BAOMS | Babawatoto Organization Management System
 *
 * Features:
 * - Drag-and-drop or click-to-browse file selection
 * - Per-document custom name editing
 * - Type tagging (contract, quote, ID copy, etc.)
 * - Preview of selected file metadata
 * - Optional description / notes per file
 */

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Pencil,
  Check,
  X,
  FileBadge,
  FileImage,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './Input';

// ─── Types ──────────────────────────────────────────────────────────────────

export type DocumentTag =
  | 'quote'
  | 'contract'
  | 'invoice'
  | 'id_copy'
  | 'certificate'
  | 'report'
  | 'photo'
  | 'letter'
  | 'other';

export interface UploadedDocument {
  id: string;
  file: File;
  customName: string;      // user-editable display name
  tag: DocumentTag;        // classification
  notes: string;           // optional description
}

export interface DocumentUploadSectionProps {
  documents: UploadedDocument[];
  onChange: (docs: UploadedDocument[]) => void;
  accept?: string;
  maxFileSizeMB?: number;
  title?: string;
  hint?: string;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TAG_LABELS: Record<DocumentTag, string> = {
  quote: 'Quotation / RFQ',
  contract: 'Contract / Agreement',
  invoice: 'Invoice / Receipt',
  id_copy: 'ID / TIN / VRN Copy',
  certificate: 'Certificate / License',
  report: 'Report / Statement',
  photo: 'Photo / Evidence',
  letter: 'Letter / Correspondence',
  other: 'Other Document',
};

function getFileIcon(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'].includes(ext)) {
    return <FileImage className="w-5 h-5 text-purple-500" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  }
  if (ext === 'pdf') {
    return <FileBadge className="w-5 h-5 text-rose-500" />;
  }
  return <FileText className="w-5 h-5 text-slate-400" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function newDoc(file: File): UploadedDocument {
  // Derive a clean display name from filename (no extension)
  const parts = file.name.split('.');
  if (parts.length > 1) parts.pop();
  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    file,
    customName: parts.join('.'),
    tag: 'other',
    notes: '',
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  documents,
  onChange,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,.zip',
  maxFileSizeMB = 25,
  title = 'Supporting Documents',
  hint = 'Upload quotations, contracts, ID copies, receipts, or any other relevant files. All uploads are optional.',
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const maxBytes = maxFileSizeMB * 1024 * 1024;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newDocs: UploadedDocument[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > maxBytes) return; // skip oversized
      newDocs.push(newDoc(file));
    });
    onChange([...documents, ...newDocs]);
  };

  const update = (id: string, patch: Partial<UploadedDocument>) => {
    onChange(documents.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const remove = (id: string) => {
    onChange(documents.filter((d) => d.id !== id));
  };

  const startRename = (doc: UploadedDocument) => {
    setEditingId(doc.id);
    setEditDraft(doc.customName);
  };

  const confirmRename = (id: string) => {
    if (editDraft.trim()) update(id, { customName: editDraft.trim() });
    setEditingId(null);
    setEditDraft('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditDraft('');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-[#D68904]" />
          {title}
          <span className="text-[11px] font-normal bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 ml-1">
            Optional
          </span>
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">{hint}</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-[#D68904] bg-amber-50'
            : 'border-slate-200 hover:border-[#D68904]/50 hover:bg-amber-50/30 bg-slate-50'
        )}
      >
        <UploadCloud
          className={cn(
            'mx-auto w-8 h-8 mb-2 transition-colors',
            isDragging ? 'text-[#D68904]' : 'text-slate-300'
          )}
        />
        <p className="text-xs font-semibold text-slate-600">
          {isDragging ? 'Drop files here…' : 'Drag & drop files or click to browse'}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          {accept.split(',').join(', ')} · max {maxFileSizeMB} MB per file
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Uploaded file list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {documents.length} File{documents.length !== 1 ? 's' : ''} Attached
          </p>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 transition-all hover:border-slate-300"
            >
              {/* Top row: icon + name + rename + remove */}
              <div className="flex items-center gap-2">
                <div className="shrink-0">{getFileIcon(doc.file)}</div>

                {editingId === doc.id ? (
                  <div className="flex-1 flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmRename(doc.id);
                        if (e.key === 'Escape') cancelRename();
                      }}
                      className="flex-1 text-xs font-semibold border border-[#D68904]/60 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                    />
                    <button
                      type="button"
                      onClick={() => confirmRename(doc.id)}
                      className="text-[#D68904] hover:text-[#b86e03] p-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {doc.customName}
                      </span>
                      <button
                        type="button"
                        onClick={() => startRename(doc)}
                        title="Rename document"
                        className="text-slate-300 hover:text-[#D68904] transition-colors shrink-0"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {doc.file.name} · {formatSize(doc.file.size)}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => remove(doc.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors shrink-0 p-1"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Classification + notes row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Document Type
                  </label>
                  <select
                    value={doc.tag}
                    onChange={(e) => update(doc.id, { tag: e.target.value as DocumentTag })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D68904] bg-white text-slate-700"
                  >
                    {Object.entries(TAG_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Notes / Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={doc.notes}
                    onChange={(e) => update(doc.id, { notes: e.target.value })}
                    placeholder="e.g. Signed copy, Ref: INV-2026-044"
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Serializer for backend submission ───────────────────────────────────────

export function serializeDocuments(docs: UploadedDocument[]) {
  return docs.map((d) => ({
    customName: d.customName,
    originalName: d.file.name,
    tag: d.tag,
    notes: d.notes || null,
    fileSize: d.file.size,
    fileType: d.file.type || 'application/octet-stream',
    file: d.file,                // raw File for actual upload
  }));
}
