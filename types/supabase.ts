export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      an_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          created_at_png: string | null
          description: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          created_at_png?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          created_at_png?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      certification_renewal_plans: {
        Row: {
          check_type_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          original_expiry_date: string
          pair_group_id: string | null
          paired_pilot_id: string | null
          pilot_id: string
          planned_renewal_date: string
          planned_roster_period: string
          priority: number
          renewal_window_end: string
          renewal_window_start: string
          status: string
          updated_at: string
        }
        Insert: {
          check_type_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          original_expiry_date: string
          pair_group_id?: string | null
          paired_pilot_id?: string | null
          pilot_id: string
          planned_renewal_date: string
          planned_roster_period: string
          priority?: number
          renewal_window_end: string
          renewal_window_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          check_type_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          original_expiry_date?: string
          pair_group_id?: string | null
          paired_pilot_id?: string | null
          pilot_id?: string
          planned_renewal_date?: string
          planned_roster_period?: string
          priority?: number
          renewal_window_end?: string
          renewal_window_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_renewal_plans_check_type_id_fkey"
            columns: ["check_type_id"]
            isOneToOne: false
            referencedRelation: "check_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_paired_pilot_id_fkey"
            columns: ["paired_pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_paired_pilot_id_fkey"
            columns: ["paired_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_paired_pilot_id_fkey"
            columns: ["paired_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_paired_pilot_id_fkey"
            columns: ["paired_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_paired_pilot_id_fkey"
            columns: ["paired_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_paired_pilot_id_fkey"
            columns: ["paired_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_paired_pilot_id_fkey"
            columns: ["paired_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_paired_pilot_id_fkey"
            columns: ["paired_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_paired_pilot_id_fkey"
            columns: ["paired_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_renewal_plans_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["id"]
          },
        ]
      }
      check_types: {
        Row: {
          category: string | null
          check_code: string
          check_description: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          check_code: string
          check_description: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          check_code?: string
          check_description?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      digital_forms: {
        Row: {
          allowed_roles: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          form_schema: Json
          form_type: string
          id: string
          is_active: boolean | null
          requires_approval: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          form_schema: Json
          form_type: string
          id?: string
          is_active?: boolean | null
          requires_approval?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          form_schema?: Json
          form_type?: string
          id?: string
          is_active?: boolean | null
          requires_approval?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_audit_log: {
        Row: {
          action: string
          field_changed: string | null
          id: string
          matter_id: string
          new_value: string | null
          old_value: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          action: string
          field_changed?: string | null
          id?: string
          matter_id: string
          new_value?: string | null
          old_value?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          action?: string
          field_changed?: string | null
          id?: string
          matter_id?: string
          new_value?: string | null
          old_value?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_audit_log_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "disciplinary_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_audit_log_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["matter_id"]
          },
          {
            foreignKeyName: "disciplinary_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_matters: {
        Row: {
          aircraft_registration: string | null
          assigned_to: string | null
          corrective_actions: string | null
          created_at: string | null
          description: string
          due_date: string | null
          evidence_files: Json | null
          flight_number: string | null
          id: string
          impact_on_operations: string | null
          incident_date: string
          incident_type_id: string
          location: string | null
          notification_date: string | null
          pilot_id: string
          regulatory_body: string | null
          regulatory_notification_required: boolean | null
          reported_by: string
          reported_date: string | null
          resolution_notes: string | null
          resolved_by: string | null
          resolved_date: string | null
          severity: string
          status: string
          title: string
          updated_at: string | null
          witnesses: Json | null
        }
        Insert: {
          aircraft_registration?: string | null
          assigned_to?: string | null
          corrective_actions?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          evidence_files?: Json | null
          flight_number?: string | null
          id?: string
          impact_on_operations?: string | null
          incident_date: string
          incident_type_id: string
          location?: string | null
          notification_date?: string | null
          pilot_id: string
          regulatory_body?: string | null
          regulatory_notification_required?: boolean | null
          reported_by: string
          reported_date?: string | null
          resolution_notes?: string | null
          resolved_by?: string | null
          resolved_date?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string | null
          witnesses?: Json | null
        }
        Update: {
          aircraft_registration?: string | null
          assigned_to?: string | null
          corrective_actions?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          evidence_files?: Json | null
          flight_number?: string | null
          id?: string
          impact_on_operations?: string | null
          incident_date?: string
          incident_type_id?: string
          location?: string | null
          notification_date?: string | null
          pilot_id?: string
          regulatory_body?: string | null
          regulatory_notification_required?: boolean | null
          reported_by?: string
          reported_date?: string | null
          resolution_notes?: string | null
          resolved_by?: string | null
          resolved_date?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
          witnesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_matters_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_matters_incident_type_id_fkey"
            columns: ["incident_type_id"]
            isOneToOne: false
            referencedRelation: "incident_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_matters_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_matters_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "disciplinary_matters_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_matters_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_matters_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_matters_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_matters_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "disciplinary_matters_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_matters_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_matters_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_matters_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback_categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_by_type: string | null
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean | null
          is_default: boolean | null
          name: string
          post_count: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          created_by_type?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          name: string
          post_count?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          created_by_type?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          name?: string
          post_count?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pending_pilot_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pilot_users"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_requests: {
        Row: {
          created_at: string | null
          description: string
          flight_date: string
          id: string
          pilot_id: string
          pilot_user_id: string | null
          reason: string | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_comments: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          flight_date: string
          id?: string
          pilot_id: string
          pilot_user_id?: string | null
          reason?: string | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_comments?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          flight_date?: string
          id?: string
          pilot_id?: string
          pilot_user_id?: string | null
          reason?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_comments?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "flight_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "flight_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_requests_pilot_user_id_fkey"
            columns: ["pilot_user_id"]
            isOneToOne: false
            referencedRelation: "pending_pilot_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_requests_pilot_user_id_fkey"
            columns: ["pilot_user_id"]
            isOneToOne: false
            referencedRelation: "pilot_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          requires_review: boolean | null
          severity_level: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          requires_review?: boolean | null
          severity_level?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          requires_review?: boolean | null
          severity_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_bids: {
        Row: {
          alternative_dates: string | null
          created_at: string | null
          id: string
          notes: string | null
          pilot_id: string
          preferred_dates: string
          priority: string
          reason: string
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roster_period_code: string
          status: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          alternative_dates?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          pilot_id: string
          preferred_dates: string
          priority: string
          reason: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_period_code: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          alternative_dates?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          pilot_id?: string
          preferred_dates?: string
          priority?: string
          reason?: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_period_code?: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_bids_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_bids_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "leave_bids_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_bids_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_bids_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_bids_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_bids_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "leave_bids_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_bids_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_bids_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string | null
          days_count: number
          end_date: string
          id: string
          is_late_request: boolean | null
          pilot_id: string | null
          pilot_user_id: string | null
          reason: string | null
          request_date: string | null
          request_method: string | null
          request_type: string | null
          review_comments: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roster_period: string | null
          start_date: string
          status: string | null
          submission_type: string | null
        }
        Insert: {
          created_at?: string | null
          days_count: number
          end_date: string
          id?: string
          is_late_request?: boolean | null
          pilot_id?: string | null
          pilot_user_id?: string | null
          reason?: string | null
          request_date?: string | null
          request_method?: string | null
          request_type?: string | null
          review_comments?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_period?: string | null
          start_date: string
          status?: string | null
          submission_type?: string | null
        }
        Update: {
          created_at?: string | null
          days_count?: number
          end_date?: string
          id?: string
          is_late_request?: boolean | null
          pilot_id?: string | null
          pilot_user_id?: string | null
          reason?: string | null
          request_date?: string | null
          request_method?: string | null
          request_type?: string | null
          review_comments?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_period?: string | null
          start_date?: string
          status?: string | null
          submission_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_user_id_fkey"
            columns: ["pilot_user_id"]
            isOneToOne: false
            referencedRelation: "pending_pilot_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_user_id_fkey"
            columns: ["pilot_user_id"]
            isOneToOne: false
            referencedRelation: "pilot_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_checks: {
        Row: {
          check_type_id: string
          created_at: string
          expiry_date: string | null
          id: string
          pilot_id: string
          updated_at: string
        }
        Insert: {
          check_type_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          pilot_id: string
          updated_at?: string
        }
        Update: {
          check_type_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          pilot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_checks_check_type_id_fkey"
            columns: ["check_type_id"]
            isOneToOne: false
            referencedRelation: "check_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_users: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          date_of_birth: string | null
          denial_reason: string | null
          email: string
          employee_id: string | null
          first_name: string
          id: string
          last_login_at: string | null
          last_name: string
          phone_number: string | null
          rank: string | null
          registration_approved: boolean | null
          registration_date: string | null
          seniority_number: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          denial_reason?: string | null
          email: string
          employee_id?: string | null
          first_name: string
          id: string
          last_login_at?: string | null
          last_name: string
          phone_number?: string | null
          rank?: string | null
          registration_approved?: boolean | null
          registration_date?: string | null
          seniority_number?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          denial_reason?: string | null
          email?: string
          employee_id?: string | null
          first_name?: string
          id?: string
          last_login_at?: string | null
          last_name?: string
          phone_number?: string | null
          rank?: string | null
          registration_approved?: boolean | null
          registration_date?: string | null
          seniority_number?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_users_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "detailed_expiring_checks"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "expiring_checks"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "expiring_checks_optimized"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilots"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      pilots: {
        Row: {
          captain_qualifications: Json | null
          commencement_date: string | null
          contract_type: string | null
          contract_type_id: string | null
          created_at: string
          date_of_birth: string | null
          employee_id: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          middle_name: string | null
          nationality: string | null
          passport_expiry: string | null
          passport_number: string | null
          qualification_notes: string | null
          rhs_captain_expiry: string | null
          role: Database["public"]["Enums"]["pilot_role"]
          seniority_number: number | null
          updated_at: string
        }
        Insert: {
          captain_qualifications?: Json | null
          commencement_date?: string | null
          contract_type?: string | null
          contract_type_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          employee_id: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          middle_name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          qualification_notes?: string | null
          rhs_captain_expiry?: string | null
          role: Database["public"]["Enums"]["pilot_role"]
          seniority_number?: number | null
          updated_at?: string
        }
        Update: {
          captain_qualifications?: Json | null
          commencement_date?: string | null
          contract_type?: string | null
          contract_type_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          employee_id?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          middle_name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          qualification_notes?: string | null
          rhs_captain_expiry?: string | null
          role?: Database["public"]["Enums"]["pilot_role"]
          seniority_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pilots_contract_type_id"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
        ]
      }
      renewal_plan_history: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          id: string
          new_date: string | null
          new_roster_period: string | null
          new_status: string | null
          previous_date: string | null
          previous_roster_period: string | null
          previous_status: string | null
          reason: string | null
          renewal_plan_id: string
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_date?: string | null
          new_roster_period?: string | null
          new_status?: string | null
          previous_date?: string | null
          previous_roster_period?: string | null
          previous_status?: string | null
          reason?: string | null
          renewal_plan_id: string
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_date?: string | null
          new_roster_period?: string | null
          new_status?: string | null
          previous_date?: string | null
          previous_roster_period?: string | null
          previous_status?: string | null
          reason?: string | null
          renewal_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_plan_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_plan_history_renewal_plan_id_fkey"
            columns: ["renewal_plan_id"]
            isOneToOne: false
            referencedRelation: "certification_renewal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_period_capacity: {
        Row: {
          created_at: string
          current_allocations: Json
          id: string
          max_pilots_per_category: Json
          period_end_date: string
          period_start_date: string
          roster_period: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_allocations?: Json
          id?: string
          max_pilots_per_category?: Json
          period_end_date: string
          period_start_date: string
          roster_period: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_allocations?: Json
          id?: string
          max_pilots_per_category?: Json
          period_end_date?: string
          period_start_date?: string
          roster_period?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      task_audit_log: {
        Row: {
          action: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          action: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          action?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_audit_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "active_tasks_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_audit_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          attachments: Json | null
          category_id: string | null
          checklist_items: Json | null
          completed_date: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          is_recurring: boolean | null
          parent_task_id: string | null
          priority: string
          progress_percentage: number | null
          recurrence_pattern: Json | null
          related_matter_id: string | null
          related_pilot_id: string | null
          status: string
          tags: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          category_id?: string | null
          checklist_items?: Json | null
          completed_date?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_recurring?: boolean | null
          parent_task_id?: string | null
          priority?: string
          progress_percentage?: number | null
          recurrence_pattern?: Json | null
          related_matter_id?: string | null
          related_pilot_id?: string | null
          status?: string
          tags?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          category_id?: string | null
          checklist_items?: Json | null
          completed_date?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_recurring?: boolean | null
          parent_task_id?: string | null
          priority?: string
          progress_percentage?: number | null
          recurrence_pattern?: Json | null
          related_matter_id?: string | null
          related_pilot_id?: string | null
          status?: string
          tags?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "active_tasks_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_matter_id_fkey"
            columns: ["related_matter_id"]
            isOneToOne: false
            referencedRelation: "disciplinary_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_matter_id_fkey"
            columns: ["related_matter_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["matter_id"]
          },
          {
            foreignKeyName: "tasks_related_pilot_id_fkey"
            columns: ["related_pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_pilot_id_fkey"
            columns: ["related_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "tasks_related_pilot_id_fkey"
            columns: ["related_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_pilot_id_fkey"
            columns: ["related_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_pilot_id_fkey"
            columns: ["related_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_pilot_id_fkey"
            columns: ["related_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_pilot_id_fkey"
            columns: ["related_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "tasks_related_pilot_id_fkey"
            columns: ["related_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_pilot_id_fkey"
            columns: ["related_pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_tasks_dashboard: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          due_date: string | null
          id: string | null
          priority: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
        ]
      }
      captain_qualifications_summary: {
        Row: {
          captain_qualifications: Json | null
          employee_id: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
        }
        Insert: {
          captain_qualifications?: Json | null
          employee_id?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["pilot_role"] | null
        }
        Update: {
          captain_qualifications?: Json | null
          employee_id?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["pilot_role"] | null
        }
        Relationships: []
      }
      compliance_dashboard: {
        Row: {
          expired_checks: number | null
          expiring_soon: number | null
          total_captains: number | null
          total_checks: number | null
          total_first_officers: number | null
          total_pilots: number | null
        }
        Relationships: []
      }
      detailed_expiring_checks: {
        Row: {
          category: string | null
          check_code: string | null
          check_description: string | null
          check_type_id: string | null
          employee_id: string | null
          expiry_date: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          pilot_id: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_checks_check_type_id_fkey"
            columns: ["check_type_id"]
            isOneToOne: false
            referencedRelation: "check_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["id"]
          },
        ]
      }
      expiring_checks: {
        Row: {
          category: string | null
          check_code: string | null
          check_description: string | null
          check_type_id: string | null
          employee_id: string | null
          expiry_date: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          pilot_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_checks_check_type_id_fkey"
            columns: ["check_type_id"]
            isOneToOne: false
            referencedRelation: "check_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["id"]
          },
        ]
      }
      expiring_checks_optimized: {
        Row: {
          check_code: string | null
          check_description: string | null
          employee_id: string | null
          expiry_date: string | null
          id: string | null
          pilot_id: string | null
          pilot_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_pilot_registrations: {
        Row: {
          calculated_seniority: number | null
          commencement_date: string | null
          created_at: string | null
          email: string | null
          employee_id: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          rank: string | null
          registration_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "detailed_expiring_checks"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "expiring_checks"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "expiring_checks_optimized"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_qualification_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_requirements_compliance"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilot_warning_history"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilots"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "pilot_users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "pilots_with_contract_details"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      pilot_checks_overview: {
        Row: {
          checks: Json | null
          employee_id: string | null
          first_name: string | null
          last_name: string | null
          pilot_id: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
        }
        Relationships: []
      }
      pilot_qualification_summary: {
        Row: {
          captain_qualifications: Json | null
          employee_id: string | null
          expired_checks: number | null
          first_name: string | null
          id: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
          total_checks: number | null
        }
        Relationships: []
      }
      pilot_report_summary: {
        Row: {
          commencement_date: string | null
          contract_type_id: string | null
          date_of_birth: string | null
          employee_id: string | null
          expired_checks: number | null
          expiring_soon_checks: number | null
          first_name: string | null
          id: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
          seniority_number: number | null
          total_checks: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pilots_contract_type_id"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_requirements_compliance: {
        Row: {
          employee_id: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
          total_checks: number | null
          valid_checks: number | null
        }
        Relationships: []
      }
      pilot_summary_optimized: {
        Row: {
          commencement_date: string | null
          employee_id: string | null
          expired_count: number | null
          first_name: string | null
          id: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
          seniority_number: number | null
          total_certifications: number | null
        }
        Relationships: []
      }
      pilot_warning_history: {
        Row: {
          created_at: string | null
          employee_id: string | null
          first_name: string | null
          incident_date: string | null
          issued_by_email: string | null
          issued_by_name: string | null
          last_name: string | null
          matter_id: string | null
          matter_status: string | null
          matter_title: string | null
          pilot_id: string | null
          severity: string | null
        }
        Relationships: []
      }
      pilots_with_contract_details: {
        Row: {
          captain_qualifications: Json | null
          commencement_date: string | null
          contract_description: string | null
          contract_name: string | null
          contract_type: string | null
          contract_type_id: string | null
          created_at: string | null
          date_of_birth: string | null
          employee_id: string | null
          first_name: string | null
          id: string | null
          is_active: boolean | null
          last_name: string | null
          middle_name: string | null
          nationality: string | null
          passport_expiry: string | null
          passport_number: string | null
          qualification_notes: string | null
          rhs_captain_expiry: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
          seniority_number: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pilots_contract_type_id"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acknowledge_alert:
        | {
            Args: { acknowledger_email: string; alert_id: string }
            Returns: boolean
          }
        | { Args: { alert_id: string }; Returns: boolean }
      add_crew_check: {
        Args: {
          p_certificate_number?: string
          p_check_type_code: string
          p_completion_date?: string
          p_crew_member_id: string
          p_examiner_name?: string
          p_expiry_date?: string
          p_notes?: string
          p_result?: string
        }
        Returns: string
      }
      alert_level:
        | { Args: { days_until_expiry: number }; Returns: string }
        | { Args: { expiry_date: string }; Returns: string }
      approve_leave_request:
        | {
            Args: {
              p_comments?: string
              p_request_id: string
              p_reviewer_id: string
              p_status: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_approval_notes?: string
              p_approved_by: string
              p_request_id: string
            }
            Returns: boolean
          }
      aus_to_date: { Args: { date_text: string }; Returns: string }
      auth_get_user_role: { Args: never; Returns: string }
      batch_update_certifications: {
        Args: { updates: Json[] }
        Returns: number
      }
      bulk_delete_certifications: {
        Args: { certification_ids: string[] }
        Returns: number
      }
      calculate_check_status:
        | {
            Args: {
              advance_renewal_days?: number
              completion_date: string
              expiry_date: string
              validity_date: string
            }
            Returns: string
          }
        | {
            Args: {
              critical_days?: number
              expiry_date: string
              warning_days?: number
            }
            Returns: string
          }
        | {
            Args: {
              advance_days?: number
              renewal_date: string
              validity_date: string
            }
            Returns: string
          }
        | { Args: { expiry_date: string }; Returns: string }
      calculate_days_remaining: {
        Args: { expiry_date: string }
        Returns: number
      }
      calculate_days_until_expiry: {
        Args: { expiry_date: string }
        Returns: number
      }
      calculate_leave_days: {
        Args: { end_date: string; start_date: string }
        Returns: number
      }
      calculate_optimal_renewal_date: {
        Args: {
          advance_renewal_days?: number
          current_expiry_date: string
          validity_period_months: number
        }
        Returns: string
      }
      calculate_pilot_to_hull_ratio: {
        Args: never
        Returns: {
          active_aircraft: number
          active_pilots: number
          pilots_needed: number
          required_ratio: number
          status: string
          surplus_shortage: number
        }[]
      }
      calculate_required_examiners: { Args: never; Returns: number }
      calculate_required_training_captains: { Args: never; Returns: number }
      calculate_years_in_service:
        | { Args: { pilot_id: string }; Returns: number }
        | { Args: { commencement_date: string }; Returns: number }
      calculate_years_to_retirement:
        | { Args: { pilot_id: string }; Returns: number }
        | { Args: { birth_date: string }; Returns: number }
      can_access_pilot_data: { Args: { pilot_uuid: string }; Returns: boolean }
      check_training_currency: {
        Args: never
        Returns: {
          check_type_code: string
          compliance_status: string
          crew_member_id: string
          days_until_expiry: number
          employee_id: string
          expiry_date: string
          risk_level: string
        }[]
      }
      check_tri_tre_compliance: {
        Args: never
        Returns: {
          total_pilots: number
          total_tre: number
          total_tri: number
          tre_required: number
          tre_status: string
          tre_surplus_shortage: number
          tri_required: number
          tri_status: string
          tri_surplus_shortage: number
        }[]
      }
      cleanup_audit_logs: { Args: never; Returns: number }
      cleanup_old_expiry_alerts: { Args: never; Returns: number }
      create_audit_log: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_new_values?: Json
          p_old_values?: Json
        }
        Returns: undefined
      }
      create_notification:
        | {
            Args: {
              p_link?: string
              p_message: string
              p_metadata?: Json
              p_title: string
              p_type?: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_link?: string
              p_message: string
              p_metadata?: Json
              p_recipient_id: string
              p_recipient_type: string
              p_sender_id: string
              p_title: string
              p_type: string
            }
            Returns: string
          }
      create_pilot_with_certifications: {
        Args: { certifications: Json[]; pilot_data: Json }
        Returns: string
      }
      current_user_email: { Args: never; Returns: string }
      current_user_is_an_admin: { Args: never; Returns: boolean }
      daily_database_maintenance: { Args: never; Returns: Json }
      daily_expiry_maintenance: { Args: never; Returns: Json }
      daily_maintenance: {
        Args: never
        Returns: {
          alerts_generated: number
          maintenance_timestamp: string
          status_updates: number
        }[]
      }
      daily_status_update: {
        Args: never
        Returns: {
          generated_notifications: number
          updated_checks: number
        }[]
      }
      days_until_expiry: { Args: { expiry_date: string }; Returns: number }
      delete_pilot_with_cascade: {
        Args: { p_pilot_id: string }
        Returns: boolean
      }
      excel_date_to_pg_date: { Args: { excel_serial: number }; Returns: string }
      find_check_type_by_code: { Args: { code: string }; Returns: string }
      find_crew_member_by_name: {
        Args: { search_name: string }
        Returns: string
      }
      generate_certification_alerts: { Args: never; Returns: number }
      generate_check_alerts: { Args: never; Returns: number }
      generate_compliance_report: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          affected_crew: number
          compliance_category: string
          critical_events: number
          event_types: Json
          total_events: number
        }[]
      }
      generate_comprehensive_expiry_alerts: { Args: never; Returns: number }
      generate_expiry_alerts: { Args: never; Returns: undefined }
      generate_simplified_expiry_alerts: {
        Args: never
        Returns: {
          alert_level: string
          alert_type: string
          crew_member_id: string
          days_until_expiry: number
          description: string
          expiry_date: string
          title: string
        }[]
      }
      get_certification_compliance_data: {
        Args: never
        Returns: {
          compliance_rate: number
          critical_alerts: number
          expired_certifications: number
          expiring_soon: number
          total_certifications: number
          valid_certifications: number
        }[]
      }
      get_certification_stats: {
        Args: never
        Returns: {
          critical_alerts: number
          expired_certifications: number
          expiring_soon: number
          total_certifications: number
          valid_certifications: number
        }[]
      }
      get_check_category_distribution: {
        Args: never
        Returns: {
          category: string
          count: number
        }[]
      }
      get_check_status: {
        Args: { expiry_date: string }
        Returns: Database["public"]["Enums"]["check_status"]
      }
      get_crew_audit_trail: {
        Args: { crew_member_uuid: string; days_back?: number }
        Returns: {
          changed_fields: string[]
          compliance_category: string
          details: Json
          operation_timestamp: string
          operation_type: string
          regulatory_impact: boolean
          table_name: string
          user_email: string
        }[]
      }
      get_crew_expiry_summary: {
        Args: { crew_member_uuid: string }
        Returns: {
          compliance_status: string
          crew_member_id: string
          critical_count: number
          days_to_next_expiry: number
          employee_id: string
          expired_count: number
          next_expiry_date: string
          next_expiry_type: string
          pilot_name: string
          total_expiries: number
          valid_count: number
          warning_count: number
        }[]
      }
      get_crew_member_expiring_items: {
        Args: { p_crew_member_id: string; p_days_ahead?: number }
        Returns: {
          days_until_expiry: number
          description: string
          expiry_date: string
          expiry_type: string
          reference_id: string
          reference_table: string
          status: string
        }[]
      }
      get_current_alert_severity_and_type: {
        Args: { days_remaining: number }
        Returns: {
          alert_type: string
          severity: string
          should_show: boolean
        }[]
      }
      get_current_pilot_id: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_dashboard_metrics: { Args: never; Returns: Json }
      get_database_performance_metrics: {
        Args: never
        Returns: {
          metric_name: string
          metric_unit: string
          metric_value: number
          status: string
        }[]
      }
      get_expiring_checks: {
        Args: { days_ahead?: number }
        Returns: {
          check_code: string
          check_description: string
          check_id: string
          days_remaining: number
          employee_id: string
          expiry_date: string
          pilot_id: string
          pilot_name: string
          priority: string
          status: string
        }[]
      }
      get_expiry_statistics: {
        Args: never
        Returns: {
          expired_count: number
          expiring_in_60_days: number
          upcoming_renewals: number
        }[]
      }
      get_fleet_compliance_stats: {
        Args: never
        Returns: {
          fully_compliant_pilots: number
          overall_compliance_percentage: number
          pilots_with_critical: number
          pilots_with_expired: number
          pilots_with_warnings: number
          total_pilots: number
        }[]
      }
      get_fleet_expiry_statistics: {
        Args: never
        Returns: {
          avg_days_to_next_expiry: number
          critical_expiries: number
          expired_expiries: number
          expiries_next_30_days: number
          expiries_next_60_days: number
          expiries_next_90_days: number
          pilots_with_critical: number
          pilots_with_expired: number
          pilots_with_warnings: number
          total_expiries: number
          total_pilots: number
          warning_expiries: number
        }[]
      }
      get_monthly_expiry_data: {
        Args: never
        Returns: {
          count: number
          month: string
        }[]
      }
      get_pending_pilot_registrations: {
        Args: never
        Returns: {
          approved_at: string
          approved_by: string
          created_at: string
          email: string
          employee_id: string
          first_name: string
          id: string
          last_login_at: string
          last_name: string
          rank: string
          registration_approved: boolean
          registration_date: string
          seniority_number: number
          updated_at: string
        }[]
      }
      get_pilot_check_types: {
        Args: { pilot_uuid: string }
        Returns: {
          check_type_code: string
          check_type_id: string
          check_type_name: string
          completion_date: string
          created_at: string
          expiry_date: string
          notes: string
          renewal_date: string
          status: string
          updated_at: string
          validity_date: string
        }[]
      }
      get_pilot_compliance_stats: {
        Args: { pilot_uuid: string }
        Returns: {
          compliance_percentage: number
          critical_checks: number
          expired_checks: number
          total_checks: number
          valid_checks: number
          warning_checks: number
        }[]
      }
      get_pilot_dashboard_data: {
        Args: never
        Returns: {
          active_pilots: number
          critical_alerts: number
          examiners: number
          expiring_soon: number
          first_officers: number
          line_captains: number
          total_pilots: number
          training_captains: number
        }[]
      }
      get_pilot_data_with_checks: {
        Args: never
        Returns: {
          completed_checks: number
          compliance_percentage: number
          display_name: string
          email: string
          employee_id: string
          employee_status: string
          full_name: string
          hire_date: string
          is_tre: boolean
          is_tri: boolean
          medical_certificate_expiry: string
          nationality: string
          passport_expiry_date: string
          pilot_id: string
          pilot_license_expiry: string
          pilot_license_type: string
          role_code: string
          total_required_checks: number
        }[]
      }
      get_pilot_details: {
        Args: { pilot_uuid: string }
        Returns: {
          created_at: string
          display_name: string
          email: string
          first_name: string
          full_name: string
          is_tre: boolean
          is_tri: boolean
          last_name: string
          middle_name: string
          nationality: string
          notes: string
          passport_expiry_date: string
          passport_issue_date: string
          passport_number: string
          phone: string
          pilot_id: string
          role_code: string
          status: string
          updated_at: string
        }[]
      }
      get_pilot_expiries: {
        Args: never
        Returns: {
          expiry_date: string
          expiry_type: string
          pilot_id: string
          pilot_name: string
        }[]
      }
      get_pilot_expiry_summary: {
        Args: { pilot_uuid: string }
        Returns: {
          critical_count: number
          days_to_next_expiry: number
          employee_id: string
          expired_count: number
          next_expiry_date: string
          next_expiry_type: string
          pilot_id: string
          pilot_name: string
          total_expiries: number
          valid_count: number
          warning_count: number
        }[]
      }
      get_pilot_statistics: {
        Args: never
        Returns: {
          active_pilots: number
          captain_count: number
          first_officer_count: number
          tre_count: number
          tri_count: number
        }[]
      }
      get_pilot_warning_count: { Args: { pilot_uuid: string }; Returns: number }
      get_renewal_recommendations: {
        Args: { days_ahead?: number }
        Returns: {
          days_until_expiry: number
          employee_id: string
          expiry_date: string
          expiry_description: string
          expiry_type: string
          pilot_id: string
          pilot_name: string
          priority_score: number
          recommended_renewal_date: string
          reference_id: string
          reference_table: string
          renewal_cost_estimate: number
        }[]
      }
      get_system_settings: {
        Args: { p_setting_type?: string; p_user_email: string }
        Returns: Json
      }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_years_in_service: {
        Args: { commencement_date: string }
        Returns: number
      }
      get_years_to_retirement: { Args: { birth_date: string }; Returns: number }
      import_crew_check: {
        Args: {
          p_check_code: string
          p_crew_name: string
          p_renewal_serial: number
          p_validity_serial: number
        }
        Returns: boolean
      }
      increment_post_view_count: {
        Args: { post_uuid: string }
        Returns: undefined
      }
      insert_crew_checks_batch: { Args: never; Returns: undefined }
      is_admin:
        | { Args: { user_id?: string }; Returns: boolean }
        | { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_current_user: { Args: { user_id: string }; Returns: boolean }
      is_manager_or_admin: { Args: never; Returns: boolean }
      is_pilot_owner: { Args: { pilot_uuid: string }; Returns: boolean }
      map_crew_name_to_id: { Args: { check_name: string }; Returns: string }
      mark_check_complete:
        | {
            Args: {
              p_check_type_code: string
              p_completion_date?: string
              p_crew_member_id: string
              p_validity_months?: number
            }
            Returns: boolean
          }
        | {
            Args: {
              check_id: string
              completion_date: string
              document_ref?: string
              expiry_date: string
            }
            Returns: boolean
          }
      parse_cert_date: { Args: { date_str: string }; Returns: string }
      parse_excel_date:
        | { Args: { excel_value: string }; Returns: string }
        | { Args: { excel_serial: number }; Returns: string }
      process_pending_reminders: { Args: never; Returns: number }
      refresh_all_expiry_views: { Args: never; Returns: string }
      refresh_dashboard_metrics: { Args: never; Returns: undefined }
      refresh_dashboard_views: { Args: never; Returns: undefined }
      refresh_expiry_materialized_views: { Args: never; Returns: string }
      refresh_expiry_views: { Args: never; Returns: undefined }
      refresh_pilot_status: { Args: never; Returns: undefined }
      safe_to_date: { Args: { date_str: string }; Returns: string }
      search_pilots_by_name: {
        Args: { search_term: string }
        Returns: {
          employee_id: string
          first_name: string
          id: string
          last_name: string
          role: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_flight_request_tx:
        | {
            Args: {
              p_description: string
              p_flight_date: string
              p_pilot_user_id: string
              p_reason?: string
              p_request_type: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_notes?: string
              p_pilot_id: string
              p_preferred_date?: string
              p_request_type: string
              p_route_details: string
            }
            Returns: string
          }
      submit_leave_request_tx:
        | {
            Args: {
              p_days_count: number
              p_end_date: string
              p_pilot_user_id: string
              p_reason?: string
              p_request_type: string
              p_roster_period: string
              p_start_date: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_end_date: string
              p_notes?: string
              p_pilot_id: string
              p_roster_period: string
              p_start_date: string
            }
            Returns: string
          }
      system_health_check: {
        Args: never
        Returns: {
          check_name: string
          details: string
          recommendation: string
          status: string
        }[]
      }
      update_all_expiry_statuses: { Args: never; Returns: number }
      update_certification_status: { Args: never; Returns: undefined }
      update_check_expiry_dates: { Args: never; Returns: number }
      update_check_statuses: { Args: never; Returns: number }
      update_crew_instructor_status: {
        Args: {
          p_crew_member_id: string
          p_is_tre?: boolean
          p_is_tri?: boolean
        }
        Returns: boolean
      }
      update_pilot_checks_status: { Args: never; Returns: number }
      upsert_system_settings: {
        Args: {
          p_alert_days_critical?: number
          p_alert_days_info?: number
          p_alert_days_warning?: number
          p_backup_frequency?: string
          p_email_notifications?: boolean
          p_examiner_ratio?: number
          p_fleet_size?: number
          p_required_captains_per_aircraft?: number
          p_required_first_officers_per_aircraft?: number
          p_setting_type?: string
          p_sms_notifications?: boolean
          p_system_timezone?: string
          p_training_captain_ratio?: number
          p_user_email: string
        }
        Returns: Json
      }
      user_has_admin_role:
        | { Args: never; Returns: boolean }
        | { Args: { user_id: string }; Returns: boolean }
      user_has_role: { Args: { required_roles: string[] }; Returns: boolean }
      validate_crew_member_completeness: {
        Args: never
        Returns: {
          compliance_impact: string
          crew_member_id: string
          employee_id: string
          missing_fields: string[]
          severity: string
        }[]
      }
    }
    Enums: {
      assignment_type:
        | "FLIGHT"
        | "STANDBY"
        | "TRAINING"
        | "OFFICE"
        | "LEAVE"
        | "SICK"
        | "REST"
      audit_action:
        | "CREATE"
        | "UPDATE"
        | "DELETE"
        | "VIEW"
        | "APPROVE"
        | "REJECT"
        | "LOGIN"
        | "LOGOUT"
        | "EXPORT"
      certification_category:
        | "LICENCE"
        | "MEDICAL"
        | "IDENTITY"
        | "PASSPORT"
        | "AIRCRAFT_TYPE"
        | "TRAINING"
        | "OPERATIONAL"
        | "SIMULATOR"
      certification_status:
        | "VALID"
        | "EXPIRING"
        | "EXPIRED"
        | "PENDING_RENEWAL"
        | "NOT_APPLICABLE"
      check_category:
        | "MEDICAL"
        | "LICENSE"
        | "TRAINING"
        | "QUALIFICATION"
        | "SECURITY"
        | "RECENCY"
        | "LANGUAGE"
      check_status:
        | "EXPIRED"
        | "EXPIRING_7_DAYS"
        | "EXPIRING_30_DAYS"
        | "EXPIRING_60_DAYS"
        | "EXPIRING_90_DAYS"
        | "CURRENT"
      crew_role:
        | "CAPTAIN"
        | "FIRST_OFFICER"
        | "SECOND_OFFICER"
        | "TRAINING_CAPTAIN"
        | "CHECK_CAPTAIN"
      leave_type:
        | "RDO"
        | "SDO"
        | "ANN"
        | "SCK"
        | "LSL"
        | "COMP"
        | "MAT"
        | "PAT"
        | "UNPAID"
      notification_level:
        | "90_DAYS"
        | "60_DAYS"
        | "30_DAYS"
        | "14_DAYS"
        | "7_DAYS"
        | "EXPIRED"
        | "CRITICAL"
      notification_status:
        | "PENDING"
        | "SENT"
        | "ACKNOWLEDGED"
        | "FAILED"
        | "CANCELLED"
      pilot_position: "captain" | "first_officer" | "second_officer" | "cadet"
      pilot_role: "Captain" | "First Officer"
      request_status:
        | "DRAFT"
        | "PENDING"
        | "APPROVED"
        | "REJECTED"
        | "CANCELLED"
        | "EXPIRED"
      visa_type: "Australia" | "China" | "New Zealand" | "Japan" | "Canada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assignment_type: [
        "FLIGHT",
        "STANDBY",
        "TRAINING",
        "OFFICE",
        "LEAVE",
        "SICK",
        "REST",
      ],
      audit_action: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "VIEW",
        "APPROVE",
        "REJECT",
        "LOGIN",
        "LOGOUT",
        "EXPORT",
      ],
      certification_category: [
        "LICENCE",
        "MEDICAL",
        "IDENTITY",
        "PASSPORT",
        "AIRCRAFT_TYPE",
        "TRAINING",
        "OPERATIONAL",
        "SIMULATOR",
      ],
      certification_status: [
        "VALID",
        "EXPIRING",
        "EXPIRED",
        "PENDING_RENEWAL",
        "NOT_APPLICABLE",
      ],
      check_category: [
        "MEDICAL",
        "LICENSE",
        "TRAINING",
        "QUALIFICATION",
        "SECURITY",
        "RECENCY",
        "LANGUAGE",
      ],
      check_status: [
        "EXPIRED",
        "EXPIRING_7_DAYS",
        "EXPIRING_30_DAYS",
        "EXPIRING_60_DAYS",
        "EXPIRING_90_DAYS",
        "CURRENT",
      ],
      crew_role: [
        "CAPTAIN",
        "FIRST_OFFICER",
        "SECOND_OFFICER",
        "TRAINING_CAPTAIN",
        "CHECK_CAPTAIN",
      ],
      leave_type: [
        "RDO",
        "SDO",
        "ANN",
        "SCK",
        "LSL",
        "COMP",
        "MAT",
        "PAT",
        "UNPAID",
      ],
      notification_level: [
        "90_DAYS",
        "60_DAYS",
        "30_DAYS",
        "14_DAYS",
        "7_DAYS",
        "EXPIRED",
        "CRITICAL",
      ],
      notification_status: [
        "PENDING",
        "SENT",
        "ACKNOWLEDGED",
        "FAILED",
        "CANCELLED",
      ],
      pilot_position: ["captain", "first_officer", "second_officer", "cadet"],
      pilot_role: ["Captain", "First Officer"],
      request_status: [
        "DRAFT",
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "EXPIRED",
      ],
      visa_type: ["Australia", "China", "New Zealand", "Japan", "Canada"],
    },
  },
} as const
