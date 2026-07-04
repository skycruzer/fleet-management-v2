export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      aircraft_types: {
        Row: {
          active: boolean
          code: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      check_types: {
        Row: {
          active: boolean
          code: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      competencies: {
        Row: {
          code: string
          display_name: string
          effective_from: string
          effective_to: string | null
          full_name: string
          sort_order: number
        }
        Insert: {
          code: string
          display_name: string
          effective_from?: string
          effective_to?: string | null
          full_name: string
          sort_order: number
        }
        Update: {
          code?: string
          display_name?: string
          effective_from?: string
          effective_to?: string | null
          full_name?: string
          sort_order?: number
        }
        Relationships: []
      }
      grade_descriptors: {
        Row: {
          grade: number
          is_pass_threshold: boolean
          label: string
        }
        Insert: {
          grade: number
          is_pass_threshold?: boolean
          label: string
        }
        Update: {
          grade?: number
          is_pass_threshold?: boolean
          label?: string
        }
        Relationships: []
      }
      licences: {
        Row: {
          created_at: string
          expiry: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          licence_no: string | null
          licence_type: string | null
          pilot_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiry?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          licence_no?: string | null
          licence_type?: string | null
          pilot_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiry?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          licence_no?: string | null
          licence_type?: string | null
          pilot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'licences_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
        ]
      }
      medicals: {
        Row: {
          created_at: string
          expiry: string | null
          id: string
          issue_date: string | null
          limitations: string | null
          medical_class: string | null
          pilot_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiry?: string | null
          id?: string
          issue_date?: string | null
          limitations?: string | null
          medical_class?: string | null
          pilot_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiry?: string | null
          id?: string
          issue_date?: string | null
          limitations?: string | null
          medical_class?: string | null
          pilot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'medicals_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
        ]
      }
      observable_behaviours: {
        Row: {
          code: string
          competency_code: string
          description: string
          effective_from: string
          effective_to: string | null
          id: string
          sort_order: number | null
        }
        Insert: {
          code: string
          competency_code: string
          description: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          competency_code?: string
          description?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'observable_behaviours_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
        ]
      }
      pilot_qualifications: {
        Row: {
          created_at: string
          id: string
          pilot_id: string
          qualification_id: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          pilot_id: string
          qualification_id: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          pilot_id?: string
          qualification_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pilot_qualifications_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pilot_qualifications_qualification_id_fkey'
            columns: ['qualification_id']
            isOneToOne: false
            referencedRelation: 'qualifications'
            referencedColumns: ['id']
          },
        ]
      }
      pilots: {
        Row: {
          aircraft_type_id: string | null
          created_at: string
          deleted_at: string | null
          employment_status: string
          full_name: string
          id: string
          rank: string | null
          staff_no: string
          updated_at: string
          version: number
        }
        Insert: {
          aircraft_type_id?: string | null
          created_at?: string
          deleted_at?: string | null
          employment_status?: string
          full_name: string
          id?: string
          rank?: string | null
          staff_no: string
          updated_at?: string
          version?: number
        }
        Update: {
          aircraft_type_id?: string | null
          created_at?: string
          deleted_at?: string | null
          employment_status?: string
          full_name?: string
          id?: string
          rank?: string | null
          staff_no?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: 'pilots_aircraft_type_id_fkey'
            columns: ['aircraft_type_id']
            isOneToOne: false
            referencedRelation: 'aircraft_types'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string | null
          id: string
          ioa_number: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name?: string | null
          id: string
          ioa_number?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string | null
          id?: string
          ioa_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      qualifications: {
        Row: {
          active: boolean
          code: string
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          active?: boolean
          code: string
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          active?: boolean
          code?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      record_retention: {
        Row: {
          legal_basis: string | null
          record_type: string
          retention_months: number | null
          retention_note: string | null
        }
        Insert: {
          legal_basis?: string | null
          record_type: string
          retention_months?: number | null
          retention_note?: string | null
        }
        Update: {
          legal_basis?: string | null
          record_type?: string
          retention_months?: number | null
          retention_note?: string | null
        }
        Relationships: []
      }
      remedial_requirements: {
        Row: {
          competency_code: string
          created_at: string
          current_grade: number | null
          id: string
          notes: string | null
          pilot_id: string
          previous_grade: number | null
          reason: string
          resolved_at: string | null
          resolved_by_report_id: string | null
          status: Database['ebt']['Enums']['remedial_status']
          triggered_by_report_id: string
          updated_at: string
        }
        Insert: {
          competency_code: string
          created_at?: string
          current_grade?: number | null
          id?: string
          notes?: string | null
          pilot_id: string
          previous_grade?: number | null
          reason: string
          resolved_at?: string | null
          resolved_by_report_id?: string | null
          status?: Database['ebt']['Enums']['remedial_status']
          triggered_by_report_id: string
          updated_at?: string
        }
        Update: {
          competency_code?: string
          created_at?: string
          current_grade?: number | null
          id?: string
          notes?: string | null
          pilot_id?: string
          previous_grade?: number | null
          reason?: string
          resolved_at?: string | null
          resolved_by_report_id?: string | null
          status?: Database['ebt']['Enums']['remedial_status']
          triggered_by_report_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'remedial_requirements_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'remedial_requirements_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'remedial_requirements_resolved_by_report_id_fkey'
            columns: ['resolved_by_report_id']
            isOneToOne: false
            referencedRelation: 'training_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'remedial_requirements_resolved_by_report_id_fkey'
            columns: ['resolved_by_report_id']
            isOneToOne: false
            referencedRelation: 'v_pilot_competency_trend'
            referencedColumns: ['report_id']
          },
          {
            foreignKeyName: 'remedial_requirements_triggered_by_report_id_fkey'
            columns: ['triggered_by_report_id']
            isOneToOne: false
            referencedRelation: 'training_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'remedial_requirements_triggered_by_report_id_fkey'
            columns: ['triggered_by_report_id']
            isOneToOne: false
            referencedRelation: 'v_pilot_competency_trend'
            referencedColumns: ['report_id']
          },
        ]
      }
      report_carryover_focus: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          competency_code: string
          previous_grade: number
          previous_module_no: number | null
          report_id: string
          source_report_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          competency_code: string
          previous_grade: number
          previous_module_no?: number | null
          report_id: string
          source_report_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          competency_code?: string
          previous_grade?: number
          previous_module_no?: number | null
          report_id?: string
          source_report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'report_carryover_focus_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'report_carryover_focus_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'training_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_carryover_focus_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'v_pilot_competency_trend'
            referencedColumns: ['report_id']
          },
          {
            foreignKeyName: 'report_carryover_focus_source_report_id_fkey'
            columns: ['source_report_id']
            isOneToOne: false
            referencedRelation: 'training_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_carryover_focus_source_report_id_fkey'
            columns: ['source_report_id']
            isOneToOne: false
            referencedRelation: 'v_pilot_competency_trend'
            referencedColumns: ['report_id']
          },
        ]
      }
      report_competency_grades: {
        Row: {
          competency_code: string
          grade: number | null
          phase: Database['ebt']['Enums']['report_phase']
          report_id: string
        }
        Insert: {
          competency_code: string
          grade?: number | null
          phase: Database['ebt']['Enums']['report_phase']
          report_id: string
        }
        Update: {
          competency_code?: string
          grade?: number | null
          phase?: Database['ebt']['Enums']['report_phase']
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'report_competency_grades_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'report_competency_grades_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'training_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_competency_grades_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'v_pilot_competency_trend'
            referencedColumns: ['report_id']
          },
        ]
      }
      report_documents: {
        Row: {
          generated_at: string
          id: string
          kind: string
          report_id: string
          sha256: string | null
          storage_path: string | null
          template_version: string | null
        }
        Insert: {
          generated_at?: string
          id?: string
          kind?: string
          report_id: string
          sha256?: string | null
          storage_path?: string | null
          template_version?: string | null
        }
        Update: {
          generated_at?: string
          id?: string
          kind?: string
          report_id?: string
          sha256?: string | null
          storage_path?: string | null
          template_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'report_documents_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'training_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_documents_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'v_pilot_competency_trend'
            referencedColumns: ['report_id']
          },
        ]
      }
      report_observed_behaviours: {
        Row: {
          competency_code: string
          observable_behaviour_id: string
          phase: Database['ebt']['Enums']['report_phase']
          report_id: string
        }
        Insert: {
          competency_code: string
          observable_behaviour_id: string
          phase: Database['ebt']['Enums']['report_phase']
          report_id: string
        }
        Update: {
          competency_code?: string
          observable_behaviour_id?: string
          phase?: Database['ebt']['Enums']['report_phase']
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'report_observed_behaviours_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'report_observed_behaviours_observable_behaviour_id_compete_fkey'
            columns: ['observable_behaviour_id', 'competency_code']
            isOneToOne: false
            referencedRelation: 'observable_behaviours'
            referencedColumns: ['id', 'competency_code']
          },
          {
            foreignKeyName: 'report_observed_behaviours_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'training_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_observed_behaviours_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'v_pilot_competency_trend'
            referencedColumns: ['report_id']
          },
        ]
      }
      report_phases: {
        Row: {
          id: string
          non_technical_events: string | null
          overall_comments: string | null
          phase: Database['ebt']['Enums']['report_phase']
          progress: string | null
          report_id: string
          result: Database['ebt']['Enums']['eval_result'] | null
          technical_events: string | null
        }
        Insert: {
          id?: string
          non_technical_events?: string | null
          overall_comments?: string | null
          phase: Database['ebt']['Enums']['report_phase']
          progress?: string | null
          report_id: string
          result?: Database['ebt']['Enums']['eval_result'] | null
          technical_events?: string | null
        }
        Update: {
          id?: string
          non_technical_events?: string | null
          overall_comments?: string | null
          phase?: Database['ebt']['Enums']['report_phase']
          progress?: string | null
          report_id?: string
          result?: Database['ebt']['Enums']['eval_result'] | null
          technical_events?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'report_phases_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'training_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_phases_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'v_pilot_competency_trend'
            referencedColumns: ['report_id']
          },
        ]
      }
      report_qualifications: {
        Row: {
          qualification_id: string
          report_id: string
        }
        Insert: {
          qualification_id: string
          report_id: string
        }
        Update: {
          qualification_id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'report_qualifications_qualification_id_fkey'
            columns: ['qualification_id']
            isOneToOne: false
            referencedRelation: 'qualifications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_qualifications_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'training_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_qualifications_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'v_pilot_competency_trend'
            referencedColumns: ['report_id']
          },
        ]
      }
      report_signatures: {
        Row: {
          content_hash: string | null
          id: string
          kind: Database['ebt']['Enums']['signature_kind']
          report_id: string
          signed_at: string | null
          signed_by: string | null
          storage_path: string | null
        }
        Insert: {
          content_hash?: string | null
          id?: string
          kind: Database['ebt']['Enums']['signature_kind']
          report_id: string
          signed_at?: string | null
          signed_by?: string | null
          storage_path?: string | null
        }
        Update: {
          content_hash?: string | null
          id?: string
          kind?: Database['ebt']['Enums']['signature_kind']
          report_id?: string
          signed_at?: string | null
          signed_by?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'report_signatures_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'training_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_signatures_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'v_pilot_competency_trend'
            referencedColumns: ['report_id']
          },
        ]
      }
      report_specialised_training: {
        Row: {
          report_id: string
          specialised_training_id: string
        }
        Insert: {
          report_id: string
          specialised_training_id: string
        }
        Update: {
          report_id?: string
          specialised_training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'report_specialised_training_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'training_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_specialised_training_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'v_pilot_competency_trend'
            referencedColumns: ['report_id']
          },
          {
            foreignKeyName: 'report_specialised_training_specialised_training_id_fkey'
            columns: ['specialised_training_id']
            isOneToOne: false
            referencedRelation: 'specialised_training'
            referencedColumns: ['id']
          },
        ]
      }
      specialised_training: {
        Row: {
          active: boolean
          code: string
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          active?: boolean
          code: string
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          active?: boolean
          code?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      state_transitions: {
        Row: {
          from_status: Database['ebt']['Enums']['report_status']
          to_status: Database['ebt']['Enums']['report_status']
        }
        Insert: {
          from_status: Database['ebt']['Enums']['report_status']
          to_status: Database['ebt']['Enums']['report_status']
        }
        Update: {
          from_status?: Database['ebt']['Enums']['report_status']
          to_status?: Database['ebt']['Enums']['report_status']
        }
        Relationships: []
      }
      training_reports: {
        Row: {
          additional_comments: string | null
          check_type_id: string | null
          created_at: string
          day2_deferred: boolean
          declaration_released: boolean | null
          deleted_at: string | null
          examiner_id: string
          finalized_at: string | null
          form_version: string
          id: string
          if_hours: string | null
          ioa_number: string | null
          is_resit: boolean
          module_no: number | null
          pilot_id: string
          sign_off_date: string | null
          signed_off_by: string | null
          sim_hours: string | null
          sim_level: string | null
          sim_location: string | null
          snap_aircraft_type: string | null
          snap_licence: string | null
          snap_medical_class: string | null
          snap_medical_expiry: string | null
          snap_name: string | null
          snap_next_ir_expiry: string | null
          snap_next_proficiency_expiry: string | null
          snap_rank: string | null
          snap_staff_no: string | null
          source_response_id: string | null
          status: Database['ebt']['Enums']['report_status']
          submitted_at: string | null
          training_date: string | null
          updated_at: string
          version: number
        }
        Insert: {
          additional_comments?: string | null
          check_type_id?: string | null
          created_at?: string
          day2_deferred?: boolean
          declaration_released?: boolean | null
          deleted_at?: string | null
          examiner_id: string
          finalized_at?: string | null
          form_version?: string
          id?: string
          if_hours?: string | null
          ioa_number?: string | null
          is_resit?: boolean
          module_no?: number | null
          pilot_id: string
          sign_off_date?: string | null
          signed_off_by?: string | null
          sim_hours?: string | null
          sim_level?: string | null
          sim_location?: string | null
          snap_aircraft_type?: string | null
          snap_licence?: string | null
          snap_medical_class?: string | null
          snap_medical_expiry?: string | null
          snap_name?: string | null
          snap_next_ir_expiry?: string | null
          snap_next_proficiency_expiry?: string | null
          snap_rank?: string | null
          snap_staff_no?: string | null
          source_response_id?: string | null
          status?: Database['ebt']['Enums']['report_status']
          submitted_at?: string | null
          training_date?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          additional_comments?: string | null
          check_type_id?: string | null
          created_at?: string
          day2_deferred?: boolean
          declaration_released?: boolean | null
          deleted_at?: string | null
          examiner_id?: string
          finalized_at?: string | null
          form_version?: string
          id?: string
          if_hours?: string | null
          ioa_number?: string | null
          is_resit?: boolean
          module_no?: number | null
          pilot_id?: string
          sign_off_date?: string | null
          signed_off_by?: string | null
          sim_hours?: string | null
          sim_level?: string | null
          sim_location?: string | null
          snap_aircraft_type?: string | null
          snap_licence?: string | null
          snap_medical_class?: string | null
          snap_medical_expiry?: string | null
          snap_name?: string | null
          snap_next_ir_expiry?: string | null
          snap_next_proficiency_expiry?: string | null
          snap_rank?: string | null
          snap_staff_no?: string | null
          source_response_id?: string | null
          status?: Database['ebt']['Enums']['report_status']
          submitted_at?: string | null
          training_date?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: 'training_reports_check_type_id_fkey'
            columns: ['check_type_id']
            isOneToOne: false
            referencedRelation: 'check_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'training_reports_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
        ]
      }
      user_roles: {
        Row: {
          role: Database['ebt']['Enums']['app_role']
          user_id: string
        }
        Insert: {
          role: Database['ebt']['Enums']['app_role']
          user_id: string
        }
        Update: {
          role?: Database['ebt']['Enums']['app_role']
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_fleet_competency_health: {
        Row: {
          avg_grade: number | null
          competency_code: string | null
          n_graded: number | null
          pct_below_3: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'report_competency_grades_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
        ]
      }
      v_fleet_competency_health_active: {
        Row: {
          avg_grade: number | null
          competency_code: string | null
          n_graded: number | null
          pct_below_3: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'report_competency_grades_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
        ]
      }
      v_fleet_competency_health_grouped: {
        Row: {
          aircraft_type_id: string | null
          avg_grade: number | null
          competency_code: string | null
          n_graded: number | null
          pct_below_3: number | null
          pct_not_competent: number | null
          rank: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pilots_aircraft_type_id_fkey'
            columns: ['aircraft_type_id']
            isOneToOne: false
            referencedRelation: 'aircraft_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_competency_grades_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
        ]
      }
      v_fleet_first_vs_resit_grouped: {
        Row: {
          aircraft_type_id: string | null
          competency_code: string | null
          first_avg_grade: number | null
          first_below: number | null
          first_n: number | null
          rank: string | null
          resit_avg_grade: number | null
          resit_below: number | null
          resit_n: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'pilots_aircraft_type_id_fkey'
            columns: ['aircraft_type_id']
            isOneToOne: false
            referencedRelation: 'aircraft_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_competency_grades_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
        ]
      }
      v_fleet_grade_distribution_grouped: {
        Row: {
          aircraft_type_id: string | null
          competency_code: string | null
          g1: number | null
          g2: number | null
          g3: number | null
          g4: number | null
          g5: number | null
          rank: string | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'pilots_aircraft_type_id_fkey'
            columns: ['aircraft_type_id']
            isOneToOne: false
            referencedRelation: 'aircraft_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_competency_grades_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
        ]
      }
      v_fleet_ob_frequency: {
        Row: {
          aircraft_type_id: string | null
          competency_code: string | null
          n: number | null
          observable_behaviour_id: string | null
          rank: string | null
          share: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'pilots_aircraft_type_id_fkey'
            columns: ['aircraft_type_id']
            isOneToOne: false
            referencedRelation: 'aircraft_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_observed_behaviours_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'report_observed_behaviours_observable_behaviour_id_compete_fkey'
            columns: ['observable_behaviour_id', 'competency_code']
            isOneToOne: false
            referencedRelation: 'observable_behaviours'
            referencedColumns: ['id', 'competency_code']
          },
        ]
      }
      v_fleet_trend_monthly: {
        Row: {
          aircraft_type_id: string | null
          avg_grade: number | null
          competency_code: string | null
          month: string | null
          n_graded: number | null
          pct_below_3: number | null
          rank: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pilots_aircraft_type_id_fkey'
            columns: ['aircraft_type_id']
            isOneToOne: false
            referencedRelation: 'aircraft_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_competency_grades_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
        ]
      }
      v_module_outcomes_grouped: {
        Row: {
          aircraft_type_id: string | null
          fail: number | null
          incomplete: number | null
          module_no: number | null
          pass: number | null
          rank: string | null
          resit: number | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'pilots_aircraft_type_id_fkey'
            columns: ['aircraft_type_id']
            isOneToOne: false
            referencedRelation: 'aircraft_types'
            referencedColumns: ['id']
          },
        ]
      }
      v_outcome_rates: {
        Row: {
          fail_count: number | null
          incomplete_count: number | null
          module_no: number | null
          pass_count: number | null
          resit_count: number | null
          total: number | null
        }
        Relationships: []
      }
      v_pilot_carryover_deficiencies: {
        Row: {
          competency_code: string | null
          pilot_id: string | null
          previous_grade: number | null
          source_module_no: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'report_competency_grades_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'training_reports_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
        ]
      }
      v_pilot_competency_trend: {
        Row: {
          competency_code: string | null
          grade: number | null
          module_no: number | null
          pilot_id: string | null
          report_id: string | null
          training_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'report_competency_grades_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'training_reports_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
        ]
      }
      v_pilot_currency: {
        Row: {
          alert_bucket: string | null
          days_to_expiry: number | null
          pilot_id: string | null
          qualification_code: string | null
          valid_to: string | null
        }
        Relationships: []
      }
      v_pilot_latest_eval: {
        Row: {
          competency_code: string | null
          grade: number | null
          module_no: number | null
          pilot_id: string | null
          training_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'report_competency_grades_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'training_reports_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
        ]
      }
      v_pilot_module_progress: {
        Row: {
          last_completed_date: string | null
          last_completed_module_no: number | null
          modules_completed: number | null
          next_module_suggested: number | null
          pilot_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'training_reports_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
        ]
      }
      v_pilot_ob_frequency: {
        Row: {
          competency_code: string | null
          direction: string | null
          n: number | null
          observable_behaviour_id: string | null
          pilot_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'report_observed_behaviours_competency_code_fkey'
            columns: ['competency_code']
            isOneToOne: false
            referencedRelation: 'competencies'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'report_observed_behaviours_observable_behaviour_id_compete_fkey'
            columns: ['observable_behaviour_id', 'competency_code']
            isOneToOne: false
            referencedRelation: 'observable_behaviours'
            referencedColumns: ['id', 'competency_code']
          },
          {
            foreignKeyName: 'training_reports_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
        ]
      }
      v_pilot_standing_signals: {
        Row: {
          any_grade_one: boolean | null
          any_grade_two: boolean | null
          below_effective_count: number | null
          not_competent_count: number | null
          pilot_id: string | null
          recurring_twos: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: 'training_reports_pilot_id_fkey'
            columns: ['pilot_id']
            isOneToOne: false
            referencedRelation: 'pilots'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      app_role: { Args: never; Returns: string }
      can_access_report: { Args: { p_report: string }; Returns: boolean }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      evaluate_eval_result: { Args: { p_report: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_fleet_manager: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: 'examiner' | 'fleet_manager' | 'admin'
      eval_result: 'pass' | 'fail' | 'incomplete'
      remedial_status: 'required' | 'scheduled' | 'in_progress' | 'completed' | 'waived'
      report_phase: 'EVAL' | 'MV' | 'SBT' | 'ISI'
      report_status: 'draft' | 'submitted' | 'signed_off' | 'finalized'
      signature_kind: 'examiner' | 'trainee' | 'fleet_manager' | 'emfts'
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ['examiner', 'fleet_manager', 'admin'],
      eval_result: ['pass', 'fail', 'incomplete'],
      remedial_status: ['required', 'scheduled', 'in_progress', 'completed', 'waived'],
      report_phase: ['EVAL', 'MV', 'SBT', 'ISI'],
      report_status: ['draft', 'submitted', 'signed_off', 'finalized'],
      signature_kind: ['examiner', 'trainee', 'fleet_manager', 'emfts'],
    },
  },
} as const
