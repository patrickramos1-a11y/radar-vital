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
      apt_demands: {
        Row: {
          ano: number
          aprovado_gestor: string
          created_at: string
          descricao: string
          feito_responsavel: string
          id: string
          is_active: boolean
          is_highlighted: boolean
          mes: number
          numero: number
          repeticoes: number
          responsavel: string
          semana_limite: number
          setor: string
          updated_at: string
        }
        Insert: {
          ano: number
          aprovado_gestor?: string
          created_at?: string
          descricao: string
          feito_responsavel?: string
          id?: string
          is_active?: boolean
          is_highlighted?: boolean
          mes: number
          numero: number
          repeticoes?: number
          responsavel: string
          semana_limite?: number
          setor: string
          updated_at?: string
        }
        Update: {
          ano?: number
          aprovado_gestor?: string
          created_at?: string
          descricao?: string
          feito_responsavel?: string
          id?: string
          is_active?: boolean
          is_highlighted?: boolean
          mes?: number
          numero?: number
          repeticoes?: number
          responsavel?: string
          semana_limite?: number
          setor?: string
          updated_at?: string
        }
        Relationships: []
      }
      backlog_attachments: {
        Row: {
          backlog_item_id: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          backlog_item_id: string
          created_at?: string
          file_name: string
          file_size?: number
          file_type: string
          file_url: string
          id?: string
          uploaded_by?: string
        }
        Update: {
          backlog_item_id?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_attachments_backlog_item_id_fkey"
            columns: ["backlog_item_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_history: {
        Row: {
          backlog_item_id: string
          created_at: string
          description: string
          event_type: string
          id: string
          new_value: string | null
          old_value: string | null
          user_name: string
        }
        Insert: {
          backlog_item_id: string
          created_at?: string
          description: string
          event_type: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_name?: string
        }
        Update: {
          backlog_item_id?: string
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_history_backlog_item_id_fkey"
            columns: ["backlog_item_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_implementations: {
        Row: {
          backlog_item_id: string
          created_at: string
          data_execucao: string | null
          descricao: string
          id: string
          responsavel: string
          status: string
        }
        Insert: {
          backlog_item_id: string
          created_at?: string
          data_execucao?: string | null
          descricao: string
          id?: string
          responsavel: string
          status?: string
        }
        Update: {
          backlog_item_id?: string
          created_at?: string
          data_execucao?: string | null
          descricao?: string
          id?: string
          responsavel?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_implementations_backlog_item_id_fkey"
            columns: ["backlog_item_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_items: {
        Row: {
          categoria: string
          created_at: string
          data_conclusao: string | null
          data_criacao: string
          data_inicio_implementacao: string | null
          data_lancamento: string | null
          dependente_de_creditos: boolean
          descricao_detalhada: string | null
          estimativa_esforco: string
          id: string
          impacto_esperado: string
          modulos_impactados: string[]
          prioridade: string
          responsavel_produto: string
          responsavel_tecnico: string | null
          status_backlog: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria: string
          created_at?: string
          data_conclusao?: string | null
          data_criacao?: string
          data_inicio_implementacao?: string | null
          data_lancamento?: string | null
          dependente_de_creditos?: boolean
          descricao_detalhada?: string | null
          estimativa_esforco?: string
          id?: string
          impacto_esperado?: string
          modulos_impactados?: string[]
          prioridade?: string
          responsavel_produto: string
          responsavel_tecnico?: string | null
          status_backlog?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          data_conclusao?: string | null
          data_criacao?: string
          data_inicio_implementacao?: string | null
          data_lancamento?: string | null
          dependente_de_creditos?: boolean
          descricao_detalhada?: string | null
          estimativa_esforco?: string
          id?: string
          impacto_esperado?: string
          modulos_impactados?: string[]
          prioridade?: string
          responsavel_produto?: string
          responsavel_tecnico?: string | null
          status_backlog?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_comments: {
        Row: {
          author_name: string
          author_user_id: string | null
          client_id: string
          comment_text: string
          created_at: string
          id: string
          is_pinned: boolean
          read_celine: boolean
          read_darley: boolean
          read_gabi: boolean
          read_patrick: boolean
          read_vanessa: boolean
        }
        Insert: {
          author_name?: string
          author_user_id?: string | null
          client_id: string
          comment_text: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          read_celine?: boolean
          read_darley?: boolean
          read_gabi?: boolean
          read_patrick?: boolean
          read_vanessa?: boolean
        }
        Update: {
          author_name?: string
          author_user_id?: string | null
          client_id?: string
          comment_text?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          read_celine?: boolean
          read_darley?: boolean
          read_gabi?: boolean
          read_patrick?: boolean
          read_vanessa?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "client_comments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      collaborators: {
        Row: {
          color: string
          created_at: string
          email: string | null
          id: string
          initials: string
          is_active: boolean
          name: string
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
          name: string
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
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      demands: {
        Row: {
          client_id: string | null
          codigo: string | null
          comentario: string | null
          created_at: string
          data: string | null
          descricao: string
          empresa_excel: string
          id: string
          imported_at: string
          origem: string | null
          plano: string | null
          responsavel: string | null
          status: Database["public"]["Enums"]["demand_status"]
          subtopico: string | null
          topico: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          codigo?: string | null
          comentario?: string | null
          created_at?: string
          data?: string | null
          descricao: string
          empresa_excel: string
          id?: string
          imported_at?: string
          origem?: string | null
          plano?: string | null
          responsavel?: string | null
          status?: Database["public"]["Enums"]["demand_status"]
          subtopico?: string | null
          topico?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          codigo?: string | null
          comentario?: string | null
          created_at?: string
          data?: string | null
          descricao?: string
          empresa_excel?: string
          id?: string
          imported_at?: string
          origem?: string | null
          plano?: string | null
          responsavel?: string | null
          status?: Database["public"]["Enums"]["demand_status"]
          subtopico?: string | null
          topico?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demands_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          client_id: string | null
          created_at: string
          data_emissao: string | null
          empresa_excel: string
          id: string
          licenca: string | null
          num_processo: string | null
          status_calculado: string
          tipo_licenca: string | null
          updated_at: string
          vencimento: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          data_emissao?: string | null
          empresa_excel: string
          id?: string
          licenca?: string | null
          num_processo?: string | null
          status_calculado?: string
          tipo_licenca?: string | null
          updated_at?: string
          vencimento?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          data_emissao?: string | null
          empresa_excel?: string
          id?: string
          licenca?: string | null
          num_processo?: string | null
          status_calculado?: string
          tipo_licenca?: string | null
          updated_at?: string
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          client_id: string | null
          created_at: string
          data_recebimento: string | null
          descricao: string | null
          empresa_excel: string
          id: string
          numero_notificacao: string
          numero_processo: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          descricao?: string | null
          empresa_excel: string
          id?: string
          numero_notificacao: string
          numero_processo?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          descricao?: string | null
          empresa_excel?: string
          id?: string
          numero_notificacao?: string
          numero_processo?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      processes: {
        Row: {
          client_id: string | null
          created_at: string
          data_protocolo: string | null
          empresa_excel: string
          id: string
          numero_processo: string | null
          status: string
          tipo_processo: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          data_protocolo?: string | null
          empresa_excel: string
          id?: string
          numero_processo?: string | null
          status?: string
          tipo_processo?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          data_protocolo?: string | null
          empresa_excel?: string
          id?: string
          numero_processo?: string | null
          status?: string
          tipo_processo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_client_id_fkey"
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
      tasks: {
        Row: {
          assigned_to: string | null
          client_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
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
      cleanup_old_activity_logs: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_client_condicionantes: {
        Args: { p_client_id: string }
        Returns: undefined
      }
      recalculate_client_demands: {
        Args: { p_client_id: string }
        Returns: undefined
      }
      recalculate_client_notifications: {
        Args: { p_client_id: string }
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
