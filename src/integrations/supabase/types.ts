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
          actor_user_id: string | null
          client_name: string | null
          created_at: string
          description: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json
          new_value: string | null
          old_value: string | null
          user_name: string
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          client_name?: string | null
          created_at?: string
          description: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          new_value?: string | null
          old_value?: string | null
          user_name: string
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          client_name?: string | null
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          new_value?: string | null
          old_value?: string | null
          user_name?: string
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
          actor_user_id: string
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
        Relationships: []
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
          created_by: string
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
          actor_user_id: string
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      challenges: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string
          id: string
          penalty_stars: number
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          reward_superstars: number
          status: string
          success_criteria: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_at: string
          id?: string
          penalty_stars?: number
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reward_superstars?: number
          status?: string
          success_criteria: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string
          id?: string
          penalty_stars?: number
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reward_superstars?: number
          status?: string
          success_criteria?: string
          title?: string
          updated_at?: string
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
          updated_at?: string
        }
        Relationships: []
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
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          deliverable_id: string
          id?: string
          rater_name: string
          rating_type: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          deliverable_id?: string
          id?: string
          rater_name?: string
          rating_type?: string
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
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      bootstrap_current_profile: { Args: never; Returns: string | null }
      cleanup_old_activity_logs: { Args: never; Returns: undefined }
      current_collaborator_id: { Args: never; Returns: string | null }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_auth_enforced: { Args: never; Returns: boolean }
      create_challenge: {
        Args: {
          p_client_id?: string | null
          p_description?: string | null
          p_due_at?: string | null
          p_items?: Json
          p_participant_ids?: string[]
          p_penalty_stars?: number
          p_reward_superstars?: number
          p_success_criteria: string
          p_title: string
        }
        Returns: string
      }
      open_audit: {
        Args: {
          p_criteria?: string[]
          p_description?: string | null
          p_due_at?: string | null
          p_objective?: string | null
          p_starts_at?: string
          p_title: string
        }
        Returns: string
      }
      refresh_overdue_challenges: { Args: never; Returns: number }
      recalculate_pending_ciencia: {
        Args: { p_client_id: string }
        Returns: undefined
      }
      set_auth_enforced: {
        Args: { enabled: boolean }
        Returns: undefined
      }
      resolve_challenge: {
        Args: {
          p_challenge_id: string
          p_outcome: string
          p_resolution_notes?: string | null
        }
        Returns: string
      }
      close_audit: {
        Args: { p_audit_id: string }
        Returns: undefined
      }
      update_audit_client_item: {
        Args: {
          p_item_id: string
          p_notes?: string | null
          p_status: string
        }
        Returns: undefined
      }
      update_audit_client_result: {
        Args: {
          p_evidence_url?: string | null
          p_notes?: string | null
          p_result: string
          p_result_id: string
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
