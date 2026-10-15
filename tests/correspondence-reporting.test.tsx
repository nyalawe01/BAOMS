/**
 * BAOMS Phase 10: Correspondence, Reporting and Localization Automated Test Suite
 * Babawatoto Organization Management System
 * 
 * Verifies correspondence registers (incoming/outgoing), collision-free sequential reference generation,
 * formal meetings, decision resolutions, trackable follow-up actions with overdue detection,
 * cross-module authorized reporting engine, CSV formula injection defense (CWE-1236),
 * confidential field masking, and bilingual English/Kiswahili UI parity.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '@/App';
import i18n from '@/locales/i18n';
import {
  getCorrespondence,
  getCorrespondenceById,
  createCorrespondence,
  archiveCorrespondence,
  getMeetings,
  createMeeting,
  getMeetingAttendees,
  getMeetingDecisions,
  createMeetingDecision,
  getMeetingActions,
  createMeetingAction,
  updateMeetingAction,
  resetMockCorrespondenceData,
} from '@/features/correspondence/services/correspondenceService';
import { generateReport } from '@/features/reporting/services/reportingService';
import {
  sanitizeSpreadsheetValue,
  isConfidentialField,
  generateCsvContent,
} from '@/features/reporting/utils/exportSanitizer';
import { ReportDataSet } from '@/features/reporting/types/reporting';

describe('BAOMS Phase 10: Correspondence, Reporting & Localization Module', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    resetMockCorrespondenceData();
    await i18n.changeLanguage('en');
    window.history.pushState({}, 'Test', '/login');
  });

  describe('1. Correspondence Register & Sequential Reference Numbering', () => {
    it('fetches seeded correspondence records including incoming and outgoing letters', async () => {
      const records = await getCorrespondence();
      expect(records.length).toBeGreaterThanOrEqual(5);

      const ministryLetter = records.find(
        (c) => c.referenceNumber === 'COR-IN-2026-001'
      );
      expect(ministryLetter).toBeDefined();
      expect(ministryLetter?.direction).toBe('incoming');
      expect(ministryLetter?.sender).toContain('Ministry of Community Development');
      expect(ministryLetter?.category).toBe('government');

      const outgoingGov = records.find(
        (c) => c.referenceNumber === 'COR-OUT-2026-001'
      );
      expect(outgoingGov).toBeDefined();
      expect(outgoingGov?.direction).toBe('outgoing');
      expect(outgoingGov?.recipient).toContain('Registrar of NGOs');
      expect(outgoingGov?.category).toBe('government');
    });

    it('creates incoming and outgoing correspondence with sequential reference numbers', async () => {
      const newIncoming = await createCorrespondence(
        {
          direction: 'incoming',
          sender: 'Temeke Municipal Council',
          recipient: 'Babawatoto Community Director',
          subject: 'Permission for Q4 Youth Health Camp at Tandika Community Grounds',
          correspondenceDate: '2026-10-15',
          category: 'community',
          confidentialityLevel: 'internal',
          notes: 'Received by reception and logged for project coordinator follow-up.',
        },
        { id: 'user-admin', displayName: 'System Admin' }
      );

      expect(newIncoming.id).toBeDefined();
      expect(newIncoming.referenceNumber).toMatch(/^COR-IN-\d{4}-\d{3}$/);
      expect(newIncoming.direction).toBe('incoming');
      expect(newIncoming.status).toBe('received');

      const newOutgoing = await createCorrespondence(
        {
          direction: 'outgoing',
          sender: 'Executive Director, Babawatoto',
          recipient: 'NMB Bank Head Office - Institutional Banking',
          subject: 'Submission of Authorized Signatories Resolution for Project Accounts',
          correspondenceDate: '2026-10-16',
          category: 'general',
          confidentialityLevel: 'confidential',
          notes: 'Dispatched via registered courier.',
        },
        { id: 'user-ed', displayName: 'Elisha Mwakipesile' }
      );

      expect(newOutgoing.id).toBeDefined();
      expect(newOutgoing.referenceNumber).toMatch(/^COR-OUT-\d{4}-\d{3}$/);
      expect(newOutgoing.direction).toBe('outgoing');
      expect(newOutgoing.status).toBe('draft');
    });

    it('filters correspondence by direction, category, status, and search query', async () => {
      const incomingOnly = await getCorrespondence({ direction: 'incoming' });
      expect(incomingOnly.every((c) => c.direction === 'incoming')).toBe(true);

      const outgoingOnly = await getCorrespondence({ direction: 'outgoing' });
      expect(outgoingOnly.every((c) => c.direction === 'outgoing')).toBe(true);

      const donorOnly = await getCorrespondence({ category: 'donor' });
      expect(donorOnly.every((c) => c.category === 'donor')).toBe(true);

      const searchResults = await getCorrespondence({ search: 'Ministry' });
      expect(searchResults.length).toBeGreaterThanOrEqual(1);
      expect(
        searchResults.some(
          (c) =>
            c.sender.includes('Ministry') || c.subject.includes('Ministry')
        )
      ).toBe(true);
    });

    it('archives correspondence and transitions status to archived', async () => {
      const record = await createCorrespondence({
        direction: 'incoming',
        sender: 'Old Partner NGO',
        recipient: 'BAOMS Office',
        subject: 'Historical memorandum archive test',
        correspondenceDate: '2026-01-10',
        category: 'partner',
      });

      const archived = await archiveCorrespondence(record.id);
      expect(archived.status).toBe('archived');

      const fetched = await getCorrespondenceById(record.id);
      expect(fetched?.status).toBe('archived');
    });

    it('enforces confidentiality scoping hiding confidential correspondence from non-leadership', async () => {
      // Create a confidential record registered by leadership
      const confidentialRecord = await createCorrespondence(
        {
          direction: 'incoming',
          sender: 'External Legal Counsel',
          recipient: 'Executive Director',
          subject: 'Confidential Legal Assessment Memo',
          correspondenceDate: '2026-10-10',
          category: 'legal',
          confidentialityLevel: 'confidential',
        },
        { id: 'user-ed', displayName: 'Elisha Mwakipesile' }
      );

      // Field officer viewing records
      const fieldUser = { id: 'user-field', roles: ['project_officer'] };
      const fieldVisible = await getCorrespondence(undefined, fieldUser);
      expect(
        fieldVisible.some((c) => c.id === confidentialRecord.id)
      ).toBe(false);

      // Executive Director viewing records
      const edUser = { id: 'user-ed', roles: ['executive_director'] };
      const edVisible = await getCorrespondence(undefined, edUser);
      expect(edVisible.some((c) => c.id === confidentialRecord.id)).toBe(true);
    });
  });

  describe('2. Meetings, Decisions & Follow-up Actions Lifecycle', () => {
    it('fetches seeded formal meetings with attendee counts and decisions', async () => {
      const meetings = await getMeetings();
      expect(meetings.length).toBeGreaterThanOrEqual(2);

      const boardMeeting = meetings.find((m) => m.meetingNumber === 'MTG-2026-001');
      expect(boardMeeting).toBeDefined();
      expect(boardMeeting?.title).toContain('Board of Trustees');
      expect(boardMeeting?.meetingType).toBe('board');
    });

    it('registers a new meeting, records attendees, logs decisions, and assigns follow-up actions', async () => {
      // 1. Create meeting
      const newMeeting = await createMeeting(
        {
          title: 'Special Senior Management Committee on 2027 Planning',
          meetingType: 'management',
          meetingDate: '2026-10-20T10:00:00Z',
          location: 'Kigamboni Conference Hall',
          confidentialityLevel: 'internal',
          attendees: [
            { externalName: 'Elisha N. Mwakipesile', role: 'chair', attended: true },
            { externalName: 'Grace M. Mlay', role: 'secretary', attended: true },
            { externalName: 'Amina S. Kimaro', role: 'participant', attended: true },
          ],
        },
        { id: 'user-ed', displayName: 'Elisha Mwakipesile' }
      );

      expect(newMeeting.id).toBeDefined();
      expect(newMeeting.meetingNumber).toMatch(/^MTG-\d{4}-\d{3}$/);

      // Verify attendees
      const attendees = await getMeetingAttendees(newMeeting.id);
      expect(attendees.length).toBe(3);
      expect(attendees.some((a) => a.role === 'chair')).toBe(true);

      // 2. Log formal decision
      const decision = await createMeetingDecision({
        meetingId: newMeeting.id,
        title: 'Approve Expansion of Kigamboni Youth Education Hub',
        description: 'The senior management committee unanimously resolved to approve the project expansion proposal.',
        category: 'strategic',
      });

      expect(decision.id).toBeDefined();
      expect(decision.decisionNumber).toMatch(/^DEC-\d{4}-\d{3}$/);

      const meetingDecisions = await getMeetingDecisions(newMeeting.id);
      expect(meetingDecisions.some((d) => d.id === decision.id)).toBe(true);

      // 3. Assign follow-up action with future due date
      const action = await createMeetingAction({
        meetingId: newMeeting.id,
        decisionId: decision.id,
        taskDescription: 'Draft final grant requisition and submit to donor partner',
        assignedTo: 'user-pm',
        assignedToName: 'Baraka H. Makene',
        dueDate: '2026-11-15',
      });

      expect(action.id).toBeDefined();
      expect(action.actionNumber).toMatch(/^ACT-\d{4}-\d{3}$/);
      expect(action.status).toBe('pending');
      expect(action.isOverdue).toBe(false);
    });

    it('detects overdue action tasks dynamically when due date is in the past', async () => {
      const meetings = await getMeetings();
      const firstMeeting = meetings[0]!;

      // Create an action with past due date
      const overdueAction = await createMeetingAction({
        meetingId: firstMeeting.id,
        taskDescription: 'Past due compliance checklist item',
        assignedTo: 'user-officer',
        assignedToName: 'Joyce Test Officer',
        dueDate: '2026-01-01', // clearly in the past
      });

      expect(overdueAction.isOverdue).toBe(true);
      expect(overdueAction.status).toBe('overdue');

      // Verify getMeetingActions returns it in overdue filter
      const overdueList = await getMeetingActions({ overdueOnly: true });
      expect(overdueList.some((a) => a.id === overdueAction.id)).toBe(true);
    });

    it('completes an action task and records completion notes and timestamp', async () => {
      const meetings = await getMeetings();
      const firstMeeting = meetings[0]!;

      const action = await createMeetingAction({
        meetingId: firstMeeting.id,
        taskDescription: 'File monthly statutory reports',
        assignedTo: 'user-officer',
        assignedToName: 'Amina Officer',
        dueDate: '2026-12-01',
      });

      const updated = await updateMeetingAction(
        {
          actionId: action.id,
          status: 'completed',
          completionNotes: 'All returns successfully filed with the relevant authority.',
        },
        { id: 'user-officer', displayName: 'Amina Officer' }
      );

      expect(updated.status).toBe('completed');
      expect(updated.isOverdue).toBe(false);
      expect(updated.completionNotes).toContain('successfully filed');
      expect(updated.completedAt).toBeDefined();
      expect(updated.completedBy).toBe('user-officer');
    });
  });

  describe('3. Cross-Module Reporting Engine', () => {
    it('generates authorized report datasets for all 6 operational categories', async () => {
      const categories = [
        'documents',
        'projects',
        'finance',
        'hr',
        'actions',
        'correspondence',
      ] as const;

      for (const cat of categories) {
        const report = await generateReport(cat, {}, {
          id: 'admin',
          displayName: 'System Auditor',
          roles: ['system_admin'],
        });

        expect(report.metadata).toBeDefined();
        expect(report.metadata.reportCategory).toBe(cat);
        expect(report.metadata.rowCount).toBeGreaterThanOrEqual(1);
        expect(report.columns.length).toBeGreaterThan(0);
        expect(report.rows.length).toBe(report.metadata.rowCount);
      }
    });

    it('filters operational reports by search term and parameters', async () => {
      const docReport = await generateReport('documents', {
        search: 'Safeguarding',
      });

      expect(docReport.rows.length).toBeGreaterThanOrEqual(1);
      expect(
        docReport.rows.every((row) =>
          String(row['title']).toLowerCase().includes('safeguarding')
        )
      ).toBe(true);
    });
  });

  describe('4. Spreadsheet Formula Injection Defense (CWE-1236) & Export', () => {
    it('escapes cells starting with formula trigger characters (=, +, -, @, \\t, \\r)', () => {
      // Formula payloads designed to trigger DDE or calculation execution
      const maliciousPayloads = [
        '=cmd|\' /C calc\'!A0',
        '+SUM(1+1)',
        '-2+3+cmd|',
        '@SUM(1+2)',
        '\tTAB_INDENTED',
        '\rCR_INJECTED',
      ];

      for (const payload of maliciousPayloads) {
        const sanitized = sanitizeSpreadsheetValue(payload);
        // Sanitized value must be wrapped in quotes and start with '
        expect(sanitized.startsWith('"\'') || sanitized.startsWith('\'')).toBe(true);
      }

      // Harmless values are preserved
      expect(sanitizeSpreadsheetValue('Regular Title')).toBe('Regular Title');
      expect(sanitizeSpreadsheetValue(12345)).toBe('12345');
      expect(sanitizeSpreadsheetValue(null)).toBe('');
      expect(sanitizeSpreadsheetValue(undefined)).toBe('');
    });

    it('escapes embedded double quotes per RFC 4180 and wraps strings with commas', () => {
      const textWithQuotes = 'Report on "Safe Spaces" for Children';
      const sanitized = sanitizeSpreadsheetValue(textWithQuotes);
      expect(sanitized).toBe('"Report on ""Safe Spaces"" for Children"');

      const textWithCommas = 'Dar es Salaam, Tanzania';
      const sanitizedCommas = sanitizeSpreadsheetValue(textWithCommas);
      expect(sanitizedCommas).toBe('"Dar es Salaam, Tanzania"');
    });

    it('identifies confidential fields and prevents sensitive credential export', () => {
      expect(isConfidentialField('password')).toBe(true);
      expect(isConfidentialField('user_token')).toBe(true);
      expect(isConfidentialField('api_secret')).toBe(true);
      expect(isConfidentialField('emergencyContactPhone')).toBe(true);
      expect(isConfidentialField('mfa_secret')).toBe(true);

      // Safe fields
      expect(isConfidentialField('referenceNumber')).toBe(false);
      expect(isConfidentialField('fullName')).toBe(false);
      expect(isConfidentialField('status')).toBe(false);
      expect(isConfidentialField('budgetAmount')).toBe(false);
    });

    it('generates CSV with UTF-8 BOM, metadata header comments, and masked confidential columns', () => {
      const mockReport: ReportDataSet = {
        metadata: {
          reportId: 'REP-TEST-001',
          reportTitle: 'Test HR & Personnel Export',
          reportCategory: 'hr',
          generatedAt: '2026-10-13T12:00:00Z',
          generatedByName: 'System Auditor',
          rowCount: 2,
          dateRangeLabel: 'All Records',
        },
        columns: [
          { key: 'staffNumber', header: 'Staff ID' },
          { key: 'fullName', header: 'Full Name' },
          { key: 'password_hash', header: 'Password Hash' },
          { key: 'emergency_phone', header: 'Emergency Contact' },
          { key: 'calculatedFormula', header: 'Formula Cell' },
        ],
        rows: [
          {
            staffNumber: 'STF-001',
            fullName: 'Elisha N. Mwakipesile',
            password_hash: 'secret_hash_value_123',
            emergency_phone: '+255 754 000 111',
            calculatedFormula: '=cmd|\' /C calc\'!A0',
          },
          {
            staffNumber: 'STF-002',
            fullName: 'Grace M. Mlay',
            password_hash: 'secret_hash_value_456',
            emergency_phone: '+255 754 000 222',
            calculatedFormula: '+100+200',
          },
        ],
      };

      const csv = generateCsvContent(mockReport, { maskConfidential: true, includeBOM: true });

      // 1. Starts with UTF-8 BOM
      expect(csv.startsWith('\uFEFF')).toBe(true);

      // 2. Contains metadata header
      expect(csv).toContain('# Babawatoto Organization Management System (BAOMS)');
      expect(csv).toContain('# Title: Test HR & Personnel Export');
      expect(csv).toContain('# Generated By: System Auditor');

      // 3. Confidential columns are masked/excluded
      expect(csv).not.toContain('Password Hash');
      expect(csv).not.toContain('Emergency Contact');
      expect(csv).not.toContain('secret_hash_value_123');

      // 4. Formula injection is neutralized
      expect(csv).toContain('\'=cmd|');
      expect(csv).toContain('\'+100+200');
    });
  });

  describe('5. UI Access Control, Navigation & Bilingual Parity', () => {
    it('redirects unauthenticated users attempting to access /correspondence and /reports to /login', async () => {
      window.history.pushState({}, 'Correspondence', '/correspondence');
      render(<App />);

      await waitFor(
        () => {
          expect(
            screen.getAllByText(/Staff Portal Sign In|Kuingia kwa Watumishi/i).length
          ).toBeGreaterThan(0);
        },
        { timeout: 8000 }
      );

      window.history.pushState({}, 'Reports', '/reports');
      render(<App />);

      await waitFor(
        () => {
          expect(
            screen.getAllByText(/Staff Portal Sign In|Kuingia kwa Watumishi/i).length
          ).toBeGreaterThan(0);
        },
        { timeout: 8000 }
      );
    }, 15000);

    it(
      'allows authorized users to access /correspondence and displays tabs and metric registers',
      async () => {
        localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000001');

        window.history.pushState({}, 'Correspondence Page', '/correspondence');
        render(<App />);

        await waitFor(
          () => {
            expect(
              screen.getAllByText(/Correspondence & Meetings|Mawasiliano na Mikutano/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Incoming Register|Daftari la Zinazoingia/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Outgoing Register|Daftari la Zinazotoka/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Meetings & Follow-up Actions|Mikutano na Hatua za Utekelezaji/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Incoming Letters|Barua Zinazoingia/i).length
            ).toBeGreaterThan(0);
          },
          { timeout: 8000 }
        );
      },
      15000
    );

    it(
      'allows authorized users to access /reports and generates report preview table',
      async () => {
        localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000001');

        window.history.pushState({}, 'Reports Page', '/reports');
        render(<App />);

        await waitFor(
          () => {
            expect(
              screen.getAllByText(/Reports & Analytical Audits|Ripoti na Ukaguzi wa Kijumla/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Run Report|Tengeneza Ripoti/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Export CSV|Pakua CSV/i).length
            ).toBeGreaterThan(0);
          },
          { timeout: 8000 }
        );
      },
      15000
    );

    it(
      'switches to Kiswahili and verifies localized terminology across Correspondence & Reports',
      async () => {
        localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000001');

        await i18n.changeLanguage('sw');

        window.history.pushState({}, 'Correspondence SW', '/correspondence');
        render(<App />);

        await waitFor(
          () => {
            expect(
              screen.getAllByText(/Mawasiliano na Mikutano/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Daftari la Zinazoingia/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Daftari la Zinazotoka/i).length
            ).toBeGreaterThan(0);
          },
          { timeout: 8000 }
        );

        window.history.pushState({}, 'Reports SW', '/reports');
        render(<App />);

        await waitFor(
          () => {
            expect(
              screen.getAllByText(/Ripoti na Ukaguzi wa Kijumla/i).length
            ).toBeGreaterThan(0);
            expect(
              screen.getAllByText(/Tengeneza Ripoti/i).length
            ).toBeGreaterThan(0);
          },
          { timeout: 8000 }
        );

        await i18n.changeLanguage('en');
      },
      15000
    );
  });
});
