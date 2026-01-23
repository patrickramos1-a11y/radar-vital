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
          name: string
          notif_atendida_count: number
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
          name: string
          notif_atendida_count?: number
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
          name?: string
          notif_atendida_count?: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
