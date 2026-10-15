-- ==============================================================================
-- Babawatoto Organization Management System (BAOMS)
-- Migration: 20261013140001_documents_seed.sql
-- Description: Idempotent seed data for document categories with bilingual definitions
-- ==============================================================================

INSERT INTO public.document_categories (code, name_en, name_sw, description_en, description_sw, icon, is_active)
VALUES
    (
        'GOV',
        'Governance & Board Resolutions',
        'Katiba na Maazimio ya Bodi',
        'Constitution, registration certificates, board meeting minutes, charters, and executive directives.',
        'Katiba, vyeti vya usajili, muhtasari wa vikao vya bodi, na maelekezo ya kiutawala.',
        'Landmark',
        true
    ),
    (
        'FIN',
        'Financial Reports & Audits',
        'Ripoti za Fedha na Ukaguzi',
        'Annual financial statements, external audit reports, grant budgets, and financial compliance documents.',
        'Taarifa za fedha za mwaka, ripoti za ukaguzi wa nje, bajeti za ufadhili, na hati za kufuata sheria.',
        'Wallet',
        true
    ),
    (
        'PRJ',
        'Project Proposals & Field Reports',
        'Mapendekezo na Ripoti za Miradi',
        'Program proposals, donor grant agreements, community baseline studies, and field monitoring reports.',
        'Mapendekezo ya miradi, mikataba ya wafadhili, tafiti za awali za jamii, na ripoti za ufuatiliaji.',
        'Briefcase',
        true
    ),
    (
        'HR',
        'Human Resources & Policies',
        'Sera za Utumishi na Miongozo',
        'Staff handbook, code of conduct, child safeguarding policy, whistleblowing guidelines, and job descriptions.',
        'Mwongozo wa watumishi, kanuni za maadili, sera ya ulinzi wa mtoto, na miongozo ya kazi.',
        'Users',
        true
    ),
    (
        'LEG',
        'Legal Agreements & MOUs',
        'Mikataba na Makubaliano ya Kisheria',
        'Memorandums of Understanding (MOUs) with government authorities, partner agreements, leases, and contracts.',
        'Hati za makubaliano na serikali, mikataba ya ushirikiano, upangishaji, na makubaliano ya kisheria.',
        'Scale',
        true
    ),
    (
        'PUB',
        'Publications & Annual Reports',
        'Machapisho na Ripoti za Mwaka',
        'Official annual reports, newsletters, community impact stories, research publications, and press statements.',
        'Ripoti rasmi za mwaka, majarida, taarifa za matokeo ya jamii, tafiti, na taarifa kwa vyombo vya habari.',
        'BookOpen',
        true
    )
ON CONFLICT (code) DO UPDATE
SET
    name_en = EXCLUDED.name_en,
    name_sw = EXCLUDED.name_sw,
    description_en = EXCLUDED.description_en,
    description_sw = EXCLUDED.description_sw,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active,
    updated_at = timezone('utc'::text, now());
