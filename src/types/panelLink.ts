export interface PanelLink {
  id: string;
  name: string;
  description: string | null;
  url: string;
  panel_type: string;
  display_order: number;
  is_active: boolean;
  icon_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PanelLinkFormData {
  name: string;
  description?: string;
  url: string;
  panel_type: string;
  display_order: number;
  is_active: boolean;
  icon_name?: string;
}

export const PANEL_TYPES = [
  'Operacional',
  'Estratégico',
  'Diagnóstico',
  'Relatório',
] as const;
