/**
 * BAOMS HR Initial Dataset (Clean / Empty for User Manual Registration)
 * Babawatoto Organization Management System
 */

import {
  StaffProfileRecord,
  LeaveTypeRecord,
  LeaveBalanceRecord,
  LeaveRequestRecord,
  StaffChecklistRecord,
  StaffDocumentRecord,
} from '../types/hr';

export const INITIAL_MOCK_LEAVE_TYPES: LeaveTypeRecord[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    code: 'ANNUAL',
    nameEn: 'Annual Leave',
    nameSw: 'Likizo ya Mwaka',
    descriptionEn: 'Statutory paid annual recreational leave entitlement.',
    descriptionSw: 'Likizo ya kisheria ya mapumziko ya mwaka yenye malipo.',
    daysAllowedPerYear: 28,
    requiresAttachment: false,
    isActive: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    code: 'SICK',
    nameEn: 'Sick Leave',
    nameSw: 'Likizo ya Ugonjwa',
    descriptionEn: 'Medical leave requiring practitioner certificate for absences > 2 days.',
    descriptionSw: 'Likizo ya matibabu inayohitaji cheti cha daktari kwa zaidi ya siku 2.',
    daysAllowedPerYear: 14,
    requiresAttachment: true,
    isActive: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    code: 'MATERNITY',
    nameEn: 'Maternity Leave',
    nameSw: 'Likizo ya Uzazi (Mama)',
    descriptionEn: 'Statutory maternity leave for female personnel.',
    descriptionSw: 'Likizo ya uzazi ya kisheria kwa watumishi wa kike.',
    daysAllowedPerYear: 84,
    requiresAttachment: true,
    isActive: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    code: 'PATERNITY',
    nameEn: 'Paternity Leave',
    nameSw: 'Likizo ya Uzazi (Baba)',
    descriptionEn: 'Statutory paid paternity leave for male personnel upon childbirth.',
    descriptionSw: 'Likizo ya uzazi kwa mtumishi wa kiume baada ya mzazi kujifungua.',
    daysAllowedPerYear: 7,
    requiresAttachment: false,
    isActive: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    code: 'COMPASSIONATE',
    nameEn: 'Compassionate Leave',
    nameSw: 'Likizo ya Msiba au Dharura',
    descriptionEn: 'Bereavement or urgent emergency family welfare leave.',
    descriptionSw: 'Likizo ya msiba wa mwanafamilia wa karibu au dharura.',
    daysAllowedPerYear: 5,
    requiresAttachment: false,
    isActive: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    code: 'STUDY',
    nameEn: 'Study Leave',
    nameSw: 'Likizo ya Masomo',
    descriptionEn: 'Educational and professional training development leave.',
    descriptionSw: 'Likizo ya masomo na mafunzo ya kitaaluma.',
    daysAllowedPerYear: 14,
    requiresAttachment: true,
    isActive: true,
  },
];

export const INITIAL_MOCK_STAFF: StaffProfileRecord[] = [];
export const INITIAL_MOCK_LEAVE_BALANCES: LeaveBalanceRecord[] = [];
export const INITIAL_MOCK_LEAVE_REQUESTS: LeaveRequestRecord[] = [];
export const INITIAL_MOCK_CHECKLISTS: StaffChecklistRecord[] = [];
export const INITIAL_MOCK_STAFF_DOCUMENTS: StaffDocumentRecord[] = [];
