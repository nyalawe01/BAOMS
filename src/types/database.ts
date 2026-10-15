/**
 * Supabase PostgreSQL Database Type Definitions
 * Babawatoto Organization Management System (BAOMS)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          code: string;
          name_en: string;
          name_sw: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name_en: string;
          name_sw: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name_en?: string;
          name_sw?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          code: string;
          name_en: string;
          name_sw: string;
          description_en: string | null;
          description_sw: string | null;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name_en: string;
          name_sw: string;
          description_en?: string | null;
          description_sw?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name_en?: string;
          name_sw?: string;
          description_en?: string | null;
          description_sw?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          code: string;
          category: string;
          description_en: string;
          description_sw: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          category: string;
          description_en: string;
          description_sw: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          category?: string;
          description_en?: string;
          description_sw?: string;
          created_at?: string;
        };
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
          granted_at: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
          granted_at?: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
          granted_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          phone_number: string | null;
          preferred_language: 'en' | 'sw';
          department_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          phone_number?: string | null;
          preferred_language?: 'en' | 'sw';
          department_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          phone_number?: string | null;
          preferred_language?: 'en' | 'sw';
          department_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      document_categories: {
        Row: {
          id: string;
          code: string;
          name_en: string;
          name_sw: string;
          description_en: string | null;
          description_sw: string | null;
          icon: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name_en: string;
          name_sw: string;
          description_en?: string | null;
          description_sw?: string | null;
          icon?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name_en?: string;
          name_sw?: string;
          description_en?: string | null;
          description_sw?: string | null;
          icon?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          reference_number: string;
          title: string;
          description: string | null;
          category_id: string;
          department_id: string | null;
          project_id: string | null;
          owner_id: string;
          classification: 'public' | 'internal' | 'confidential' | 'restricted';
          status: 'draft' | 'pending_review' | 'approved' | 'superseded' | 'archived';
          document_date: string;
          tags: string[];
          is_archived: boolean;
          current_version_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_number: string;
          title: string;
          description?: string | null;
          category_id: string;
          department_id?: string | null;
          project_id?: string | null;
          owner_id: string;
          classification?: 'public' | 'internal' | 'confidential' | 'restricted';
          status?: 'draft' | 'pending_review' | 'approved' | 'superseded' | 'archived';
          document_date?: string;
          tags?: string[];
          is_archived?: boolean;
          current_version_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_number?: string;
          title?: string;
          description?: string | null;
          category_id?: string;
          department_id?: string | null;
          project_id?: string | null;
          owner_id?: string;
          classification?: 'public' | 'internal' | 'confidential' | 'restricted';
          status?: 'draft' | 'pending_review' | 'approved' | 'superseded' | 'archived';
          document_date?: string;
          tags?: string[];
          is_archived?: boolean;
          current_version_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_versions: {
        Row: {
          id: string;
          document_id: string;
          version_number: number;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          file_extension: string;
          storage_bucket: string;
          checksum_sha256: string | null;
          change_notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          version_number: number;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          file_extension: string;
          storage_bucket?: string;
          checksum_sha256?: string | null;
          change_notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          version_number?: number;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          file_extension?: string;
          storage_bucket?: string;
          checksum_sha256?: string | null;
          change_notes?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      document_approvals: {
        Row: {
          id: string;
          document_id: string;
          version_id: string | null;
          reviewer_id: string;
          status: 'approved' | 'rejected' | 'amendments_requested';
          comments: string;
          decided_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          version_id?: string | null;
          reviewer_id: string;
          status: 'approved' | 'rejected' | 'amendments_requested';
          comments: string;
          decided_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          version_id?: string | null;
          reviewer_id?: string;
          status?: 'approved' | 'rejected' | 'amendments_requested';
          comments?: string;
          decided_at?: string;
          created_at?: string;
        };
      };
      document_departments: {
        Row: {
          document_id: string;
          department_id: string;
          shared_at: string;
        };
        Insert: {
          document_id: string;
          department_id: string;
          shared_at?: string;
        };
        Update: {
          document_id?: string;
          department_id?: string;
          shared_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          project_code: string;
          name: string;
          description: string | null;
          funder: string;
          start_date: string;
          end_date: string;
          status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
          currency: string;
          total_budget: number;
          department_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_code: string;
          name: string;
          description?: string | null;
          funder: string;
          start_date: string;
          end_date: string;
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
          currency?: string;
          total_budget?: number;
          department_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_code?: string;
          name?: string;
          description?: string | null;
          funder?: string;
          start_date?: string;
          end_date?: string;
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
          currency?: string;
          total_budget?: number;
          department_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          project_role: 'manager' | 'coordinator' | 'officer' | 'viewer';
          assigned_at: string;
          assigned_by: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          project_role: 'manager' | 'coordinator' | 'officer' | 'viewer';
          assigned_at?: string;
          assigned_by?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          project_role?: 'manager' | 'coordinator' | 'officer' | 'viewer';
          assigned_at?: string;
          assigned_by?: string | null;
        };
      };
      activities: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          activity_date: string;
          location: string | null;
          participants_count: number;
          progress: string;
          challenges: string | null;
          follow_up_actions: string | null;
          submission_status: 'draft' | 'submitted' | 'approved' | 'returned_for_correction';
          submitted_by: string;
          submitted_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_comments: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          activity_date: string;
          location?: string | null;
          participants_count?: number;
          progress: string;
          challenges?: string | null;
          follow_up_actions?: string | null;
          submission_status?: 'draft' | 'submitted' | 'approved' | 'returned_for_correction';
          submitted_by: string;
          submitted_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_comments?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          activity_date?: string;
          location?: string | null;
          participants_count?: number;
          progress?: string;
          challenges?: string | null;
          follow_up_actions?: string | null;
          submission_status?: 'draft' | 'submitted' | 'approved' | 'returned_for_correction';
          submitted_by?: string;
          submitted_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_comments?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_documents: {
        Row: {
          id: string;
          activity_id: string;
          document_id: string;
          attached_at: string;
          attached_by: string | null;
        };
        Insert: {
          id?: string;
          activity_id: string;
          document_id: string;
          attached_at?: string;
          attached_by?: string | null;
        };
        Update: {
          id?: string;
          activity_id?: string;
          document_id?: string;
          attached_at?: string;
          attached_by?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          activity_id: string | null;
          title: string;
          description: string | null;
          assigned_to: string | null;
          due_date: string | null;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status: 'todo' | 'in_progress' | 'completed';
          completed_at: string | null;
          completed_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          activity_id?: string | null;
          title: string;
          description?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'todo' | 'in_progress' | 'completed';
          completed_at?: string | null;
          completed_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          activity_id?: string | null;
          title?: string;
          description?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'todo' | 'in_progress' | 'completed';
          completed_at?: string | null;
          completed_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_reports: {
        Row: {
          id: string;
          project_id: string;
          report_type: 'monthly' | 'quarterly' | 'annual' | 'donor' | 'milestone';
          title: string;
          reporting_period_start: string;
          reporting_period_end: string;
          summary: string;
          achievements: string | null;
          challenges: string | null;
          recommendations: string | null;
          status: 'draft' | 'submitted' | 'approved';
          submitted_by: string;
          submitted_at: string | null;
          document_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          report_type: 'monthly' | 'quarterly' | 'annual' | 'donor' | 'milestone';
          title: string;
          reporting_period_start: string;
          reporting_period_end: string;
          summary: string;
          achievements?: string | null;
          challenges?: string | null;
          recommendations?: string | null;
          status?: 'draft' | 'submitted' | 'approved';
          submitted_by: string;
          submitted_at?: string | null;
          document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          report_type?: 'monthly' | 'quarterly' | 'annual' | 'donor' | 'milestone';
          title?: string;
          reporting_period_start?: string;
          reporting_period_end?: string;
          summary?: string;
          achievements?: string | null;
          challenges?: string | null;
          recommendations?: string | null;
          status?: 'draft' | 'submitted' | 'approved';
          submitted_by?: string;
          submitted_at?: string | null;
          document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_budgets: {
        Row: {
          id: string;
          project_id: string;
          currency: string;
          total_allocated: number;
          total_spent: number;
          total_committed: number;
          last_reviewed_at: string;
          last_reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          currency?: string;
          total_allocated?: number;
          total_spent?: number;
          total_committed?: number;
          last_reviewed_at?: string;
          last_reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          currency?: string;
          total_allocated?: number;
          total_spent?: number;
          total_committed?: number;
          last_reviewed_at?: string;
          last_reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          project_id: string | null;
          fiscal_year: string;
          code: string;
          name: string;
          category: string;
          allocated_amount: number;
          currency: string;
          status: 'draft' | 'active' | 'closed' | 'archived';
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          fiscal_year: string;
          code: string;
          name: string;
          category: string;
          allocated_amount?: number;
          currency?: string;
          status?: 'draft' | 'active' | 'closed' | 'archived';
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          fiscal_year?: string;
          code?: string;
          name?: string;
          category?: string;
          allocated_amount?: number;
          currency?: string;
          status?: 'draft' | 'active' | 'closed' | 'archived';
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      financial_requests: {
        Row: {
          id: string;
          request_number: string;
          project_id: string | null;
          budget_id: string | null;
          requester_id: string;
          request_type:
            | 'activity_expense'
            | 'procurement'
            | 'travel_per_diem'
            | 'operational'
            | 'petty_cash'
            | 'consultancy';
          title: string;
          purpose: string;
          total_amount: number;
          currency: string;
          status:
            | 'draft'
            | 'submitted'
            | 'under_review'
            | 'approved'
            | 'partially_paid'
            | 'paid'
            | 'returned'
            | 'rejected'
            | 'cancelled';
          priority: 'low' | 'normal' | 'urgent';
          due_date: string | null;
          approved_amount: number | null;
          paid_amount: number;
          submitted_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_number: string;
          project_id?: string | null;
          budget_id?: string | null;
          requester_id: string;
          request_type:
            | 'activity_expense'
            | 'procurement'
            | 'travel_per_diem'
            | 'operational'
            | 'petty_cash'
            | 'consultancy';
          title: string;
          purpose: string;
          total_amount: number;
          currency?: string;
          status?:
            | 'draft'
            | 'submitted'
            | 'under_review'
            | 'approved'
            | 'partially_paid'
            | 'paid'
            | 'returned'
            | 'rejected'
            | 'cancelled';
          priority?: 'low' | 'normal' | 'urgent';
          due_date?: string | null;
          approved_amount?: number | null;
          paid_amount?: number;
          submitted_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_number?: string;
          project_id?: string | null;
          budget_id?: string | null;
          requester_id?: string;
          request_type?:
            | 'activity_expense'
            | 'procurement'
            | 'travel_per_diem'
            | 'operational'
            | 'petty_cash'
            | 'consultancy';
          title?: string;
          purpose?: string;
          total_amount?: number;
          currency?: string;
          status?:
            | 'draft'
            | 'submitted'
            | 'under_review'
            | 'approved'
            | 'partially_paid'
            | 'paid'
            | 'returned'
            | 'rejected'
            | 'cancelled';
          priority?: 'low' | 'normal' | 'urgent';
          due_date?: string | null;
          approved_amount?: number | null;
          paid_amount?: number;
          submitted_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      financial_request_lines: {
        Row: {
          id: string;
          request_id: string;
          line_number: number;
          description: string;
          quantity: number;
          unit_cost: number;
          total_cost: number;
          budget_category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          line_number: number;
          description: string;
          quantity?: number;
          unit_cost: number;
          total_cost: number;
          budget_category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          line_number?: number;
          description?: string;
          quantity?: number;
          unit_cost?: number;
          total_cost?: number;
          budget_category?: string | null;
          created_at?: string;
        };
      };
      approval_workflows: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      approval_steps: {
        Row: {
          id: string;
          workflow_id: string;
          step_number: number;
          step_name: string;
          required_role: string;
          min_amount: number;
          max_amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          step_number: number;
          step_name: string;
          required_role: string;
          min_amount?: number;
          max_amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          step_number?: number;
          step_name?: string;
          required_role?: string;
          min_amount?: number;
          max_amount?: number | null;
          created_at?: string;
        };
      };
      approval_instances: {
        Row: {
          id: string;
          request_id: string;
          workflow_id: string;
          current_step_number: number;
          status: 'in_progress' | 'completed' | 'rejected' | 'returned';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          workflow_id: string;
          current_step_number?: number;
          status?: 'in_progress' | 'completed' | 'rejected' | 'returned';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          workflow_id?: string;
          current_step_number?: number;
          status?: 'in_progress' | 'completed' | 'rejected' | 'returned';
          created_at?: string;
          updated_at?: string;
        };
      };
      approval_events: {
        Row: {
          id: string;
          instance_id: string;
          step_number: number;
          action: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'returned';
          actor_id: string;
          actor_role: string;
          comments: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          instance_id: string;
          step_number: number;
          action: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'returned';
          actor_id: string;
          actor_role: string;
          comments?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          instance_id?: string;
          step_number?: number;
          action?: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'returned';
          actor_id?: string;
          actor_role?: string;
          comments?: string | null;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          transaction_number: string;
          request_id: string;
          payment_method: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque';
          payment_reference: string;
          amount: number;
          currency: string;
          payment_date: string;
          payee_name: string;
          payee_contact: string | null;
          bank_name: string | null;
          bank_account_number: string | null;
          disbursed_by: string;
          document_id: string | null;
          notes: string | null;
          status: 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_number: string;
          request_id: string;
          payment_method: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque';
          payment_reference: string;
          amount: number;
          currency?: string;
          payment_date: string;
          payee_name: string;
          payee_contact?: string | null;
          bank_name?: string | null;
          bank_account_number?: string | null;
          disbursed_by: string;
          document_id?: string | null;
          notes?: string | null;
          status?: 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transaction_number?: string;
          request_id?: string;
          payment_method?: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque';
          payment_reference?: string;
          amount?: number;
          currency?: string;
          payment_date?: string;
          payee_name?: string;
          payee_contact?: string | null;
          bank_name?: string | null;
          bank_account_number?: string | null;
          disbursed_by?: string;
          document_id?: string | null;
          notes?: string | null;
          status?: 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      request_documents: {
        Row: {
          request_id: string;
          document_id: string;
          document_type: 'invoice' | 'receipt' | 'terms_of_reference' | 'quotation' | 'voucher' | 'other';
          attached_at: string;
        };
        Insert: {
          request_id: string;
          document_id: string;
          document_type: 'invoice' | 'receipt' | 'terms_of_reference' | 'quotation' | 'voucher' | 'other';
          attached_at?: string;
        };
        Update: {
          request_id?: string;
          document_id?: string;
          document_type?: 'invoice' | 'receipt' | 'terms_of_reference' | 'quotation' | 'voucher' | 'other';
          attached_at?: string;
        };
      };
      staff_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          staff_number: string;
          full_name: string;
          email: string | null;
          phone_number: string | null;
          job_title: string;
          department_id: string | null;
          employment_status: 'active' | 'probation' | 'on_leave' | 'suspended' | 'terminated';
          contract_type: 'permanent' | 'fixed_term' | 'consultant' | 'volunteer' | 'intern';
          start_date: string;
          end_date: string | null;
          supervisor_id: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          staff_number: string;
          full_name: string;
          email?: string | null;
          phone_number?: string | null;
          job_title: string;
          department_id?: string | null;
          employment_status?: 'active' | 'probation' | 'on_leave' | 'suspended' | 'terminated';
          contract_type?: 'permanent' | 'fixed_term' | 'consultant' | 'volunteer' | 'intern';
          start_date: string;
          end_date?: string | null;
          supervisor_id?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          staff_number?: string;
          full_name?: string;
          email?: string | null;
          phone_number?: string | null;
          job_title?: string;
          department_id?: string | null;
          employment_status?: 'active' | 'probation' | 'on_leave' | 'suspended' | 'terminated';
          contract_type?: 'permanent' | 'fixed_term' | 'consultant' | 'volunteer' | 'intern';
          start_date?: string;
          end_date?: string | null;
          supervisor_id?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_documents: {
        Row: {
          id: string;
          staff_id: string;
          document_id: string;
          document_type: 'contract' | 'id_copy' | 'cv' | 'certificate' | 'job_description' | 'performance_review' | 'other';
          notes: string | null;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          document_id: string;
          document_type: 'contract' | 'id_copy' | 'cv' | 'certificate' | 'job_description' | 'performance_review' | 'other';
          notes?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          document_id?: string;
          document_type?: 'contract' | 'id_copy' | 'cv' | 'certificate' | 'job_description' | 'performance_review' | 'other';
          notes?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
      };
      leave_types: {
        Row: {
          id: string;
          code: string;
          name_en: string;
          name_sw: string;
          description_en: string | null;
          description_sw: string | null;
          days_allowed_per_year: number;
          requires_attachment: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name_en: string;
          name_sw: string;
          description_en?: string | null;
          description_sw?: string | null;
          days_allowed_per_year?: number;
          requires_attachment?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name_en?: string;
          name_sw?: string;
          description_en?: string | null;
          description_sw?: string | null;
          days_allowed_per_year?: number;
          requires_attachment?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
      };
      leave_balances: {
        Row: {
          id: string;
          staff_id: string;
          leave_type_id: string;
          year: number;
          allocated_days: number;
          used_days: number;
          pending_days: number;
          remaining_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          leave_type_id: string;
          year: number;
          allocated_days?: number;
          used_days?: number;
          pending_days?: number;
          remaining_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          leave_type_id?: string;
          year?: number;
          allocated_days?: number;
          used_days?: number;
          pending_days?: number;
          remaining_days?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      leave_requests: {
        Row: {
          id: string;
          request_number: string;
          staff_id: string;
          leave_type_id: string;
          start_date: string;
          end_date: string;
          days_requested: number;
          reason: string;
          handover_staff_id: string | null;
          status: 'pending' | 'approved' | 'rejected' | 'cancelled';
          decision_by: string | null;
          decision_at: string | null;
          decision_notes: string | null;
          attachment_doc_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_number: string;
          staff_id: string;
          leave_type_id: string;
          start_date: string;
          end_date: string;
          days_requested: number;
          reason: string;
          handover_staff_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
          decision_by?: string | null;
          decision_at?: string | null;
          decision_notes?: string | null;
          attachment_doc_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_number?: string;
          staff_id?: string;
          leave_type_id?: string;
          start_date?: string;
          end_date?: string;
          days_requested?: number;
          reason?: string;
          handover_staff_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
          decision_by?: string | null;
          decision_at?: string | null;
          decision_notes?: string | null;
          attachment_doc_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_checklists: {
        Row: {
          id: string;
          staff_id: string;
          checklist_type: 'onboarding' | 'offboarding';
          item_key: string;
          title_en: string;
          title_sw: string;
          is_completed: boolean;
          completed_at: string | null;
          completed_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          checklist_type: 'onboarding' | 'offboarding';
          item_key: string;
          title_en: string;
          title_sw: string;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          checklist_type?: 'onboarding' | 'offboarding';
          item_key?: string;
          title_en?: string;
          title_sw?: string;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      correspondence: {
        Row: {
          id: string;
          reference_number: string;
          direction: 'incoming' | 'outgoing';
          sender: string;
          recipient: string;
          subject: string;
          correspondence_date: string;
          category: 'donor' | 'government' | 'legal' | 'partner' | 'community' | 'general';
          project_id: string | null;
          document_id: string | null;
          status: 'received' | 'draft' | 'under_review' | 'approved' | 'dispatched' | 'archived';
          confidentiality_level: 'public' | 'internal' | 'confidential';
          notes: string | null;
          registered_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_number: string;
          direction: 'incoming' | 'outgoing';
          sender: string;
          recipient: string;
          subject: string;
          correspondence_date: string;
          category: 'donor' | 'government' | 'legal' | 'partner' | 'community' | 'general';
          project_id?: string | null;
          document_id?: string | null;
          status?: 'received' | 'draft' | 'under_review' | 'approved' | 'dispatched' | 'archived';
          confidentiality_level?: 'public' | 'internal' | 'confidential';
          notes?: string | null;
          registered_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_number?: string;
          direction?: 'incoming' | 'outgoing';
          sender?: string;
          recipient?: string;
          subject?: string;
          correspondence_date?: string;
          category?: 'donor' | 'government' | 'legal' | 'partner' | 'community' | 'general';
          project_id?: string | null;
          document_id?: string | null;
          status?: 'received' | 'draft' | 'under_review' | 'approved' | 'dispatched' | 'archived';
          confidentiality_level?: 'public' | 'internal' | 'confidential';
          notes?: string | null;
          registered_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meetings: {
        Row: {
          id: string;
          meeting_number: string;
          title: string;
          meeting_type: 'board' | 'management' | 'staff' | 'project' | 'donor' | 'committee';
          meeting_date: string;
          location: string;
          chairperson_id: string | null;
          secretary_id: string | null;
          minutes_document_id: string | null;
          status: 'scheduled' | 'in_progress' | 'completed' | 'adjourned' | 'cancelled';
          confidentiality_level: 'public' | 'internal' | 'confidential';
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_number: string;
          title: string;
          meeting_type: 'board' | 'management' | 'staff' | 'project' | 'donor' | 'committee';
          meeting_date: string;
          location: string;
          chairperson_id?: string | null;
          secretary_id?: string | null;
          minutes_document_id?: string | null;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'adjourned' | 'cancelled';
          confidentiality_level?: 'public' | 'internal' | 'confidential';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meeting_number?: string;
          title?: string;
          meeting_type?: 'board' | 'management' | 'staff' | 'project' | 'donor' | 'committee';
          meeting_date?: string;
          location?: string;
          chairperson_id?: string | null;
          secretary_id?: string | null;
          minutes_document_id?: string | null;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'adjourned' | 'cancelled';
          confidentiality_level?: 'public' | 'internal' | 'confidential';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meeting_attendees: {
        Row: {
          id: string;
          meeting_id: string;
          user_id: string | null;
          external_name: string | null;
          email: string | null;
          role: string;
          attended: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          user_id?: string | null;
          external_name?: string | null;
          email?: string | null;
          role?: string;
          attended?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          user_id?: string | null;
          external_name?: string | null;
          email?: string | null;
          role?: string;
          attended?: boolean;
          created_at?: string;
        };
      };
      meeting_decisions: {
        Row: {
          id: string;
          meeting_id: string;
          decision_number: string;
          title: string;
          description: string;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          decision_number: string;
          title: string;
          description: string;
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          decision_number?: string;
          title?: string;
          description?: string;
          category?: string;
          created_at?: string;
        };
      };
      meeting_actions: {
        Row: {
          id: string;
          meeting_id: string;
          decision_id: string | null;
          action_number: string;
          task_description: string;
          assigned_to: string | null;
          assigned_to_name: string | null;
          due_date: string;
          status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
          completion_notes: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          decision_id?: string | null;
          action_number: string;
          task_description: string;
          assigned_to?: string | null;
          assigned_to_name?: string | null;
          due_date: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
          completion_notes?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          decision_id?: string | null;
          action_number?: string;
          task_description?: string;
          assigned_to?: string | null;
          assigned_to_name?: string | null;
          due_date?: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
          completion_notes?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      has_role: {
        Args: { requested_role: string };
        Returns: boolean;
      };
      has_permission: {
        Args: { requested_permission: string };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id?: string | null;
          p_metadata?: Json;
        };
        Returns: string;
      };
      generate_document_ref: {
        Args: {
          p_category_code: string;
          p_date?: string;
        };
        Returns: string;
      };
    };
  };
}

export type Department = Database['public']['Tables']['departments']['Row'];
export type Role = Database['public']['Tables']['roles']['Row'];
export type Permission = Database['public']['Tables']['permissions']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRoleAssignment = Database['public']['Tables']['user_roles']['Row'];
export type AuditLogEntry = Database['public']['Tables']['audit_logs']['Row'];
export type DocumentCategoryRow = Database['public']['Tables']['document_categories']['Row'];
export type DocumentRow = Database['public']['Tables']['documents']['Row'];
export type DocumentVersionRow = Database['public']['Tables']['document_versions']['Row'];
export type DocumentApprovalRow = Database['public']['Tables']['document_approvals']['Row'];
export type DocumentDepartmentRow = Database['public']['Tables']['document_departments']['Row'];
export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectMemberRow = Database['public']['Tables']['project_members']['Row'];
export type ActivityRow = Database['public']['Tables']['activities']['Row'];
export type ActivityDocumentRow = Database['public']['Tables']['activity_documents']['Row'];
export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type ProjectReportRow = Database['public']['Tables']['project_reports']['Row'];
export type ProjectBudgetRow = Database['public']['Tables']['project_budgets']['Row'];
export type BudgetRow = Database['public']['Tables']['budgets']['Row'];
export type FinancialRequestRow = Database['public']['Tables']['financial_requests']['Row'];
export type FinancialRequestLineRow = Database['public']['Tables']['financial_request_lines']['Row'];
export type ApprovalWorkflowRow = Database['public']['Tables']['approval_workflows']['Row'];
export type ApprovalStepRow = Database['public']['Tables']['approval_steps']['Row'];
export type ApprovalInstanceRow = Database['public']['Tables']['approval_instances']['Row'];
export type ApprovalEventRow = Database['public']['Tables']['approval_events']['Row'];
export type TransactionRow = Database['public']['Tables']['transactions']['Row'];
export type RequestDocumentRow = Database['public']['Tables']['request_documents']['Row'];
export type StaffProfileRow = Database['public']['Tables']['staff_profiles']['Row'];
export type StaffDocumentRow = Database['public']['Tables']['staff_documents']['Row'];
export type LeaveTypeRow = Database['public']['Tables']['leave_types']['Row'];
export type LeaveBalanceRow = Database['public']['Tables']['leave_balances']['Row'];
export type LeaveRequestRow = Database['public']['Tables']['leave_requests']['Row'];
export type StaffChecklistRow = Database['public']['Tables']['staff_checklists']['Row'];
export type CorrespondenceRow = Database['public']['Tables']['correspondence']['Row'];
export type MeetingRow = Database['public']['Tables']['meetings']['Row'];
export type MeetingAttendeeRow = Database['public']['Tables']['meeting_attendees']['Row'];
export type MeetingDecisionRow = Database['public']['Tables']['meeting_decisions']['Row'];
export type MeetingActionRow = Database['public']['Tables']['meeting_actions']['Row'];
