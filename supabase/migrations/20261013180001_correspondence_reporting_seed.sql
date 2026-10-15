-- ============================================================================
-- BAOMS Phase 10: Correspondence, Meetings & Reporting Seed Data
-- Babawatoto Organization Management System
-- ============================================================================

-- 1. Seed Correspondence Records
INSERT INTO public.correspondence (
    id, reference_number, direction, sender, recipient, subject, correspondence_date,
    category, project_id, status, confidentiality_level, notes, created_at, updated_at
) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'COR-IN-2026-001',
    'incoming',
    'Ministry of Community Development, Gender, Women and Special Groups (Tanzania)',
    'Executive Director, Babawatoto Centre for Children and Youth',
    'Annual NGO Compliance Certificate & Statutory Filing Acknowledgement 2026',
    '2026-01-15',
    'government',
    NULL,
    'received',
    'public',
    'Official government acknowledgment confirming compliance with the Non-Governmental Organizations Act.',
    '2026-01-15T09:30:00Z',
    '2026-01-15T09:30:00Z'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'COR-IN-2026-002',
    'incoming',
    'UNICEF Tanzania Country Office',
    'Project Manager, Babawatoto Youth Academy',
    'Partnership Grant Approval: Child Protection & Arts-Based Psychosocial Support',
    '2026-02-04',
    'donor',
    '10000000-0000-0000-0000-000000000001',
    'approved',
    'internal',
    'Grant authorization letter approving operational implementation for Year 2026.',
    '2026-02-04T11:00:00Z',
    '2026-02-04T11:00:00Z'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'COR-IN-2026-003',
    'incoming',
    'Kinondoni Municipal Council - Social Welfare Department',
    'Programs Coordinator, BAO Community Outreach',
    'Clearance for Field Outreach and Children Performing Arts Festival in Tandale',
    '2026-03-01',
    'community',
    '10000000-0000-0000-0000-000000000002',
    'approved',
    'public',
    'Local government clearance for outdoor community mobilization and street theatre sessions.',
    '2026-03-01T14:20:00Z',
    '2026-03-01T14:20:00Z'
),
(
    'c0000000-0000-0000-0000-000000000004',
    'COR-OUT-2026-001',
    'outgoing',
    'Executive Director, Babawatoto Centre for Children and Youth',
    'Registrar of NGOs, Ministry of Community Development',
    'Submission of BAO 2025 Annual Operational & Audited Financial Statements',
    '2026-01-28',
    'government',
    NULL,
    'dispatched',
    'internal',
    'Formal statutory submission with audited financial reports and annual activities summary.',
    '2026-01-28T10:15:00Z',
    '2026-01-28T10:15:00Z'
),
(
    'c0000000-0000-0000-0000-000000000005',
    'COR-OUT-2026-002',
    'outgoing',
    'Finance & Administration Department, BAOMS',
    'Standard Chartered Bank Tanzania Ltd - Corporate Banking',
    'Updated Authorized Bank Signatories Resolution and Corporate KYC Documentation',
    '2026-02-10',
    'legal',
    NULL,
    'dispatched',
    'confidential',
    'Confidential banking instruction containing board mandate and signatory resolutions.',
    '2026-02-10T15:45:00Z',
    '2026-02-10T15:45:00Z'
)
ON CONFLICT (reference_number) DO NOTHING;

-- 2. Seed Meetings
INSERT INTO public.meetings (
    id, meeting_number, title, meeting_type, meeting_date, location,
    chairperson_id, secretary_id, status, confidentiality_level, created_at, updated_at
) VALUES
(
    'm0000000-0000-0000-0000-000000000001',
    'MTG-2026-001',
    'BAO Board of Trustees & Executive Strategic Alignment Q1',
    'board',
    '2026-01-20T09:00:00Z',
    'BAO Headquarters Main Boardroom, Dar es Salaam',
    '00000000-0000-0000-0000-000000000002', -- Elisha (ED)
    '00000000-0000-0000-0000-000000000006', -- Amina (HR/Admin)
    'completed',
    'internal',
    '2026-01-20T08:00:00Z',
    '2026-01-20T14:00:00Z'
),
(
    'm0000000-0000-0000-0000-000000000002',
    'MTG-2026-002',
    'Monthly Project Performance & Budget Utilization Review',
    'management',
    '2026-02-15T10:00:00Z',
    'BAO Conference Room & Virtual Hybrid',
    '00000000-0000-0000-0000-000000000004', -- Mariam (PM)
    '00000000-0000-0000-0000-000000000005', -- Juma (PC)
    'completed',
    'internal',
    '2026-02-15T09:30:00Z',
    '2026-02-15T13:00:00Z'
)
ON CONFLICT (meeting_number) DO NOTHING;

-- 3. Seed Meeting Attendees
INSERT INTO public.meeting_attendees (
    id, meeting_id, user_id, external_name, email, role, attended
) VALUES
('a0000000-0000-0000-0000-000000000001', 'm0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Elisha B. Mwalongo', 'ed@babawatoto.org', 'Chairperson', true),
('a0000000-0000-0000-0000-000000000002', 'm0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Amina L. Kimaro', 'hr@babawatoto.org', 'Secretary', true),
('a0000000-0000-0000-0000-000000000003', 'm0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Baraka K. Mwangi', 'finance@babawatoto.org', 'Finance Lead', true),
('a0000000-0000-0000-0000-000000000004', 'm0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Mariam M. Juma', 'pm@babawatoto.org', 'Chairperson', true),
('a0000000-0000-0000-0000-000000000005', 'm0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'Juma S. Temu', 'coord@babawatoto.org', 'Secretary', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Meeting Decisions
INSERT INTO public.meeting_decisions (
    id, meeting_id, decision_number, title, description, category
) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000001',
    'DEC-2026-001',
    'Approval of Revised Child Protection and Safeguarding Code of Conduct',
    'Board unanimously approved updated safeguarding protocols incorporating digital child privacy norms.',
    'governance'
),
(
    'd0000000-0000-0000-0000-000000000002',
    'm0000000-0000-0000-0000-000000000002',
    'DEC-2026-002',
    'Expansion of Community Outreach Mobile Clinics to Tandale Ward',
    'Management resolved to reallocate TZS 3,500,000 from logistics reserve to support Tandale ward mobilization.',
    'operational'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Meeting Actions / Follow-up Tasks
INSERT INTO public.meeting_actions (
    id, meeting_id, decision_id, action_number, task_description,
    assigned_to, assigned_to_name, due_date, status, completion_notes, created_at, updated_at
) VALUES
(
    'k0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'ACT-2026-001',
    'Distribute revised Child Safeguarding pledge for signature across all field and volunteer staff',
    '00000000-0000-0000-0000-000000000006',
    'Amina L. Kimaro',
    '2026-03-31',
    'in_progress',
    'Checklists updated; physical copies distributed to Youth Academy staff.',
    '2026-01-20T14:30:00Z',
    '2026-01-20T14:30:00Z'
),
(
    'k0000000-0000-0000-0000-000000000002',
    'm0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    'ACT-2026-002',
    'Submit budget adjustment request in BAOMS for Tandale outreach reallocations',
    '00000000-0000-0000-0000-000000000003',
    'Baraka K. Mwangi',
    '2026-02-28',
    'completed',
    'Reallocation financial requisition processed and authorized.',
    '2026-02-15T13:30:00Z',
    '2026-02-28T10:00:00Z'
),
(
    'k0000000-0000-0000-0000-000000000003',
    'm0000000-0000-0000-0000-000000000002',
    NULL,
    'ACT-2026-003',
    'Prepare M&E mid-term milestone indicator matrix for quarterly donor reporting',
    '00000000-0000-0000-0000-000000000005',
    'Juma S. Temu',
    '2026-01-10',
    'overdue',
    'Pending field beneficiary verification numbers from community animators.',
    '2026-02-15T13:30:00Z',
    '2026-02-15T13:30:00Z'
)
ON CONFLICT (id) DO NOTHING;
