-- ==============================================================================
-- Migration: 20261013160001_finance_seed.sql
-- Description: Phase 8 Finance Seed Data: Standard Workflows, Budgets,
--              Demonstration Requisitions, Approval Timelines, and Transactions
-- Babawatoto Organization Management System (BAOMS)
-- ==============================================================================

-- 1. Standard Approval Workflow
INSERT INTO public.approval_workflows (id, name, code, description, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Standard Financial Requisition & Expenditure Workflow',
    'WF_FIN_STANDARD',
    'Two-tier review and approval requiring Finance Officer compliance verification followed by Executive Director authorization.',
    true
)
ON CONFLICT (code) DO NOTHING;

-- 2. Approval Steps
INSERT INTO public.approval_steps (id, workflow_id, step_number, step_name, required_role, min_amount, max_amount)
VALUES 
    (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        1,
        'Finance Officer Compliance & Budget Verification',
        'finance_officer',
        0.00,
        NULL
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        2,
        'Executive Director Expenditure Authorization',
        'executive_director',
        0.00,
        NULL
    )
ON CONFLICT (workflow_id, step_number) DO NOTHING;

-- 3. Organizational & Project Budgets
DO $$
DECLARE
    v_bya_id UUID;
    v_cso_id UUID;
    v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    SELECT id INTO v_bya_id FROM public.projects WHERE project_code = 'PRJ-BYA-2026' LIMIT 1;
    SELECT id INTO v_cso_id FROM public.projects WHERE project_code = 'PRJ-CSO-2026' LIMIT 1;

    INSERT INTO public.budgets (id, project_id, fiscal_year, code, name, category, allocated_amount, currency, status, notes, created_by)
    VALUES 
        (
            'c0000000-0000-0000-0000-000000000001',
            NULL,
            '2026',
            'BUD-2026-OPS',
            'Organizational Operations & Administration Budget',
            'Operations',
            45000000.00,
            'TZS',
            'active',
            'Core administrative rent, communications, cloud systems, and institutional utilities.',
            v_admin_id
        ),
        (
            'c0000000-0000-0000-0000-000000000002',
            v_bya_id,
            '2026',
            'BUD-BYA-ACT',
            'Youth Performing Arts Field Training & Facilitation',
            'Field Activities',
            35000000.00,
            'TZS',
            'active',
            'Bagamoyo Youth Academy direct activity delivery, trainer allowances, and meals.',
            v_admin_id
        ),
        (
            'c0000000-0000-0000-0000-000000000003',
            v_cso_id,
            '2026',
            'BUD-CSO-OUT',
            'Child Safeguarding Community Awareness Outreach',
            'Community Outreach',
            25000000.00,
            'TZS',
            'active',
            'Ward-level awareness dialogues, transport reimbursements, and child protection leaflets.',
            v_admin_id
        ),
        (
            'c0000000-0000-0000-0000-000000000004',
            NULL,
            '2026',
            'BUD-2026-CAP',
            'ICT & Organizational Equipment Capital Budget',
            'Capital & Equipment',
            15000000.00,
            'TZS',
            'active',
            'Laptops, audiovisual recording tools, and backup power equipment.',
            v_admin_id
        )
    ON CONFLICT (code) DO NOTHING;
END $$;

-- 4. Financial Requests
DO $$
DECLARE
    v_bya_id UUID;
    v_cso_id UUID;
    v_bud_ops UUID := 'c0000000-0000-0000-0000-000000000001';
    v_bud_bya UUID := 'c0000000-0000-0000-0000-000000000002';
    v_bud_cso UUID := 'c0000000-0000-0000-0000-000000000003';
    v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
    v_director_id UUID := '00000000-0000-0000-0000-000000000002';
    v_finance_id UUID := '00000000-0000-0000-0000-000000000003';
    v_pm_id UUID := '00000000-0000-0000-0000-000000000004';
    v_coord_id UUID := '00000000-0000-0000-0000-000000000005';
BEGIN
    SELECT id INTO v_bya_id FROM public.projects WHERE project_code = 'PRJ-BYA-2026' LIMIT 1;
    SELECT id INTO v_cso_id FROM public.projects WHERE project_code = 'PRJ-CSO-2026' LIMIT 1;

    -- REQ-2026-001: BYA Training Venue & Refreshments (Approved & Partially Paid)
    INSERT INTO public.financial_requests (
        id, request_number, project_id, budget_id, requester_id, request_type,
        title, purpose, total_amount, currency, status, priority, due_date,
        approved_amount, paid_amount, submitted_at, approved_at, approved_by
    ) VALUES (
        'd0000000-0000-0000-0000-000000000001',
        'REQ-2026-001',
        v_bya_id,
        v_bud_bya,
        v_pm_id,
        'activity_expense',
        'Bagamoyo Workshop Hall Hire & Participant Refreshments',
        'Payment for 5-day community hall reservation and daily nutritious lunches for 45 youth participants.',
        3200000.00,
        'TZS',
        'partially_paid',
        'normal',
        '2026-04-20',
        3200000.00,
        2000000.00,
        now() - INTERVAL '7 days',
        now() - INTERVAL '5 days',
        v_director_id
    ) ON CONFLICT (request_number) DO NOTHING;

    -- REQ-2026-002: Outreach Vehicle Fuel & Logistics (Submitted, awaiting Finance review)
    INSERT INTO public.financial_requests (
        id, request_number, project_id, budget_id, requester_id, request_type,
        title, purpose, total_amount, currency, status, priority, due_date,
        approved_amount, paid_amount, submitted_at
    ) VALUES (
        'd0000000-0000-0000-0000-000000000002',
        'REQ-2026-002',
        v_cso_id,
        v_bud_cso,
        v_coord_id,
        'travel_per_diem',
        'Child Safeguarding Ward Outreach Fuel & Transport',
        'Fuel vouchers and ferry tickets for field team deploying to 4 coastal ward clinics.',
        850000.00,
        'TZS',
        'submitted',
        'urgent',
        '2026-04-18',
        NULL,
        0.00,
        now() - INTERVAL '2 days'
    ) ON CONFLICT (request_number) DO NOTHING;

    -- REQ-2026-003: Art Supplies & Paint Canvases (Under Review by Director)
    INSERT INTO public.financial_requests (
        id, request_number, project_id, budget_id, requester_id, request_type,
        title, purpose, total_amount, currency, status, priority, due_date,
        approved_amount, paid_amount, submitted_at
    ) VALUES (
        'd0000000-0000-0000-0000-000000000003',
        'REQ-2026-003',
        v_bya_id,
        v_bud_bya,
        v_pm_id,
        'procurement',
        'Youth Art Therapy Acrylic Paints, Brushes & Canvases',
        'Bulk procurement of durable acrylic paint sets, stretched canvases, and water brushes.',
        1450000.00,
        'TZS',
        'under_review',
        'normal',
        '2026-04-25',
        NULL,
        0.00,
        now() - INTERVAL '4 days'
    ) ON CONFLICT (request_number) DO NOTHING;

    -- REQ-2026-004: Cloud Hosting & Security SSL Subscription (Paid in Full)
    INSERT INTO public.financial_requests (
        id, request_number, project_id, budget_id, requester_id, request_type,
        title, purpose, total_amount, currency, status, priority, due_date,
        approved_amount, paid_amount, submitted_at, approved_at, approved_by
    ) VALUES (
        'd0000000-0000-0000-0000-000000000004',
        'REQ-2026-004',
        NULL,
        v_bud_ops,
        v_admin_id,
        'operational',
        'Annual Cloud Hosting & Database Backup Infrastructure',
        'Secure multi-region cloud infrastructure and automated encrypted snapshot backups for 2026.',
        2100000.00,
        'TZS',
        'paid',
        'normal',
        '2026-04-10',
        2100000.00,
        2100000.00,
        now() - INTERVAL '15 days',
        now() - INTERVAL '12 days',
        v_director_id
    ) ON CONFLICT (request_number) DO NOTHING;

    -- REQ-2026-005: Sound Equipment Rental (Returned for Quotations)
    INSERT INTO public.financial_requests (
        id, request_number, project_id, budget_id, requester_id, request_type,
        title, purpose, total_amount, currency, status, priority, due_date,
        approved_amount, paid_amount, submitted_at, rejected_at, rejected_by, rejection_reason
    ) VALUES (
        'd0000000-0000-0000-0000-000000000005',
        'REQ-2026-005',
        v_cso_id,
        v_bud_cso,
        v_coord_id,
        'procurement',
        'Mobile PA Sound System & Generator Hire',
        'Rental of two 500W public address speakers and portable generator for open-air community gathering.',
        1800000.00,
        'TZS',
        'returned',
        'normal',
        '2026-04-28',
        NULL,
        0.00,
        now() - INTERVAL '6 days',
        now() - INTERVAL '3 days',
        v_finance_id,
        'Please attach at least 2 competitive vendor proforma quotations per BAO procurement guidelines.'
    ) ON CONFLICT (request_number) DO NOTHING;
END $$;

-- 5. Financial Request Lines
INSERT INTO public.financial_request_lines (id, request_id, line_number, description, quantity, unit_cost, total_cost, budget_category)
VALUES
    -- REQ-2026-001 Lines
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, 'Hall Rental (5 Days @ 300,000 TZS/day)', 5.00, 300000.00, 1500000.00, 'Venue & Logistics'),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 2, 'Lunches & Tea for 45 youth (5 days @ 7,000 TZS/person/day)', 225.00, 7000.00, 1575000.00, 'Refreshments & Meals'),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 3, 'Mineral Drinking Water (25 cartons @ 5,000 TZS)', 25.00, 5000.00, 125000.00, 'Refreshments & Meals'),

    -- REQ-2026-002 Lines
    ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 1, 'Diesel Fuel for Outreach Van (250 Liters @ 3,000 TZS/L)', 250.00, 3000.00, 750000.00, 'Transport & Fuel'),
    ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 2, 'Kigamboni Ferry Roundtrip Passes (20 crossings)', 20.00, 5000.00, 100000.00, 'Transport & Fuel'),

    -- REQ-2026-003 Lines
    ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 1, 'Professional Acrylic Paint Sets (20 sets @ 45,000 TZS)', 20.00, 45000.00, 900000.00, 'Art Materials'),
    ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003', 2, 'Primed Cotton Canvas Boards 40x50cm (50 pcs @ 8,000 TZS)', 50.00, 8000.00, 400000.00, 'Art Materials'),
    ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', 3, 'Assorted Synthetic Paint Brushes (30 packs @ 5,000 TZS)', 30.00, 5000.00, 150000.00, 'Art Materials'),

    -- REQ-2026-004 Lines
    ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000004', 1, 'Dedicated VPS Hosting (12 Months @ 150,000 TZS/month)', 12.00, 150000.00, 1800000.00, 'IT Infrastructure'),
    ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000004', 2, 'Wildcard SSL Certificate & Automated DNS Security', 1.00, 300000.00, 300000.00, 'IT Infrastructure'),

    -- REQ-2026-005 Lines
    ('e0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000005', 1, 'PA Sound Equipment Rental with Technician (3 days)', 3.00, 450000.00, 1350000.00, 'Equipment Hire'),
    ('e0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000005', 2, 'Silent Petrol Generator & Fuel (3 days)', 3.00, 150000.00, 450000.00, 'Equipment Hire')
ON CONFLICT (request_id, line_number) DO NOTHING;

-- 6. Approval Instances & Events
DO $$
DECLARE
    v_wf_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_director_id UUID := '00000000-0000-0000-0000-000000000002';
    v_finance_id UUID := '00000000-0000-0000-0000-000000000003';
    v_pm_id UUID := '00000000-0000-0000-0000-000000000004';
    v_coord_id UUID := '00000000-0000-0000-0000-000000000005';
    v_inst_1 UUID := 'f0000000-0000-0000-0000-000000000001';
    v_inst_3 UUID := 'f0000000-0000-0000-0000-000000000003';
    v_inst_5 UUID := 'f0000000-0000-0000-0000-000000000005';
BEGIN
    -- Instance for REQ-2026-001 (Completed)
    INSERT INTO public.approval_instances (id, request_id, workflow_id, current_step_number, status)
    VALUES (v_inst_1, 'd0000000-0000-0000-0000-000000000001', v_wf_id, 2, 'completed')
    ON CONFLICT (request_id) DO NOTHING;

    INSERT INTO public.approval_events (instance_id, step_number, action, actor_id, actor_role, comments, created_at)
    VALUES 
        (v_inst_1, 1, 'submitted', v_pm_id, 'project_manager', 'Requisition submitted for youth academy venue and catering.', now() - INTERVAL '7 days'),
        (v_inst_1, 1, 'reviewed', v_finance_id, 'finance_officer', 'Budget line verified available under BUD-BYA-ACT. Quotation verified.', now() - INTERVAL '6 days'),
        (v_inst_1, 2, 'approved', v_director_id, 'executive_director', 'Approved in full. Proceed with 50% advance to venue provider.', now() - INTERVAL '5 days');

    -- Instance for REQ-2026-003 (In Progress - waiting at step 2)
    INSERT INTO public.approval_instances (id, request_id, workflow_id, current_step_number, status)
    VALUES (v_inst_3, 'd0000000-0000-0000-0000-000000000003', v_wf_id, 2, 'in_progress')
    ON CONFLICT (request_id) DO NOTHING;

    INSERT INTO public.approval_events (instance_id, step_number, action, actor_id, actor_role, comments, created_at)
    VALUES 
        (v_inst_3, 1, 'submitted', v_pm_id, 'project_manager', 'Art supplies requisition for therapeutic module.', now() - INTERVAL '4 days'),
        (v_inst_3, 1, 'reviewed', v_finance_id, 'finance_officer', 'Item rates align with local stationers catalog. Recommended for approval.', now() - INTERVAL '3 days');

    -- Instance for REQ-2026-005 (Returned)
    INSERT INTO public.approval_instances (id, request_id, workflow_id, current_step_number, status)
    VALUES (v_inst_5, 'd0000000-0000-0000-0000-000000000005', v_wf_id, 1, 'returned')
    ON CONFLICT (request_id) DO NOTHING;

    INSERT INTO public.approval_events (instance_id, step_number, action, actor_id, actor_role, comments, created_at)
    VALUES 
        (v_inst_5, 1, 'submitted', v_coord_id, 'project_coordinator', 'Sound equipment hire requisition.', now() - INTERVAL '6 days'),
        (v_inst_5, 1, 'returned', v_finance_id, 'finance_officer', 'Please attach at least 2 competitive vendor proforma quotations per BAO procurement guidelines.', now() - INTERVAL '3 days');
END $$;

-- 7. Payment Disbursements (Transactions)
DO $$
DECLARE
    v_finance_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
    -- Partial Payment for REQ-2026-001 (Advance 2,000,000 TZS)
    INSERT INTO public.transactions (
        id, transaction_number, request_id, payment_method, payment_reference,
        amount, currency, payment_date, payee_name, payee_contact,
        bank_name, bank_account_number, disbursed_by, notes, status
    ) VALUES (
        '10000000-0000-0000-0000-000000000001',
        'TXN-2026-001',
        'd0000000-0000-0000-0000-000000000001',
        'bank_transfer',
        'CRDB-FT26105001',
        2000000.00,
        'TZS',
        CURRENT_DATE - INTERVAL '3 days',
        'Bagamoyo Community Heritage Hall Trust',
        '+255 23 244 0110',
        'CRDB Bank Plc',
        '0150244987600',
        v_finance_id,
        'Advance deposit for venue hire and catering reservation. Remaining balance: 1,200,000 TZS.',
        'completed'
    ) ON CONFLICT (payment_reference) DO NOTHING;

    -- Full Payment for REQ-2026-004 (2,100,000 TZS)
    INSERT INTO public.transactions (
        id, transaction_number, request_id, payment_method, payment_reference,
        amount, currency, payment_date, payee_name, payee_contact,
        bank_name, bank_account_number, disbursed_by, notes, status
    ) VALUES (
        '10000000-0000-0000-0000-000000000002',
        'TXN-2026-002',
        'd0000000-0000-0000-0000-000000000004',
        'bank_transfer',
        'NMB-TT26048892',
        2100000.00,
        'TZS',
        CURRENT_DATE - INTERVAL '10 days',
        'CloudEast Hostings Ltd',
        '+255 754 888 999',
        'NMB Bank Plc',
        '2081005678900',
        v_finance_id,
        'Full annual payment for secure dedicated cloud infrastructure and backups.',
        'completed'
    ) ON CONFLICT (payment_reference) DO NOTHING;
END $$;
