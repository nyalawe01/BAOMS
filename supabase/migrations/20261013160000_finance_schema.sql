-- ==============================================================================
-- Migration: 20261013160000_finance_schema.sql
-- Description: Phase 8 Finance, Budgets, Multi-Tier Approval Workflows,
--              Supporting Documents, and Payment Disbursements with Row-Level Security
-- Babawatoto Organization Management System (BAOMS)
-- ==============================================================================

-- 1. Budgets Table (Organizational and Project Budgets)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    fiscal_year TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    allocated_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (allocated_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'TZS',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budgets_code ON public.budgets(code);
CREATE INDEX IF NOT EXISTS idx_budgets_project ON public.budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_year ON public.budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);

-- 2. Financial Requests Table
CREATE TABLE IF NOT EXISTS public.financial_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL UNIQUE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
    requester_id UUID NOT NULL REFERENCES public.profiles(id),
    request_type TEXT NOT NULL CHECK (request_type IN (
        'activity_expense',
        'procurement',
        'travel_per_diem',
        'operational',
        'petty_cash',
        'consultancy'
    )),
    title TEXT NOT NULL,
    purpose TEXT NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount > 0),
    currency TEXT NOT NULL DEFAULT 'TZS',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',
        'submitted',
        'under_review',
        'approved',
        'partially_paid',
        'paid',
        'returned',
        'rejected',
        'cancelled'
    )),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
    due_date DATE,
    approved_amount NUMERIC(15, 2) CHECK (approved_amount IS NULL OR approved_amount >= 0),
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_paid_not_exceed_approved CHECK (
        approved_amount IS NULL OR paid_amount <= approved_amount
    )
);

CREATE INDEX IF NOT EXISTS idx_fin_req_number ON public.financial_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_fin_req_project ON public.financial_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_fin_req_budget ON public.financial_requests(budget_id);
CREATE INDEX IF NOT EXISTS idx_fin_req_requester ON public.financial_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_fin_req_status ON public.financial_requests(status);
CREATE INDEX IF NOT EXISTS idx_fin_req_created ON public.financial_requests(created_at DESC);

-- 3. Financial Request Lines (Itemized Expenditure Breakdown)
CREATE TABLE IF NOT EXISTS public.financial_request_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.financial_requests(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
    unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(15, 2) NOT NULL CHECK (total_cost >= 0),
    budget_category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_fin_req_line UNIQUE (request_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_fin_req_lines_req ON public.financial_request_lines(request_id);

-- 4. Approval Workflows & Steps Configuration
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    required_role TEXT NOT NULL,
    min_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    max_amount NUMERIC(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_workflow_step UNIQUE (workflow_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_approval_steps_wf ON public.approval_steps(workflow_id);

-- 5. Approval Instances (Per-Request Workflow Execution)
CREATE TABLE IF NOT EXISTS public.approval_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.financial_requests(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id),
    current_step_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'rejected', 'returned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_req_approval_instance UNIQUE (request_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_instances_req ON public.approval_instances(request_id);

-- 6. Approval Events (Audit Log of Reviews & Decisions)
CREATE TABLE IF NOT EXISTS public.approval_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES public.approval_instances(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('submitted', 'reviewed', 'approved', 'rejected', 'returned')),
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    actor_role TEXT NOT NULL,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_events_instance ON public.approval_events(instance_id);
CREATE INDEX IF NOT EXISTS idx_approval_events_actor ON public.approval_events(actor_id);

-- 7. Payment Transactions (Disbursements)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number TEXT NOT NULL UNIQUE,
    request_id UUID NOT NULL REFERENCES public.financial_requests(id) ON DELETE RESTRICT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'cash', 'cheque')),
    payment_reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'TZS',
    payment_date DATE NOT NULL,
    payee_name TEXT NOT NULL,
    payee_contact TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    disbursed_by UUID NOT NULL REFERENCES public.profiles(id),
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_number ON public.transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_transactions_req ON public.transactions(request_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(payment_date);

-- 8. Request Documents (Supporting Evidence Junction)
CREATE TABLE IF NOT EXISTS public.request_documents (
    request_id UUID NOT NULL REFERENCES public.financial_requests(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'receipt', 'terms_of_reference', 'quotation', 'voucher', 'other')),
    attached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (request_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_request_docs_doc ON public.request_documents(document_id);

-- Triggers for updated_at
CREATE TRIGGER trg_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_financial_requests_updated_at
    BEFORE UPDATE ON public.financial_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_approval_workflows_updated_at
    BEFORE UPDATE ON public.approval_workflows
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_approval_instances_updated_at
    BEFORE UPDATE ON public.approval_instances
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_request_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_documents ENABLE ROW LEVEL SECURITY;

-- Budgets RLS
CREATE POLICY "budgets_select_policy"
    ON public.budgets FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('finance.view')
        OR public.has_permission('finance.request')
    );

CREATE POLICY "budgets_insert_update_policy"
    ON public.budgets FOR ALL
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_role('finance_officer')
    );

-- Financial Requests RLS
CREATE POLICY "fin_req_select_policy"
    ON public.financial_requests FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('finance.view')
        OR requester_id = auth.uid()
    );

CREATE POLICY "fin_req_insert_policy"
    ON public.financial_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (public.has_permission('finance.request') AND requester_id = auth.uid())
    );

-- Crucial: Segregation of Duties - Requester CANNOT self-approve
CREATE POLICY "fin_req_update_policy"
    ON public.financial_requests FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR (
            -- Requesters can only edit while draft or returned
            requester_id = auth.uid() AND status IN ('draft', 'returned')
        )
        OR (
            -- Approvers can update if they are NOT the requester
            (public.has_permission('finance.approve') OR public.has_role('finance_officer'))
            AND requester_id != auth.uid()
        )
        OR (
            -- Disbursers can update paid status during transaction processing
            public.has_permission('finance.disburse')
        )
    );

-- Lines RLS
CREATE POLICY "fin_req_lines_select_policy"
    ON public.financial_request_lines FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = financial_request_lines.request_id
            AND (
                public.is_admin()
                OR public.has_role('executive_director')
                OR public.has_permission('finance.view')
                OR fr.requester_id = auth.uid()
            )
        )
    );

CREATE POLICY "fin_req_lines_write_policy"
    ON public.financial_request_lines FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = financial_request_lines.request_id
            AND (
                public.is_admin()
                OR (fr.requester_id = auth.uid() AND fr.status IN ('draft', 'returned'))
            )
        )
    );

-- Approval Workflows & Steps RLS
CREATE POLICY "approval_wf_select_policy"
    ON public.approval_workflows FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "approval_steps_select_policy"
    ON public.approval_steps FOR SELECT
    TO authenticated
    USING (true);

-- Approval Instances & Events RLS
CREATE POLICY "approval_instances_select_policy"
    ON public.approval_instances FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = approval_instances.request_id
            AND (
                public.is_admin()
                OR public.has_role('executive_director')
                OR public.has_permission('finance.view')
                OR fr.requester_id = auth.uid()
            )
        )
    );

CREATE POLICY "approval_events_select_policy"
    ON public.approval_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.approval_instances ai
            JOIN public.financial_requests fr ON fr.id = ai.request_id
            WHERE ai.id = approval_events.instance_id
            AND (
                public.is_admin()
                OR public.has_role('executive_director')
                OR public.has_permission('finance.view')
                OR fr.requester_id = auth.uid()
            )
        )
    );

CREATE POLICY "approval_events_insert_policy"
    ON public.approval_events FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR public.has_permission('finance.approve')
        OR public.has_permission('finance.request')
        OR public.has_role('finance_officer')
    );

-- Transactions (Disbursements) RLS
CREATE POLICY "transactions_select_policy"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.has_role('executive_director')
        OR public.has_permission('finance.view')
        OR EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = transactions.request_id
            AND fr.requester_id = auth.uid()
        )
    );

CREATE POLICY "transactions_insert_policy"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR public.has_permission('finance.disburse')
    );

-- Request Documents Junction RLS
CREATE POLICY "request_docs_select_policy"
    ON public.request_documents FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = request_documents.request_id
            AND (
                public.is_admin()
                OR public.has_role('executive_director')
                OR public.has_permission('finance.view')
                OR fr.requester_id = auth.uid()
            )
        )
    );

CREATE POLICY "request_docs_insert_policy"
    ON public.request_documents FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.financial_requests fr
            WHERE fr.id = request_documents.request_id
            AND (
                public.is_admin()
                OR fr.requester_id = auth.uid()
                OR public.has_role('finance_officer')
            )
        )
    );
