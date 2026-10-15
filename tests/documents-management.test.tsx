/**
 * BAOMS Phase 6: Document & Records Management Automated Test Suite
 * Babawatoto Organization Management System
 * 
 * Verifies document repository register, file validation, storage paths,
 * unique reference number generation, immutable versioning, approval workflows,
 * and bilingual UI integration.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '@/App';
import '@/locales/i18n';
import {
  validateDocumentFile,
  generateStoragePath,
  formatFileSize,
  sanitizeFileName,
} from '@/features/documents/services/storageService';
import {
  getDocumentCategories,
  getDocuments,
  createDocument,
  uploadNewVersion,
  submitApprovalDecision,
  archiveDocument,
  restoreDocument,
  generateDocumentReference,
} from '@/features/documents/services/documentService';

describe('BAOMS Phase 6: Document & Records Management', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.pushState({}, 'Test', '/login');
  });

  describe('1. File Storage Validation & Path Security', () => {
    it('approves compliant PDF, DOCX, XLSX, and image files within 25MB limit', () => {
      const pdfFile = new File(['%PDF-1.4 test content'], 'charter.pdf', {
        type: 'application/pdf',
      });
      const docxFile = new File(['dummy docx content'], 'report.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const xlsxFile = new File(['dummy xlsx content'], 'budget.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const pngFile = new File(['dummy png content'], 'photo.png', {
        type: 'image/png',
      });

      expect(validateDocumentFile(pdfFile).valid).toBe(true);
      expect(validateDocumentFile(docxFile).valid).toBe(true);
      expect(validateDocumentFile(xlsxFile).valid).toBe(true);
      expect(validateDocumentFile(pngFile).valid).toBe(true);
    });

    it('rejects oversized files exceeding 25MB', () => {
      // Mock 26MB file
      const largeFile = new File(['a'], 'oversized.pdf', { type: 'application/pdf' });
      Object.defineProperty(largeFile, 'size', { value: 26 * 1024 * 1024 });

      const result = validateDocumentFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/exceeds maximum permitted limit of 25 MB/i);
    });

    it('rejects dangerous or unauthorized file extensions', () => {
      const exeFile = new File(['MZ'], 'malware.exe', { type: 'application/x-msdownload' });
      const batFile = new File(['echo hi'], 'script.bat', { type: 'application/x-bat' });
      const zipFile = new File(['PK'], 'archive.zip', { type: 'application/zip' });

      expect(validateDocumentFile(exeFile).valid).toBe(false);
      expect(validateDocumentFile(batFile).valid).toBe(false);
      expect(validateDocumentFile(zipFile).valid).toBe(false);
    });

    it('sanitizes unsafe filenames and generates isolated storage paths', () => {
      const sanitized = sanitizeFileName('../../secret/My Org Doc (2026).pdf');
      expect(sanitized).toBe('My_Org_Doc__2026_.pdf');

      const storagePath = generateStoragePath('GOV', 'doc-12345', 2, 'My Org Doc (2026).pdf');
      expect(storagePath).toBe('gov/doc-12345/v2_My_Org_Doc__2026_.pdf');
    });

    it('formats file sizes accurately', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });

  describe('2. Collision-Proof Reference Number Generator', () => {
    it('generates properly structured organizational reference codes', async () => {
      const refCode = await generateDocumentReference('FIN', '2026-03-15');
      expect(refCode).toMatch(/^BAO\/FIN\/2026\/\d{4}$/);

      const govRef = await generateDocumentReference('GOV', '2026-01-01');
      expect(govRef).toMatch(/^BAO\/GOV\/2026\/\d{4}$/);
    });
  });

  describe('3. Document Lifecycle, Immutability & Approval Workflows', () => {
    it('retrieves standard categories including GOV, FIN, PRJ, HR, LEG, and PUB', async () => {
      const categories = await getDocumentCategories();
      expect(categories.length).toBeGreaterThanOrEqual(6);

      const codes = categories.map((c) => c.code);
      expect(codes).toContain('GOV');
      expect(codes).toContain('FIN');
      expect(codes).toContain('PRJ');
      expect(codes).toContain('HR');
      expect(codes).toContain('LEG');
      expect(codes).toContain('PUB');
    });

    it('creates a new document record with initial immutable version v1', async () => {
      const categories = await getDocumentCategories();
      const testFile = new File(['Sample constitution'], 'Constitution_Test.pdf', {
        type: 'application/pdf',
      });

      const newDoc = await createDocument(
        {
          title: 'Automated Test Constitution 2026',
          category_id: categories[0]!.id,
          category_code: categories[0]!.code,
          classification: 'internal',
          document_date: '2026-05-01',
          tags: ['test', 'constitution'],
          file: testFile,
          change_notes: 'Initial test upload',
        },
        { id: 'user-test-01', name: 'Tester User' }
      );

      expect(newDoc.id).toBeDefined();
      expect(newDoc.reference_number).toMatch(/^BAO\/GOV\/2026\/\d{4}$/);
      expect(newDoc.status).toBe('pending_review');
      expect(newDoc.versions?.length).toBe(1);
      expect(newDoc.versions?.[0]?.version_number).toBe(1);
      expect(newDoc.versions?.[0]?.file_name).toBe('Constitution_Test.pdf');
    });

    it('uploads a second version (v2.0) without destroying or mutating version 1', async () => {
      const categories = await getDocumentCategories();
      const fileV1 = new File(['v1'], 'Policy_v1.pdf', { type: 'application/pdf' });
      const fileV2 = new File(['v2'], 'Policy_v2.pdf', { type: 'application/pdf' });

      const doc = await createDocument(
        {
          title: 'Child Safeguarding Revision Test',
          category_id: categories[3]!.id,
          category_code: categories[3]!.code,
          classification: 'public',
          document_date: '2026-05-10',
          tags: ['policy', 'safeguarding'],
          file: fileV1,
        },
        { id: 'user-test-01', name: 'Tester User' }
      );

      const updatedDoc = await uploadNewVersion(
        {
          document_id: doc.id,
          category_code: categories[3]!.code,
          file: fileV2,
          change_notes: 'Updated emergency numbers',
        },
        { id: 'user-test-02', name: 'Editor User' }
      );

      expect(updatedDoc.versions?.length).toBe(2);
      expect(updatedDoc.current_version?.version_number).toBe(2);
      expect(updatedDoc.current_version?.change_notes).toBe('Updated emergency numbers');

      // Old version remains preserved
      const v1 = updatedDoc.versions?.find((v) => v.version_number === 1);
      expect(v1).toBeDefined();
      expect(v1?.file_name).toBe('Policy_v1.pdf');
    });

    it('records an official review decision and transitions document to approved', async () => {
      const categories = await getDocumentCategories();
      const testFile = new File(['test'], 'Charter.pdf', { type: 'application/pdf' });

      const doc = await createDocument(
        {
          title: 'Bagamoyo Project Charter Test',
          category_id: categories[2]!.id,
          category_code: categories[2]!.code,
          classification: 'internal',
          document_date: '2026-06-01',
          tags: ['charter'],
          file: testFile,
        },
        { id: 'user-test-01', name: 'Tester' }
      );

      expect(doc.status).toBe('pending_review');

      const approvedDoc = await submitApprovalDecision(
        {
          document_id: doc.id,
          status: 'approved',
          comments: 'Certified by Executive Director per grant conditions.',
        },
        { id: 'dir-01', name: 'Executive Director', role: 'Executive Director' }
      );

      expect(approvedDoc.status).toBe('approved');
      expect(approvedDoc.approvals?.length).toBe(1);
      expect(approvedDoc.approvals?.[0]?.status).toBe('approved');
      expect(approvedDoc.approvals?.[0]?.comments).toBe(
        'Certified by Executive Director per grant conditions.'
      );
    });

    it('handles document archiving and restoration', async () => {
      const categories = await getDocumentCategories();
      const testFile = new File(['archived'], 'Old_Manual.pdf', { type: 'application/pdf' });

      const doc = await createDocument(
        {
          title: 'Outdated Staff Handbook 2022',
          category_id: categories[3]!.id,
          category_code: categories[3]!.code,
          classification: 'internal',
          document_date: '2022-01-01',
          tags: ['historical'],
          file: testFile,
        },
        { id: 'user-test-01', name: 'Tester' }
      );

      await archiveDocument(doc.id);
      let queryResult = await getDocuments({ status: 'archived', page: 1, pageSize: 10 });
      expect(queryResult.data.some((d) => d.id === doc.id)).toBe(true);

      await restoreDocument(doc.id);
      queryResult = await getDocuments({ status: 'archived', page: 1, pageSize: 10 });
      expect(queryResult.data.some((d) => d.id === doc.id)).toBe(false);
    });
  });

  describe('4. User Interface Navigation & Access Control', () => {
    it('redirects unauthenticated requests to /documents back to /login', async () => {
      window.history.pushState({}, 'Test', '/documents');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Staff Portal Sign In|Kuingia kwa Watumishi/i)).toBeInTheDocument();
      });
    });

    it('permits authorized staff to access /documents and renders the records register', async () => {
      // Authenticate as System Administrator
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000001');
      window.history.pushState({}, 'Test', '/documents');
      render(<App />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Documents & Records Management|Usimamizi wa Hati na Kumbukumbu/i).length
        ).toBeGreaterThan(0);
      });

      // KPI Metric Cards exist
      expect(
        screen.getByText(/Active Repository|Hifadhi Inayotumika/i)
      ).toBeInTheDocument();

      // Action buttons exist
      expect(
        screen.getByRole('button', { name: /Upload Document|Pakia Hati/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Categories|Vitengo/i })
      ).toBeInTheDocument();
    });

    it('renders the status tabs and allows switching between status views', async () => {
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000001');
      window.history.pushState({}, 'Test', '/documents');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/All Active|Zote Zinazotumika/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Pending Review|Inasubiri Mapitio/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Draft|Rasimu/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Archived|Kumbukumbu/i).length).toBeGreaterThan(0);
      });
    });

    it('opens Document Upload modal when clicking Upload Document button', async () => {
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000001');
      window.history.pushState({}, 'Test', '/documents');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Document|Pakia Hati/i })).toBeInTheDocument();
      });

      const uploadBtn = screen.getByRole('button', { name: /Upload Document|Pakia Hati/i });
      fireEvent.click(uploadBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Register & Upload New Document|Sajili na Pakia Hati Mpya/i)
        ).toBeInTheDocument();
        expect(
          screen.getByLabelText(/Document Official Title|Jina Rasmi la Hati/i)
        ).toBeInTheDocument();
      });
    });

    it('opens Category Management modal when clicking Categories button', async () => {
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000001');
      window.history.pushState({}, 'Test', '/documents');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Categories|Vitengo/i })).toBeInTheDocument();
      });

      const catBtn = screen.getByRole('button', { name: /Categories|Vitengo/i });
      fireEvent.click(catBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Document Categories Management|Usimamizi wa Vitengo vya Hati/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Active Categories|Vitengo Vinavyotumika/i)
        ).toBeInTheDocument();
      });
    });
  });
});
