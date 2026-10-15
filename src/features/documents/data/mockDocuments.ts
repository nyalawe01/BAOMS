/**
 * Organizational Document Categories & Documents Dataset (Clean / Ready for Live Uploads)
 * Babawatoto Organization Management System (BAOMS)
 */

import { DocumentCategory, DocumentRecord } from '../types/document';

export const MOCK_CATEGORIES: DocumentCategory[] = [
  {
    id: 'cat-gov-001',
    code: 'GOV',
    name_en: 'Governance & Constitution',
    name_sw: 'Utawala na Katiba',
    description_en: 'Foundational charters, board resolutions, registered constitutions, and organizational bylaws.',
    description_sw: 'Hati za msingi, maazimio ya bodi, katiba iliyosajiliwa, na sheria ndogo za shirika.',
    icon: 'Building2',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'cat-fin-002',
    code: 'FIN',
    name_en: 'Financial & Audit Records',
    name_sw: 'Kumbukumbu za Fedha na Ukaguzi',
    description_en: 'Annual budgets, statutory audits, donor expenditure acquittals, and banking authorizations.',
    description_sw: 'Bajeti za mwaka, ukaguzi wa kisheria, hesabu za wafadhili, na idhini za kibenki.',
    icon: 'BadgePercent',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'cat-prj-003',
    code: 'PRJ',
    name_en: 'Project & Field Work',
    name_sw: 'Miradi na Shughuli za Nyanjani',
    description_en: 'Project proposals, logframes, monitoring reports, donor grant contracts, and field evaluations.',
    description_sw: 'Mapendekezo ya miradi, ripoti za ufuatiliaji, mikataba ya ruzuku, na tathmini za nyanjani.',
    icon: 'FolderKanban',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'cat-hr-004',
    code: 'HR',
    name_en: 'Human Resources & Policies',
    name_sw: 'Rasilimali Watu na Sera',
    description_en: 'Staff handbooks, child safeguarding policies, employment templates, and organizational charts.',
    description_sw: 'Mwongozo wa watumishi, sera ya ulinzi wa mtoto, fomu za ajira, na muundo wa shirika.',
    icon: 'Users',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'cat-leg-005',
    code: 'LEG',
    name_en: 'Legal & Compliance',
    name_sw: 'Sheria na Uzingatiaji wa Kanuni',
    description_en: 'NGO registrar certificates, tax clearance certificates (TRA), lease agreements, and MoUs.',
    description_sw: 'Vyeti vya usajili wa NGO, vyeti vya kodi (TRA), mikataba ya upangaji, na mikataba ya maelewano.',
    icon: 'Scale',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'cat-pub-006',
    code: 'PUB',
    name_en: 'Publications & Public Reports',
    name_sw: 'Machapisho na Ripoti za Umma',
    description_en: 'Annual public impact reports, community newsletters, official press releases, and brochures.',
    description_sw: 'Ripoti za mwaka za matokeo kwa umma, majarida ya jamii, taarifa rasmi kwa vyombo vya habari.',
    icon: 'BookOpen',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z',
  },
];

export const MOCK_DOCUMENTS: DocumentRecord[] = [];
