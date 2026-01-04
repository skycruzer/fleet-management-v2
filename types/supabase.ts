export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          created_at: string | null
          email: string
          failed_attempts: number
          id: string
          locked_at: string | null
          locked_until: string
          reason: string | null
          unlocked_at: string | null
          unlocked_by: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          failed_attempts?: number
          id?: string
          locked_at?: string | null
          locked_until: string
          reason?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          failed_attempts?: number
          id?: string
          locked_at?: string | null
          locked_until?: string
          reason?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'account_lockouts_unlocked_by_fkey'
            columns: ['unlocked_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
        ]
      }
      an_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          role: string
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
          user_type?: string | null
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
          new_values: Json | null
          old_values: Json | null
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
          new_values?: Json | null
          old_values?: Json | null
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
          new_values?: Json | null
          old_values?: Json | null
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
            foreignKeyName: 'certification_renewal_plans_check_type_id_fkey'
            columns: ['check_type_id']
            isOneToOne: false
            referencedRelation: 'check_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_paired_pilot_id_fkey'
            columns: ['paired_pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_paired_pilot_id_fkey'
            columns: ['paired_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_paired_pilot_id_fkey'
            columns: ['paired_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_paired_pilot_id_fkey'
            columns: ['paired_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_paired_pilot_id_fkey'
            columns: ['paired_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_paired_pilot_id_fkey'
            columns: ['paired_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_paired_pilot_id_fkey'
            columns: ['paired_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_paired_pilot_id_fkey'
            columns: ['paired_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_paired_pilot_id_fkey'
            columns: ['paired_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_paired_pilot_id_fkey'
            columns: ['paired_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_renewal_plans_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
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
            foreignKeyName: 'digital_forms_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
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
            foreignKeyName: 'disciplinary_audit_log_matter_id_fkey'
            columns: ['matter_id']
            isOneToOne: false
            referencedRelation: 'disciplinary_matters'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disciplinary_audit_log_matter_id_fkey'
            columns: ['matter_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['matter_id']
          },
          {
            foreignKeyName: 'disciplinary_audit_log_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
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
            foreignKeyName: 'disciplinary_matters_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disciplinary_matters_incident_type_id_fkey'
            columns: ['incident_type_id']
            isOneToOne: false
            referencedRelation: 'incident_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disciplinary_matters_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disciplinary_matters_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'disciplinary_matters_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disciplinary_matters_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disciplinary_matters_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disciplinary_matters_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disciplinary_matters_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'disciplinary_matters_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'disciplinary_matters_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disciplinary_matters_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disciplinary_matters_reported_by_fkey'
            columns: ['reported_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disciplinary_matters_resolved_by_fkey'
            columns: ['resolved_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
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
      failed_login_attempts: {
        Row: {
          attempted_at: string | null
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      feedback_categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_by_type: string | null
          description: string | null
          display_order: number | null
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
          display_order?: number | null
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
          display_order?: number | null
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
            foreignKeyName: 'feedback_categories_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'pending_pilot_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_categories_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_user_id']
          },
          {
            foreignKeyName: 'feedback_categories_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'pilot_users'
            referencedColumns: ['id']
          },
        ]
      }
      feedback_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          parent_comment_id: string | null
          pilot_user_id: string
          post_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          parent_comment_id?: string | null
          pilot_user_id: string
          post_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          parent_comment_id?: string | null
          pilot_user_id?: string
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'feedback_comments_parent_comment_id_fkey'
            columns: ['parent_comment_id']
            isOneToOne: false
            referencedRelation: 'feedback_comments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_comments_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pending_pilot_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_comments_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_user_id']
          },
          {
            foreignKeyName: 'feedback_comments_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_comments_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'feedback_posts'
            referencedColumns: ['id']
          },
        ]
      }
      feedback_likes: {
        Row: {
          created_at: string
          id: string
          pilot_user_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pilot_user_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pilot_user_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'feedback_likes_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pending_pilot_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_likes_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_user_id']
          },
          {
            foreignKeyName: 'feedback_likes_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_likes_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'feedback_posts'
            referencedColumns: ['id']
          },
        ]
      }
      feedback_posts: {
        Row: {
          admin_response: string | null
          category_id: string | null
          content: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          pilot_user_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          title: string
          updated_at: string
          upvotes: number | null
        }
        Insert: {
          admin_response?: string | null
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          pilot_user_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title: string
          updated_at?: string
          upvotes?: number | null
        }
        Update: {
          admin_response?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          pilot_user_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'feedback_posts_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'feedback_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_posts_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pending_pilot_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_posts_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_user_id']
          },
          {
            foreignKeyName: 'feedback_posts_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_posts_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'pending_pilot_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_posts_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_user_id']
          },
          {
            foreignKeyName: 'feedback_posts_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'pilot_users'
            referencedColumns: ['id']
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
          route_details: Json | null
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
          route_details?: Json | null
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
          route_details?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'flight_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pending_pilot_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_user_id']
          },
          {
            foreignKeyName: 'flight_requests_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flight_requests_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
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
      leave_bid_options: {
        Row: {
          bid_id: string
          created_at: string | null
          end_date: string
          id: string
          priority: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          bid_id: string
          created_at?: string | null
          end_date: string
          id?: string
          priority: number
          start_date: string
          updated_at?: string | null
        }
        Update: {
          bid_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          priority?: number
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'leave_bid_options_bid_id_fkey'
            columns: ['bid_id']
            isOneToOne: false
            referencedRelation: 'leave_bids'
            referencedColumns: ['id']
          },
        ]
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
            foreignKeyName: 'leave_bids_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_bids_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'leave_bids_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_bids_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_bids_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_bids_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_bids_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'leave_bids_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'leave_bids_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_bids_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_bids_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          created_at: string | null
          days_count: number
          end_date: string
          id: string
          is_late_request: boolean | null
          notes: string | null
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
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          days_count: number
          end_date: string
          id?: string
          is_late_request?: boolean | null
          notes?: string | null
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
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          days_count?: number
          end_date?: string
          id?: string
          is_late_request?: boolean | null
          notes?: string | null
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
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'leave_requests_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'leave_requests_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'leave_requests_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'leave_requests_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pending_pilot_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_user_id']
          },
          {
            foreignKeyName: 'leave_requests_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          recipient_id: string
          title: string
          type: Database['public']['Enums']['notification_type']
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          recipient_id: string
          title: string
          type: Database['public']['Enums']['notification_type']
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          recipient_id?: string
          title?: string
          type?: Database['public']['Enums']['notification_type']
          updated_at?: string | null
        }
        Relationships: []
      }
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'password_history_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
        ]
      }
      password_policies: {
        Row: {
          created_at: string | null
          id: string
          max_age_days: number | null
          min_length: number | null
          prevent_reuse_count: number | null
          require_lowercase: boolean | null
          require_number: boolean | null
          require_special: boolean | null
          require_uppercase: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_age_days?: number | null
          min_length?: number | null
          prevent_reuse_count?: number | null
          require_lowercase?: boolean | null
          require_number?: boolean | null
          require_special?: boolean | null
          require_uppercase?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_age_days?: number | null
          min_length?: number | null
          prevent_reuse_count?: number | null
          require_lowercase?: boolean | null
          require_number?: boolean | null
          require_special?: boolean | null
          require_uppercase?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'password_reset_tokens_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'pending_pilot_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'password_reset_tokens_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_user_id']
          },
          {
            foreignKeyName: 'password_reset_tokens_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'pilot_users'
            referencedColumns: ['id']
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
            foreignKeyName: 'pilot_checks_check_type_id_fkey'
            columns: ['check_type_id']
            isOneToOne: false
            referencedRelation: 'check_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
          },
        ]
      }
      pilot_feedback: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          id: string
          is_anonymous: boolean
          message: string
          pilot_id: string
          responded_at: string | null
          responded_by: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          category: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          message: string
          pilot_id: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          message?: string
          pilot_id?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pilot_feedback_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_feedback_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_feedback_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_feedback_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_feedback_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_feedback_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_feedback_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_feedback_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_feedback_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_feedback_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_feedback_responded_by_fkey'
            columns: ['responded_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
        ]
      }
      pilot_requests: {
        Row: {
          availability_impact: Json | null
          conflict_flags: Json | null
          created_at: string | null
          days_count: number | null
          employee_number: string
          end_date: string | null
          flight_date: string | null
          id: string
          is_late_request: boolean | null
          is_past_deadline: boolean | null
          name: string
          notes: string | null
          pilot_id: string | null
          pilot_user_id: string | null
          priority_score: number | null
          rank: string
          reason: string | null
          request_category: string
          request_type: string
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roster_deadline_date: string
          roster_period: string
          roster_period_start_date: string
          roster_publish_date: string
          source_attachment_url: string | null
          source_reference: string | null
          start_date: string
          submission_channel: string
          submission_date: string
          submitted_by_admin_id: string | null
          updated_at: string | null
          workflow_status: string
        }
        Insert: {
          availability_impact?: Json | null
          conflict_flags?: Json | null
          created_at?: string | null
          days_count?: number | null
          employee_number: string
          end_date?: string | null
          flight_date?: string | null
          id?: string
          is_late_request?: boolean | null
          is_past_deadline?: boolean | null
          name: string
          notes?: string | null
          pilot_id?: string | null
          pilot_user_id?: string | null
          priority_score?: number | null
          rank: string
          reason?: string | null
          request_category: string
          request_type: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_deadline_date: string
          roster_period: string
          roster_period_start_date: string
          roster_publish_date: string
          source_attachment_url?: string | null
          source_reference?: string | null
          start_date: string
          submission_channel: string
          submission_date?: string
          submitted_by_admin_id?: string | null
          updated_at?: string | null
          workflow_status?: string
        }
        Update: {
          availability_impact?: Json | null
          conflict_flags?: Json | null
          created_at?: string | null
          days_count?: number | null
          employee_number?: string
          end_date?: string | null
          flight_date?: string | null
          id?: string
          is_late_request?: boolean | null
          is_past_deadline?: boolean | null
          name?: string
          notes?: string | null
          pilot_id?: string | null
          pilot_user_id?: string | null
          priority_score?: number | null
          rank?: string
          reason?: string | null
          request_category?: string
          request_type?: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_deadline_date?: string
          roster_period?: string
          roster_period_start_date?: string
          roster_publish_date?: string
          source_attachment_url?: string | null
          source_reference?: string | null
          start_date?: string
          submission_channel?: string
          submission_date?: string
          submitted_by_admin_id?: string | null
          updated_at?: string | null
          workflow_status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pilot_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pending_pilot_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_user_id']
          },
          {
            foreignKeyName: 'pilot_requests_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_users'
            referencedColumns: ['id']
          },
        ]
      }
      pilot_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          pilot_user_id: string
          session_token: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          pilot_user_id: string
          session_token: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          pilot_user_id?: string
          session_token?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pilot_sessions_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pending_pilot_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_sessions_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_user_id']
          },
          {
            foreignKeyName: 'pilot_sessions_pilot_user_id_fkey'
            columns: ['pilot_user_id']
            isOneToOne: false
            referencedRelation: 'pilot_users'
            referencedColumns: ['id']
          },
        ]
      }
      pilot_users: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          auth_user_id: string | null
          created_at: string | null
          date_of_birth: string | null
          denial_reason: string | null
          email: string
          employee_id: string | null
          first_name: string
          id: string
          last_login_at: string | null
          last_name: string
          password_hash: string | null
          phone_number: string | null
          pilot_id: string | null
          rank: string | null
          registration_approved: boolean | null
          registration_date: string | null
          seniority_number: number | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          denial_reason?: string | null
          email: string
          employee_id?: string | null
          first_name: string
          id?: string
          last_login_at?: string | null
          last_name: string
          password_hash?: string | null
          phone_number?: string | null
          pilot_id?: string | null
          rank?: string | null
          registration_approved?: boolean | null
          registration_date?: string | null
          seniority_number?: number | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          denial_reason?: string | null
          email?: string
          employee_id?: string | null
          first_name?: string
          id?: string
          last_login_at?: string | null
          last_name?: string
          password_hash?: string | null
          phone_number?: string | null
          pilot_id?: string | null
          rank?: string | null
          registration_approved?: boolean | null
          registration_date?: string | null
          seniority_number?: number | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pilot_users_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_users_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_users_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_users_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_users_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_users_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_users_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_users_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_users_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_users_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_users_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
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
          role: Database['public']['Enums']['pilot_role']
          seniority_number: number | null
          updated_at: string
          user_id: string | null
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
          role: Database['public']['Enums']['pilot_role']
          seniority_number?: number | null
          updated_at?: string
          user_id?: string | null
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
          role?: Database['public']['Enums']['pilot_role']
          seniority_number?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'fk_pilots_contract_type_id'
            columns: ['contract_type_id']
            isOneToOne: false
            referencedRelation: 'contract_types'
            referencedColumns: ['id']
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
            foreignKeyName: 'renewal_plan_history_changed_by_fkey'
            columns: ['changed_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'renewal_plan_history_renewal_plan_id_fkey'
            columns: ['renewal_plan_id']
            isOneToOne: false
            referencedRelation: 'certification_renewal_plans'
            referencedColumns: ['id']
          },
        ]
      }
      report_email_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      roster_period_capacity: {
        Row: {
          flight_capacity: number | null
          ground_capacity: number | null
          medical_capacity: number | null
          notes: string | null
          period_end_date: string
          period_start_date: string
          roster_period: string
          simulator_capacity: number | null
        }
        Insert: {
          flight_capacity?: number | null
          ground_capacity?: number | null
          medical_capacity?: number | null
          notes?: string | null
          period_end_date: string
          period_start_date: string
          roster_period: string
          simulator_capacity?: number | null
        }
        Update: {
          flight_capacity?: number | null
          ground_capacity?: number | null
          medical_capacity?: number | null
          notes?: string | null
          period_end_date?: string
          period_start_date?: string
          roster_period?: string
          simulator_capacity?: number | null
        }
        Relationships: []
      }
      roster_periods: {
        Row: {
          code: string
          created_at: string | null
          end_date: string
          id: string
          period_number: number
          publish_date: string
          request_deadline_date: string
          start_date: string
          status: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          code: string
          created_at?: string | null
          end_date: string
          id?: string
          period_number: number
          publish_date: string
          request_deadline_date: string
          start_date: string
          status?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          code?: string
          created_at?: string | null
          end_date?: string
          id?: string
          period_number?: number
          publish_date?: string
          request_deadline_date?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      roster_reports: {
        Row: {
          approved_count: number | null
          denied_count: number | null
          email_recipients: string[] | null
          generated_at: string | null
          generated_by: string | null
          id: string
          min_crew_captains: number | null
          min_crew_date: string | null
          min_crew_fos: number | null
          pdf_url: string | null
          pending_count: number | null
          report_type: string
          roster_period_code: string
          sent_at: string | null
          withdrawn_count: number | null
        }
        Insert: {
          approved_count?: number | null
          denied_count?: number | null
          email_recipients?: string[] | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          min_crew_captains?: number | null
          min_crew_date?: string | null
          min_crew_fos?: number | null
          pdf_url?: string | null
          pending_count?: number | null
          report_type: string
          roster_period_code: string
          sent_at?: string | null
          withdrawn_count?: number | null
        }
        Update: {
          approved_count?: number | null
          denied_count?: number | null
          email_recipients?: string[] | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          min_crew_captains?: number | null
          min_crew_date?: string | null
          min_crew_fos?: number | null
          pdf_url?: string | null
          pending_count?: number | null
          report_type?: string
          roster_period_code?: string
          sent_at?: string | null
          withdrawn_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'roster_reports_roster_period_code_fkey'
            columns: ['roster_period_code']
            isOneToOne: false
            referencedRelation: 'roster_periods'
            referencedColumns: ['code']
          },
        ]
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
            foreignKeyName: 'task_audit_log_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'active_tasks_dashboard'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_audit_log_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_audit_log_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
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
          completion_date: string | null
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
          completion_date?: string | null
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
          completion_date?: string | null
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
            foreignKeyName: 'tasks_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'task_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_parent_task_id_fkey'
            columns: ['parent_task_id']
            isOneToOne: false
            referencedRelation: 'active_tasks_dashboard'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_parent_task_id_fkey'
            columns: ['parent_task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_related_matter_id_fkey'
            columns: ['related_matter_id']
            isOneToOne: false
            referencedRelation: 'disciplinary_matters'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_related_matter_id_fkey'
            columns: ['related_matter_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['matter_id']
          },
          {
            foreignKeyName: 'tasks_related_pilot_id_fkey'
            columns: ['related_pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_related_pilot_id_fkey'
            columns: ['related_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'tasks_related_pilot_id_fkey'
            columns: ['related_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_related_pilot_id_fkey'
            columns: ['related_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_related_pilot_id_fkey'
            columns: ['related_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_related_pilot_id_fkey'
            columns: ['related_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_related_pilot_id_fkey'
            columns: ['related_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'tasks_related_pilot_id_fkey'
            columns: ['related_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'tasks_related_pilot_id_fkey'
            columns: ['related_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_related_pilot_id_fkey'
            columns: ['related_pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
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
            foreignKeyName: 'tasks_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'task_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'an_users'
            referencedColumns: ['id']
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
          role: Database['public']['Enums']['pilot_role'] | null
        }
        Insert: {
          captain_qualifications?: Json | null
          employee_id?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          role?: Database['public']['Enums']['pilot_role'] | null
        }
        Update: {
          captain_qualifications?: Json | null
          employee_id?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          role?: Database['public']['Enums']['pilot_role'] | null
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
          role: Database['public']['Enums']['pilot_role'] | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pilot_checks_check_type_id_fkey'
            columns: ['check_type_id']
            isOneToOne: false
            referencedRelation: 'check_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
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
            foreignKeyName: 'pilot_checks_check_type_id_fkey'
            columns: ['check_type_id']
            isOneToOne: false
            referencedRelation: 'check_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
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
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'captain_qualifications_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_checks_overview'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_qualification_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_report_summary'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_requirements_compliance'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_summary_optimized'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_user_mappings'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilot_warning_history'
            referencedColumns: ['pilot_id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_checks_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots_with_contract_details'
            referencedColumns: ['id']
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
        Relationships: []
      }
      pilot_checks_overview: {
        Row: {
          checks: Json | null
          employee_id: string | null
          first_name: string | null
          last_name: string | null
          pilot_id: string | null
          role: Database['public']['Enums']['pilot_role'] | null
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
          role: Database['public']['Enums']['pilot_role'] | null
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
          role: Database['public']['Enums']['pilot_role'] | null
          seniority_number: number | null
          total_checks: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'fk_pilots_contract_type_id'
            columns: ['contract_type_id']
            isOneToOne: false
            referencedRelation: 'contract_types'
            referencedColumns: ['id']
          },
        ]
      }
      pilot_requirements_compliance: {
        Row: {
          employee_id: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          role: Database['public']['Enums']['pilot_role'] | null
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
          role: Database['public']['Enums']['pilot_role'] | null
          seniority_number: number | null
          total_certifications: number | null
        }
        Relationships: []
      }
      pilot_user_mappings: {
        Row: {
          email: string | null
          employee_id: string | null
          first_name: string | null
          last_login_at: string | null
          last_name: string | null
          pilot_created_at: string | null
          pilot_id: string | null
          pilot_user_created_at: string | null
          pilot_user_id: string | null
          rank: string | null
          registration_approved: boolean | null
          seniority_number: number | null
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
          role: Database['public']['Enums']['pilot_role'] | null
          seniority_number: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'fk_pilots_contract_type_id'
            columns: ['contract_type_id']
            isOneToOne: false
            referencedRelation: 'contract_types'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
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
      approve_leave_request: {
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
        Args: { p_updates: Json[] }
        Returns: {
          error_count: number
          errors: string[]
          updated_count: number
        }[]
      }
      bulk_delete_certifications: {
        Args: { p_certification_ids: string[] }
        Returns: Json
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
      calculate_optimal_renewal_date:
        | { Args: { p_current_expiry_date: string }; Returns: string }
        | {
            Args: {
              advance_renewal_days?: number
              current_expiry_date: string
              validity_period_months: number
            }
            Returns: string
          }
      calculate_required_examiners: { Args: never; Returns: number }
      calculate_required_training_captains: { Args: never; Returns: number }
      calculate_years_in_service:
        | { Args: { p_pilot_id: string }; Returns: number }
        | { Args: { commencement_date: string }; Returns: number }
      calculate_years_to_retirement:
        | { Args: { birth_date: string }; Returns: number }
        | { Args: { pilot_id: string }; Returns: number }
      can_access_pilot_data: { Args: { pilot_uuid: string }; Returns: boolean }
      check_deprecated_table_usage: {
        Args: never
        Returns: {
          recommendation: string
          record_count: number
          status: string
          table_name: string
        }[]
      }
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
      cleanup_expired_lockouts: { Args: never; Returns: undefined }
      cleanup_expired_password_reset_tokens: { Args: never; Returns: number }
      cleanup_old_expiry_alerts: { Args: never; Returns: number }
      cleanup_old_failed_attempts: { Args: never; Returns: undefined }
      cleanup_password_history: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      complete_task: { Args: { p_task_id: string }; Returns: boolean }
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
              p_recipient_id: string
              p_title: string
              p_type: Database['public']['Enums']['notification_type']
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
        Args: { p_certifications?: Json[]; p_pilot_data: Json }
        Returns: {
          certifications_created: number
          employee_id: string
          first_name: string
          last_name: string
          pilot_id: string
          role: Database['public']['Enums']['pilot_role']
          seniority_number: number
        }[]
      }
      current_user_email: { Args: never; Returns: string }
      current_user_is_an_admin: { Args: never; Returns: boolean }
      days_until_expiry: { Args: { expiry_date: string }; Returns: number }
      delete_pilot_with_cascade: { Args: { p_pilot_id: string }; Returns: Json }
      excel_date_to_pg_date: { Args: { excel_serial: number }; Returns: string }
      find_check_type_by_code: { Args: { code: string }; Returns: string }
      find_crew_member_by_name: {
        Args: { search_name: string }
        Returns: {
          employee_id: string
          full_name: string
          is_active: boolean
          pilot_id: string
          role: Database['public']['Enums']['pilot_role']
        }[]
      }
      get_auth_user_from_pilot_user: {
        Args: { p_pilot_user_id: string }
        Returns: string
      }
      get_check_category_distribution: {
        Args: never
        Returns: {
          category: string
          check_count: number
        }[]
      }
      get_check_status: {
        Args: { expiry_date: string }
        Returns: Database['public']['Enums']['check_status']
      }
      get_crew_expiry_summary: {
        Args: { crew_member_uuid: string }
        Returns: {
          compliance_status: string
          days_to_next_expiry: number
          employee_id: string
          expired_count: number
          expiring_soon_count: number
          next_expiry_date: string
          next_expiry_type: string
          pilot_id: string
          pilot_name: string
          total_certifications: number
          valid_count: number
        }[]
      }
      get_crew_member_expiring_items: {
        Args: { crew_member_id: string; days_threshold?: number }
        Returns: {
          check_type_name: string
          days_until_expiry: number
          expiry_date: string
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
      get_database_performance_metrics: {
        Args: never
        Returns: {
          metric_name: string
          metric_unit: string
          metric_value: number
          status: string
        }[]
      }
      get_expiring_certifications_with_email: {
        Args: { days_threshold?: number }
        Returns: {
          check_code: string
          check_description: string
          check_type_id: string
          days_until_expiry: number
          email: string
          employee_id: string
          expiry_date: string
          first_name: string
          last_name: string
          pilot_id: string
          rank: string
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
          compliance_percentage: number
          compliant_pilots: number
          non_compliant_pilots: number
          total_pilots: number
        }[]
      }
      get_lockout_expiry: { Args: { user_email: string }; Returns: string }
      get_monthly_expiry_data: {
        Args: never
        Returns: {
          count: number
          month: string
        }[]
      }
      get_password_age_days: { Args: { user_uuid: string }; Returns: number }
      get_password_history_count: {
        Args: { user_uuid: string }
        Returns: number
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
      get_pilot_expiries: {
        Args: never
        Returns: {
          expiry_date: string
          expiry_type: string
          pilot_id: string
          pilot_name: string
        }[]
      }
      get_pilot_expiring_items: {
        Args: { p_days_threshold?: number; p_pilot_id: string }
        Returns: {
          check_type_name: string
          days_until_expiry: number
          expiry_date: string
          status: string
        }[]
      }
      get_pilot_expiry_summary: {
        Args: { p_pilot_id: string }
        Returns: {
          next_expiry_check_type: string
          next_expiry_date: string
        }[]
      }
      get_pilot_feedback_posts: {
        Args: { p_limit?: number; p_offset?: number; p_pilot_user_id: string }
        Returns: {
          category_name: string
          comment_count: number
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          status: string
          title: string
          updated_at: string
          upvotes: number
        }[]
      }
      get_pilot_fleet_expiry_statistics: {
        Args: never
        Returns: {
          expired_count: number
          expiring_count: number
          time_period: string
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
      get_report_email_recipients: {
        Args: { category_name: string }
        Returns: string
      }
      get_system_settings: {
        Args: { p_setting_type?: string; p_user_email: string }
        Returns: Json
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
      insert_crew_checks_batch: { Args: never; Returns: undefined }
      is_account_locked: { Args: { user_email: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_current_user: { Args: { user_id: string }; Returns: boolean }
      is_manager_or_admin: { Args: never; Returns: boolean }
      is_pilot_owner: { Args: { pilot_uuid: string }; Returns: boolean }
      map_crew_name_to_id: { Args: { check_name: string }; Returns: string }
      mark_check_complete: {
        Args: {
          p_check_type_code: string
          p_completion_date?: string
          p_crew_member_id: string
          p_validity_months?: number
        }
        Returns: boolean
      }
      parse_cert_date: { Args: { date_str: string }; Returns: string }
      parse_excel_date:
        | { Args: { excel_value: string }; Returns: string }
        | { Args: { excel_serial: number }; Returns: string }
      refresh_all_expiry_views: { Args: never; Returns: string }
      refresh_dashboard_metrics: { Args: never; Returns: undefined }
      refresh_dashboard_views: { Args: never; Returns: undefined }
      refresh_expiry_materialized_views: { Args: never; Returns: string }
      refresh_expiry_views: { Args: never; Returns: undefined }
      refresh_pilot_status: { Args: never; Returns: undefined }
      remove_upvote_feedback_post: {
        Args: { p_pilot_user_id: string; p_post_id: string }
        Returns: boolean
      }
      safe_to_date: { Args: { date_str: string }; Returns: string }
      submit_feedback_post_tx: {
        Args: {
          p_category_id?: string
          p_content: string
          p_is_anonymous?: boolean
          p_pilot_user_id: string
          p_title: string
        }
        Returns: string
      }
      submit_flight_request_tx:
        | {
            Args: {
              p_flight_date: string
              p_pilot_user_id: string
              p_reason?: string
              p_request_type: string
              p_route_details?: Json
            }
            Returns: string
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
      submit_leave_request_tx: {
        Args: {
          p_days_count: number
          p_end_date: string
          p_notes?: string
          p_pilot_user_id: string
          p_reason?: string
          p_request_type: string
          p_start_date: string
        }
        Returns: string
      }
      update_certification_status: { Args: never; Returns: undefined }
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
      upvote_feedback_post: {
        Args: { p_pilot_user_id: string; p_post_id: string }
        Returns: boolean
      }
      user_has_admin_role: { Args: { user_id: string }; Returns: boolean }
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
      assignment_type: 'FLIGHT' | 'STANDBY' | 'TRAINING' | 'OFFICE' | 'LEAVE' | 'SICK' | 'REST'
      audit_action:
        | 'CREATE'
        | 'UPDATE'
        | 'DELETE'
        | 'VIEW'
        | 'APPROVE'
        | 'REJECT'
        | 'LOGIN'
        | 'LOGOUT'
        | 'EXPORT'
      certification_category:
        | 'LICENCE'
        | 'MEDICAL'
        | 'IDENTITY'
        | 'PASSPORT'
        | 'AIRCRAFT_TYPE'
        | 'TRAINING'
        | 'OPERATIONAL'
        | 'SIMULATOR'
      certification_status: 'VALID' | 'EXPIRING' | 'EXPIRED' | 'PENDING_RENEWAL' | 'NOT_APPLICABLE'
      check_category:
        | 'MEDICAL'
        | 'LICENSE'
        | 'TRAINING'
        | 'QUALIFICATION'
        | 'SECURITY'
        | 'RECENCY'
        | 'LANGUAGE'
      check_status:
        | 'EXPIRED'
        | 'EXPIRING_7_DAYS'
        | 'EXPIRING_30_DAYS'
        | 'EXPIRING_60_DAYS'
        | 'EXPIRING_90_DAYS'
        | 'CURRENT'
      crew_role:
        | 'CAPTAIN'
        | 'FIRST_OFFICER'
        | 'SECOND_OFFICER'
        | 'TRAINING_CAPTAIN'
        | 'CHECK_CAPTAIN'
      leave_type: 'RDO' | 'SDO' | 'ANN' | 'SCK' | 'LSL' | 'COMP' | 'MAT' | 'PAT' | 'UNPAID'
      notification_level:
        | '90_DAYS'
        | '60_DAYS'
        | '30_DAYS'
        | '14_DAYS'
        | '7_DAYS'
        | 'EXPIRED'
        | 'CRITICAL'
      notification_status: 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'FAILED' | 'CANCELLED'
      notification_type:
        | 'leave_request_submitted'
        | 'leave_request_approved'
        | 'leave_request_rejected'
        | 'leave_request_pending_review'
        | 'leave_bid_submitted'
        | 'leave_bid_approved'
        | 'leave_bid_rejected'
        | 'flight_request_submitted'
        | 'flight_request_approved'
        | 'flight_request_rejected'
      pilot_position: 'captain' | 'first_officer' | 'second_officer' | 'cadet'
      pilot_role: 'Captain' | 'First Officer'
      request_status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'
      visa_type: 'Australia' | 'China' | 'New Zealand' | 'Japan' | 'Canada'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assignment_type: ['FLIGHT', 'STANDBY', 'TRAINING', 'OFFICE', 'LEAVE', 'SICK', 'REST'],
      audit_action: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'VIEW',
        'APPROVE',
        'REJECT',
        'LOGIN',
        'LOGOUT',
        'EXPORT',
      ],
      certification_category: [
        'LICENCE',
        'MEDICAL',
        'IDENTITY',
        'PASSPORT',
        'AIRCRAFT_TYPE',
        'TRAINING',
        'OPERATIONAL',
        'SIMULATOR',
      ],
      certification_status: ['VALID', 'EXPIRING', 'EXPIRED', 'PENDING_RENEWAL', 'NOT_APPLICABLE'],
      check_category: [
        'MEDICAL',
        'LICENSE',
        'TRAINING',
        'QUALIFICATION',
        'SECURITY',
        'RECENCY',
        'LANGUAGE',
      ],
      check_status: [
        'EXPIRED',
        'EXPIRING_7_DAYS',
        'EXPIRING_30_DAYS',
        'EXPIRING_60_DAYS',
        'EXPIRING_90_DAYS',
        'CURRENT',
      ],
      crew_role: [
        'CAPTAIN',
        'FIRST_OFFICER',
        'SECOND_OFFICER',
        'TRAINING_CAPTAIN',
        'CHECK_CAPTAIN',
      ],
      leave_type: ['RDO', 'SDO', 'ANN', 'SCK', 'LSL', 'COMP', 'MAT', 'PAT', 'UNPAID'],
      notification_level: [
        '90_DAYS',
        '60_DAYS',
        '30_DAYS',
        '14_DAYS',
        '7_DAYS',
        'EXPIRED',
        'CRITICAL',
      ],
      notification_status: ['PENDING', 'SENT', 'ACKNOWLEDGED', 'FAILED', 'CANCELLED'],
      notification_type: [
        'leave_request_submitted',
        'leave_request_approved',
        'leave_request_rejected',
        'leave_request_pending_review',
        'leave_bid_submitted',
        'leave_bid_approved',
        'leave_bid_rejected',
        'flight_request_submitted',
        'flight_request_approved',
        'flight_request_rejected',
      ],
      pilot_position: ['captain', 'first_officer', 'second_officer', 'cadet'],
      pilot_role: ['Captain', 'First Officer'],
      request_status: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
      visa_type: ['Australia', 'China', 'New Zealand', 'Japan', 'Canada'],
    },
  },
} as const
