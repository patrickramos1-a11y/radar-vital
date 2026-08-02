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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          client_name: string | null
          created_at: string
          description: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          new_value: string | null
          old_value: string | null
          user_name: string
        }
        Insert: {
          action_type: string
          client_name?: string | null
          created_at?: string
          description: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_name: string
        }
        Update: {
          action_type?: string
          client_name?: string | null
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_name?: string
        }
        Relationships: []
      }
      app_users: {
        Row: {
          created_at: string
          display_name: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      audit_client_items: {
        Row: {
          assignee_id: string | null
          audit_id: string
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          started_at: string | null
          status: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          assignee_id?: string | null
          audit_id: string
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          assignee_id?: string | null
          audit_id?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_client_items_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "collaborator_performance_all_time"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "audit_client_items_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "collaborator_star_balances"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "audit_client_items_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_client_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audit_campaign_summary"
            referencedColumns: ["audit_id"]
          },
          {
            foreignKeyName: "audit_client_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_client_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_client_results: {
        Row: {
          audit_client_item_id: string
          audit_criterion_id: string
          created_at: string
          evaluated_at: string | null
          evaluated_by: string | null
          evidence_url: string | null
          id: string
          notes: string | null
          result: string
          updated_at: string
        }
        Insert: {
          audit_client_item_id: string
          audit_criterion_id: string
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          evidence_url?: string | null
          id?: string
          notes?: string | null
          result?: string
          updated_at?: string
        }
        Update: {
          audit_client_item_id?: string
          audit_criterion_id?: string
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          evidence_url?: string | null
          id?: string
          notes?: string | null
          result?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_client_results_audit_client_item_id_fkey"
            columns: ["audit_client_item_id"]
            isOneToOne: false
            referencedRelation: "audit_client_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_client_results_audit_criterion_id_fkey"
            columns: ["audit_criterion_id"]
            isOneToOne: false
            referencedRelation: "audit_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_criteria: {
        Row: {
          audit_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          title: string
        }
        Insert: {
          audit_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          title: string
        }
        Update: {
          audit_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_criteria_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audit_campaign_summary"
            referencedColumns: ["audit_id"]
          },
          {
            foreignKeyName: "audit_criteria_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action_type: string
          actor_user_id: string
          after_data: Json | null
          audit_client_item_id: string | null
          audit_id: string
          before_data: Json | null
          created_at: string
          id: string
        }
        Insert: {
          action_type: string
          actor_user_id?: string
          after_data?: Json | null
          audit_client_item_id?: string | null
          audit_id: string
          before_data?: Json | null
          created_at?: string
          id?: string
        }
        Update: {
          action_type?: string
          actor_user_id?: string
          after_data?: Json | null
          audit_client_item_id?: string | null
          audit_id?: string
          before_data?: Json | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_audit_client_item_id_fkey"
            columns: ["audit_client_item_id"]
            isOneToOne: false
            referencedRelation: "audit_client_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audit_campaign_summary"
            referencedColumns: ["audit_id"]
          },
          {
            foreignKeyName: "audit_events_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          id: string
          objective: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
          validated_by: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          id?: string
          objective?: string | null
          starts_at?: string
          status?: string
          title: string
          updated_at?: string
          validated_by?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          id?: string
          objective?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          validated_by?: string | null
        }
        Relationships: []
      }
      challenge_completion_conditions: {
        Row: {
          challenge_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          is_required: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_required?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_required?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completion_conditions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_summary"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "challenge_completion_conditions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_events: {
        Row: {
          action_type: string
          actor_user_id: string
          after_data: Json | null
          before_data: Json | null
          challenge_id: string
          created_at: string
          id: string
        }
        Insert: {
          action_type: string
          actor_user_id?: string
          after_data?: Json | null
          before_data?: Json | null
          challenge_id: string
          created_at?: string
          id?: string
        }
        Update: {
          action_type?: string
          actor_user_id?: string
          after_data?: Json | null
          before_data?: Json | null
          challenge_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_events_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_summary"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "challenge_events_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_evidences: {
        Row: {
          challenge_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          url: string | null
        }
        Insert: {
          challenge_id: string
          created_at?: string
          created_by?: string
          description: string
          id?: string
          url?: string | null
        }
        Update: {
          challenge_id?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_evidences_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_summary"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "challenge_evidences_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_items: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          item_id: string
          item_type: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_items_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_summary"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "challenge_items_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          collaborator_id: string
          created_at: string
          id: string
        }
        Insert: {
          challenge_id: string
          collaborator_id: string
          created_at?: string
          id?: string
        }
        Update: {
          challenge_id?: string
          collaborator_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_summary"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_performance_all_time"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "challenge_participants_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_star_balances"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "challenge_participants_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_value_requests: {
        Row: {
          admin_note: string | null
          challenge_id: string
          collaborator_id: string
          id: string
          justification: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          challenge_id: string
          collaborator_id: string
          id?: string
          justification: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          challenge_id?: string
          collaborator_id?: string
          id?: string
          justification?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_value_requests_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_summary"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "challenge_value_requests_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_value_requests_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_performance_all_time"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "challenge_value_requests_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_star_balances"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "challenge_value_requests_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_kind: string
          client_id: string | null
          completion_mode: string
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          evidence_requirements: string | null
          expected_deliverable: string | null
          id: string
          import_key: string | null
          penalty_stars: number
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          reward_configured_at: string | null
          reward_configured_by: string | null
          reward_stars: number
          reward_status: string
          reward_superstars: number
          status: string
          success_criteria: string
          title: string
          updated_at: string
        }
        Insert: {
          challenge_kind?: string
          client_id?: string | null
          completion_mode?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          evidence_requirements?: string | null
          expected_deliverable?: string | null
          id?: string
          import_key?: string | null
          penalty_stars?: number
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reward_configured_at?: string | null
          reward_configured_by?: string | null
          reward_stars?: number
          reward_status?: string
          reward_superstars?: number
          status?: string
          success_criteria: string
          title: string
          updated_at?: string
        }
        Update: {
          challenge_kind?: string
          client_id?: string | null
          completion_mode?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          evidence_requirements?: string | null
          expected_deliverable?: string | null
          id?: string
          import_key?: string | null
          penalty_stars?: number
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reward_configured_at?: string | null
          reward_configured_by?: string | null
          reward_stars?: number
          reward_status?: string
          reward_superstars?: number
          status?: string
          success_criteria?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_collaborator_assignments: {
        Row: {
          client_id: string
          collaborator_id: string
          created_at: string
          id: string
        }
        Insert: {
          client_id: string
          collaborator_id: string
          created_at?: string
          id?: string
        }
        Update: {
          client_id?: string
          collaborator_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_collaborator_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_collaborator_assignments_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_performance_all_time"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "client_collaborator_assignments_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_star_balances"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "client_collaborator_assignments_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      client_comments: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          author_name: string
          author_user_id: string | null
          client_id: string
          closed_at: string | null
          closed_by: string | null
          comment_text: string
          comment_type: string
          created_at: string
          id: string
          is_archived: boolean
          is_closed: boolean
          is_edited: boolean
          is_pinned: boolean
          read_celine: boolean
          read_darley: boolean
          read_gabi: boolean
          read_patrick: boolean
          read_timestamps: Json
          read_vanessa: boolean
          reply_to_id: string | null
          required_readers: string[]
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          author_name?: string
          author_user_id?: string | null
          client_id: string
          closed_at?: string | null
          closed_by?: string | null
          comment_text: string
          comment_type?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_closed?: boolean
          is_edited?: boolean
          is_pinned?: boolean
          read_celine?: boolean
          read_darley?: boolean
          read_gabi?: boolean
          read_patrick?: boolean
          read_timestamps?: Json
          read_vanessa?: boolean
          reply_to_id?: string | null
          required_readers?: string[]
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          author_name?: string
          author_user_id?: string | null
          client_id?: string
          closed_at?: string | null
          closed_by?: string | null
          comment_text?: string
          comment_type?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_closed?: boolean
          is_edited?: boolean
          is_pinned?: boolean
          read_celine?: boolean
          read_darley?: boolean
          read_gabi?: boolean
          read_patrick?: boolean
          read_timestamps?: Json
          read_vanessa?: boolean
          reply_to_id?: string | null
          required_readers?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "client_comments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_comments_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "client_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          client_type: string
          collaborator_celine: boolean
          collaborator_darley: boolean
          collaborator_gabi: boolean
          collaborator_vanessa: boolean
          comment_count: number
          cond_a_vencer_count: number
          cond_atendidas_count: number
          cond_vencidas_count: number
          created_at: string
          demands_cancelled: number
          demands_celine: number
          demands_completed: number
          demands_darley: number
          demands_gabi: number
          demands_in_progress: number
          demands_not_started: number
          demands_vanessa: number
          display_order: number
          id: string
          initials: string
          is_active: boolean
          is_checked: boolean
          is_highlighted: boolean
          is_priority: boolean
          lic_fora_validade_count: number
          lic_proxima_data_vencimento: string | null
          lic_proximo_venc_count: number
          lic_validas_count: number
          licenses: number
          logo_url: string | null
          municipios: string[] | null
          name: string
          notif_atendida_count: number
          notif_item_atendido_count: number
          notif_item_pendente_count: number
          notif_item_vencido_count: number
          notif_pendente_count: number
          notif_total_count: number
          pending_ciencia_count: number
          proc_deferido_count: number
          proc_em_analise_orgao_count: number
          proc_em_analise_ramos_count: number
          proc_notificado_count: number
          proc_reprovado_count: number
          proc_total_count: number
          processes: number
          universe_category: string | null
          universe_collaborator_id: string | null
          updated_at: string
        }
        Insert: {
          client_type?: string
          collaborator_celine?: boolean
          collaborator_darley?: boolean
          collaborator_gabi?: boolean
          collaborator_vanessa?: boolean
          comment_count?: number
          cond_a_vencer_count?: number
          cond_atendidas_count?: number
          cond_vencidas_count?: number
          created_at?: string
          demands_cancelled?: number
          demands_celine?: number
          demands_completed?: number
          demands_darley?: number
          demands_gabi?: number
          demands_in_progress?: number
          demands_not_started?: number
          demands_vanessa?: number
          display_order?: number
          id?: string
          initials: string
          is_active?: boolean
          is_checked?: boolean
          is_highlighted?: boolean
          is_priority?: boolean
          lic_fora_validade_count?: number
          lic_proxima_data_vencimento?: string | null
          lic_proximo_venc_count?: number
          lic_validas_count?: number
          licenses?: number
          logo_url?: string | null
          municipios?: string[] | null
          name: string
          notif_atendida_count?: number
          notif_item_atendido_count?: number
          notif_item_pendente_count?: number
          notif_item_vencido_count?: number
          notif_pendente_count?: number
          notif_total_count?: number
          pending_ciencia_count?: number
          proc_deferido_count?: number
          proc_em_analise_orgao_count?: number
          proc_em_analise_ramos_count?: number
          proc_notificado_count?: number
          proc_reprovado_count?: number
          proc_total_count?: number
          processes?: number
          universe_category?: string | null
          universe_collaborator_id?: string | null
          updated_at?: string
        }
        Update: {
          client_type?: string
          collaborator_celine?: boolean
          collaborator_darley?: boolean
          collaborator_gabi?: boolean
          collaborator_vanessa?: boolean
          comment_count?: number
          cond_a_vencer_count?: number
          cond_atendidas_count?: number
          cond_vencidas_count?: number
          created_at?: string
          demands_cancelled?: number
          demands_celine?: number
          demands_completed?: number
          demands_darley?: number
          demands_gabi?: number
          demands_in_progress?: number
          demands_not_started?: number
          demands_vanessa?: number
          display_order?: number
          id?: string
          initials?: string
          is_active?: boolean
          is_checked?: boolean
          is_highlighted?: boolean
          is_priority?: boolean
          lic_fora_validade_count?: number
          lic_proxima_data_vencimento?: string | null
          lic_proximo_venc_count?: number
          lic_validas_count?: number
          licenses?: number
          logo_url?: string | null
          municipios?: string[] | null
          name?: string
          notif_atendida_count?: number
          notif_item_atendido_count?: number
          notif_item_pendente_count?: number
          notif_item_vencido_count?: number
          notif_pendente_count?: number
          notif_total_count?: number
          pending_ciencia_count?: number
          proc_deferido_count?: number
          proc_em_analise_orgao_count?: number
          proc_em_analise_ramos_count?: number
          proc_notificado_count?: number
          proc_reprovado_count?: number
          proc_total_count?: number
          processes?: number
          universe_category?: string | null
          universe_collaborator_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_universe_collaborator_id_fkey"
            columns: ["universe_collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_performance_all_time"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "clients_universe_collaborator_id_fkey"
            columns: ["universe_collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_star_balances"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "clients_universe_collaborator_id_fkey"
            columns: ["universe_collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_comments: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          author_name: string
          collaborator_name: string
          comment_text: string
          context: string
          created_at: string
          id: string
          is_archived: boolean
          is_read: boolean
          read_at: string | null
          read_by: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          author_name: string
          collaborator_name: string
          comment_text: string
          context?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          author_name?: string
          collaborator_name?: string
          comment_text?: string
          context?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      collaborators: {
        Row: {
          color: string
          created_at: string
          email: string | null
          id: string
          initials: string
          is_active: boolean
          is_central_only: boolean
          name: string
          photo_url: string | null
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          email?: string | null
          id?: string
          initials: string
          is_active?: boolean
          is_central_only?: boolean
          name: string
          photo_url?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          email?: string | null
          id?: string
          initials?: string
          is_active?: boolean
          is_central_only?: boolean
          name?: string
          photo_url?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      deliverable_items: {
        Row: {
          created_at: string
          deliverable_id: string
          id: string
          item_id: string
          item_type: string
        }
        Insert: {
          created_at?: string
          deliverable_id: string
          id?: string
          item_id: string
          item_type: string
        }
        Update: {
          created_at?: string
          deliverable_id?: string
          id?: string
          item_id?: string
          item_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_items_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_ratings: {
        Row: {
          created_at: string
          deliverable_id: string
          id: string
          rater_name: string
          rating_type: string
          star_transaction_version: string | null
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          deliverable_id: string
          id?: string
          rater_name: string
          rating_type: string
          star_transaction_version?: string | null
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          deliverable_id?: string
          id?: string
          rater_name?: string
          rating_type?: string
          star_transaction_version?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_ratings_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          assigned_to: string[]
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          requester: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string[]
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          requester?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string[]
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          requester?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      municipalities: {
        Row: {
          created_at: string
          id: string
          name: string
          state: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          state: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          state?: string
        }
        Relationships: []
      }
      panel_links: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon_name: string | null
          id: string
          is_active: boolean
          name: string
          panel_type: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          panel_type?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          panel_type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      pdf_client_aliases: {
        Row: {
          alias_normalized: string
          client_id: string
          created_at: string
          created_by: string
          id: string
        }
        Insert: {
          alias_normalized: string
          client_id: string
          created_at?: string
          created_by?: string
          id?: string
        }
        Update: {
          alias_normalized?: string
          client_id?: string
          created_at?: string
          created_by?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_client_aliases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_detected_clients: {
        Row: {
          client_name_normalized: string
          client_name_raw: string
          created_at: string
          id: string
          match_score: number | null
          match_status: string
          matched_client_id: string | null
          pdf_import_id: string
          source_pages: number[] | null
        }
        Insert: {
          client_name_normalized: string
          client_name_raw: string
          created_at?: string
          id?: string
          match_score?: number | null
          match_status?: string
          matched_client_id?: string | null
          pdf_import_id: string
          source_pages?: number[] | null
        }
        Update: {
          client_name_normalized?: string
          client_name_raw?: string
          created_at?: string
          id?: string
          match_score?: number | null
          match_status?: string
          matched_client_id?: string | null
          pdf_import_id?: string
          source_pages?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_detected_clients_matched_client_id_fkey"
            columns: ["matched_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_detected_clients_pdf_import_id_fkey"
            columns: ["pdf_import_id"]
            isOneToOne: false
            referencedRelation: "pdf_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_imports: {
        Row: {
          created_at: string
          error_message: string | null
          file_hash: string | null
          file_name: string
          file_size: number | null
          file_url: string | null
          id: string
          imported_by: string
          raw_metadata: Json | null
          report_period_month: number | null
          report_period_year: number | null
          status: string
          total_clients_detected: number | null
          total_clients_matched: number | null
          total_clients_pending: number | null
          total_clients_unmatched: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_hash?: string | null
          file_name: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          imported_by?: string
          raw_metadata?: Json | null
          report_period_month?: number | null
          report_period_year?: number | null
          status?: string
          total_clients_detected?: number | null
          total_clients_matched?: number | null
          total_clients_pending?: number | null
          total_clients_unmatched?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_hash?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          imported_by?: string
          raw_metadata?: Json | null
          report_period_month?: number | null
          report_period_year?: number | null
          status?: string
          total_clients_detected?: number | null
          total_clients_matched?: number | null
          total_clients_pending?: number | null
          total_clients_unmatched?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pdf_metrics: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          metric_key: string
          metric_label: string
          metric_unit: string | null
          metric_value_number: number | null
          metric_value_text: string | null
          pdf_detected_client_id: string | null
          pdf_import_id: string
          source_pages: number[] | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          metric_key: string
          metric_label: string
          metric_unit?: string | null
          metric_value_number?: number | null
          metric_value_text?: string | null
          pdf_detected_client_id?: string | null
          pdf_import_id: string
          source_pages?: number[] | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          metric_key?: string
          metric_label?: string
          metric_unit?: string | null
          metric_value_number?: number | null
          metric_value_text?: string | null
          pdf_detected_client_id?: string | null
          pdf_import_id?: string
          source_pages?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_metrics_pdf_detected_client_id_fkey"
            columns: ["pdf_detected_client_id"]
            isOneToOne: false
            referencedRelation: "pdf_detected_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_metrics_pdf_import_id_fkey"
            columns: ["pdf_import_id"]
            isOneToOne: false
            referencedRelation: "pdf_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      priorities: {
        Row: {
          assigned_to: string[]
          category: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string
          title: string
          updated_at: string
          weight: number
        }
        Insert: {
          assigned_to?: string[]
          category?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          weight?: number
        }
        Update: {
          assigned_to?: string[]
          category?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "priorities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          collaborator_id: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          collaborator_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          collaborator_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_performance_all_time"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "profiles_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_star_balances"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "profiles_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      star_settlement_items: {
        Row: {
          amount_brl: number
          balance_before: number
          collaborator_id: string
          created_at: string
          id: string
          settlement_id: string
          settlement_transaction_id: string | null
          stars_settled: number
        }
        Insert: {
          amount_brl?: number
          balance_before: number
          collaborator_id: string
          created_at?: string
          id?: string
          settlement_id: string
          settlement_transaction_id?: string | null
          stars_settled: number
        }
        Update: {
          amount_brl?: number
          balance_before?: number
          collaborator_id?: string
          created_at?: string
          id?: string
          settlement_id?: string
          settlement_transaction_id?: string | null
          stars_settled?: number
        }
        Relationships: [
          {
            foreignKeyName: "star_settlement_items_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_performance_all_time"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "star_settlement_items_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_star_balances"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "star_settlement_items_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "star_settlement_items_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "star_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "star_settlement_items_settlement_transaction_id_fkey"
            columns: ["settlement_transaction_id"]
            isOneToOne: false
            referencedRelation: "star_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      star_settlements: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes: string | null
          period_end: string | null
          period_start: string | null
          star_to_brl: number | null
          total_brl: number
          total_stars: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          star_to_brl?: number | null
          total_brl?: number
          total_stars?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          star_to_brl?: number | null
          total_brl?: number
          total_stars?: number
        }
        Relationships: []
      }
      star_transactions: {
        Row: {
          amount: number
          collaborator_id: string
          created_at: string
          created_by: string
          id: string
          idempotency_key: string
          metadata: Json
          reason: string
          reverses_transaction_id: string | null
          settlement_id: string | null
          source_id: string | null
          source_type: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          collaborator_id: string
          created_at?: string
          created_by?: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reason: string
          reverses_transaction_id?: string | null
          settlement_id?: string | null
          source_id?: string | null
          source_type?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          collaborator_id?: string
          created_at?: string
          created_by?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reason?: string
          reverses_transaction_id?: string | null
          settlement_id?: string | null
          source_id?: string | null
          source_type?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "star_transactions_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_performance_all_time"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "star_transactions_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_star_balances"
            referencedColumns: ["collaborator_id"]
          },
          {
            foreignKeyName: "star_transactions_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "star_transactions_reverses_transaction_id_fkey"
            columns: ["reverses_transaction_id"]
            isOneToOne: false
            referencedRelation: "star_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "star_transactions_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "star_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string[]
          client_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          priority: string
          priority_id: string | null
          title: string
        }
        Insert: {
          assigned_to?: string[]
          client_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string
          priority_id?: string | null
          title: string
        }
        Update: {
          assigned_to?: string[]
          client_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string
          priority_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "priorities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      audit_campaign_summary: {
        Row: {
          audit_id: string | null
          completed: number | null
          in_progress: number | null
          pending: number | null
          progress: number | null
          total_clients: number | null
          validated: number | null
        }
        Relationships: []
      }
      challenge_summary: {
        Row: {
          challenge_id: string | null
          effective_status: string | null
          linked_item_count: number | null
          participant_count: number | null
        }
        Relationships: []
      }
      collaborator_performance_all_time: {
        Row: {
          audits_assigned: number | null
          audits_completed: number | null
          challenges_active: number | null
          challenges_won: number | null
          clients_linked: number | null
          collaborator_color: string | null
          collaborator_id: string | null
          collaborator_name: string | null
          comments_authored: number | null
          deliverables_completed: number | null
          deliverables_total: number | null
          official_star_balance: number | null
          photo_url: string | null
          priorities_completed: number | null
          priorities_total: number | null
          tasks_completed: number | null
          tasks_overdue: number | null
          tasks_total: number | null
        }
        Relationships: []
      }
      collaborator_performance_monthly: {
        Row: {
          collaborator_id: string | null
          comments_authored: number | null
          month_start: string | null
          stars_delta: number | null
          tasks_completed: number | null
        }
        Relationships: []
      }
      collaborator_star_balances: {
        Row: {
          balance: number | null
          collaborator_color: string | null
          collaborator_id: string | null
          collaborator_name: string | null
          credits: number | null
          debits: number | null
          photo_url: string | null
        }
        Relationships: []
      }
      star_treasury_summary: {
        Row: {
          collective_balance: number | null
          total_credits: number | null
          total_debits: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_universe_challenge: {
        Args: {
          p_actor_name?: string
          p_challenge_id: string
          p_collaborator_id: string
        }
        Returns: undefined
      }
      approve_challenge_as_unrewarded: {
        Args: { p_actor_name?: string; p_challenge_id: string }
        Returns: undefined
      }
      backfill_star_sources: { Args: { p_actor_name?: string }; Returns: Json }
      cleanup_old_activity_logs: { Args: never; Returns: undefined }
      clear_challenge_completion_conditions: {
        Args: { p_actor_name?: string; p_challenge_id: string }
        Returns: number
      }
      close_audit: {
        Args: { p_actor_name?: string; p_audit_id: string }
        Returns: undefined
      }
      configure_challenge_reward: {
        Args: {
          p_actor_name?: string
          p_challenge_ids: string[]
          p_note?: string
          p_penalty_stars?: number
          p_reward_stars?: number
          p_reward_status?: string
          p_reward_superstars?: number
        }
        Returns: number
      }
      create_challenge: {
        Args: {
          p_actor_name?: string
          p_client_id?: string
          p_description: string
          p_due_at?: string
          p_items?: Json
          p_participant_ids?: string[]
          p_penalty_stars?: number
          p_reward_superstars?: number
          p_success_criteria: string
          p_title: string
        }
        Returns: string
      }
      create_universe_challenge: {
        Args: {
          p_actor_name?: string
          p_challenge_kind?: string
          p_client_id?: string
          p_completion_mode?: string
          p_description?: string
          p_due_at?: string
          p_evidence_requirements?: string
          p_expected_deliverable?: string
          p_participant_ids?: string[]
          p_penalty_stars?: number
          p_reward_superstars?: number
          p_success_criteria?: string
          p_title: string
        }
        Returns: string
      }
      credit_deliverable_rating: {
        Args: { p_actor_name?: string; p_rating_id: string; p_version: string }
        Returns: undefined
      }
      delete_universe_challenges: {
        Args: { p_actor_name?: string; p_challenge_ids: string[] }
        Returns: number
      }
      grant_manual_stars: {
        Args: {
          p_actor_name?: string
          p_amount: number
          p_collaborator_id: string
          p_is_penalty?: boolean
          p_reason: string
          p_request_id?: string
        }
        Returns: string
      }
      grant_opening_stars: {
        Args: {
          p_actor_name?: string
          p_amount?: number
          p_batch_id?: string
          p_collaborator_ids: string[]
          p_reason?: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_universe_challenge: {
        Args: {
          p_actor_name?: string
          p_challenge_kind?: string
          p_client_id?: string
          p_completion_mode?: string
          p_description?: string
          p_due_at?: string
          p_evidence_requirements?: string
          p_expected_deliverable?: string
          p_import_key: string
          p_participant_ids?: string[]
          p_penalty_stars?: number
          p_reward_superstars?: number
          p_status?: string
          p_success_criteria?: string
          p_title: string
        }
        Returns: string
      }
      insert_star_transaction: {
        Args: {
          p_actor_name?: string
          p_amount: number
          p_collaborator_id: string
          p_idempotency_key: string
          p_metadata?: Json
          p_reason: string
          p_reverses_transaction_id?: string
          p_settlement_id?: string
          p_source_id: string
          p_source_type: string
          p_transaction_type: string
        }
        Returns: string
      }
      open_audit: {
        Args: {
          p_actor_name?: string
          p_criteria?: string[]
          p_description?: string
          p_due_at?: string
          p_objective?: string
          p_starts_at?: string
          p_title: string
        }
        Returns: string
      }
      recalculate_pending_ciencia: {
        Args: { p_client_id: string }
        Returns: undefined
      }
      record_challenge_resolution_transactions: {
        Args: { p_actor_name?: string; p_challenge_id: string }
        Returns: undefined
      }
      refresh_overdue_challenges: {
        Args: { p_actor_name?: string }
        Returns: number
      }
      remove_deliverable_rating: {
        Args: {
          p_actor_name?: string
          p_deliverable_id: string
          p_rater_name: string
        }
        Returns: undefined
      }
      replace_challenge_completion_conditions: {
        Args: {
          p_actor_name?: string
          p_challenge_id: string
          p_conditions: Json
        }
        Returns: undefined
      }
      request_challenge_value: {
        Args: {
          p_actor_name?: string
          p_challenge_id: string
          p_collaborator_id: string
          p_justification: string
        }
        Returns: string
      }
      resolve_challenge: {
        Args: {
          p_actor_name?: string
          p_challenge_id: string
          p_outcome: string
          p_resolution_notes?: string
        }
        Returns: string
      }
      reverse_active_rating_transactions: {
        Args: { p_actor_name?: string; p_rating_id: string; p_reason: string }
        Returns: undefined
      }
      reverse_star_transaction: {
        Args: {
          p_actor_name?: string
          p_reason: string
          p_transaction_id: string
        }
        Returns: string
      }
      review_challenge_value_request: {
        Args: {
          p_actor_name?: string
          p_admin_note?: string
          p_request_id: string
          p_status: string
        }
        Returns: undefined
      }
      set_challenge_completion_condition: {
        Args: {
          p_actor_name?: string
          p_completed: boolean
          p_condition_id: string
        }
        Returns: undefined
      }
      set_challenge_completion_mode: {
        Args: {
          p_actor_name?: string
          p_challenge_id: string
          p_completion_mode: string
        }
        Returns: undefined
      }
      set_deliverable_rating: {
        Args: {
          p_actor_name?: string
          p_deliverable_id: string
          p_rater_name: string
          p_rating_type: string
          p_value?: number
        }
        Returns: string
      }
      settle_star_balances: {
        Args: {
          p_actor_name?: string
          p_collaborator_ids: string[]
          p_notes?: string
          p_period_end?: string
          p_period_start?: string
          p_star_to_brl?: number
        }
        Returns: string
      }
      update_audit_client_item: {
        Args: {
          p_actor_name?: string
          p_item_id: string
          p_notes?: string
          p_status: string
        }
        Returns: undefined
      }
      update_audit_client_result: {
        Args: {
          p_actor_name?: string
          p_evidence_url?: string
          p_notes?: string
          p_result: string
          p_result_id: string
        }
        Returns: undefined
      }
      update_universe_challenge: {
        Args: {
          p_actor_name?: string
          p_challenge_id: string
          p_challenge_kind?: string
          p_client_id?: string
          p_completion_mode?: string
          p_description?: string
          p_due_at?: string
          p_evidence_requirements?: string
          p_expected_deliverable?: string
          p_success_criteria?: string
          p_title: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      demand_status: "CONCLUIDO" | "EM_EXECUCAO" | "NAO_FEITO" | "CANCELADO"
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
      app_role: ["admin", "user"],
      demand_status: ["CONCLUIDO", "EM_EXECUCAO", "NAO_FEITO", "CANCELADO"],
    },
  },
} as const
