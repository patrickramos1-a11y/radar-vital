// PDF Import Types

export interface PdfImport {
  id: string;
  file_name: string;
  file_url: string | null;
  file_hash: string | null;
  file_size: number | null;
  imported_by: string;
  status: 'uploaded' | 'parsing' | 'ready' | 'imported' | 'error';
  report_period_year: number | null;
  report_period_month: number | null;
  raw_metadata: Record<string, unknown> | null;
  total_clients_detected: number;
  total_clients_matched: number;
  total_clients_pending: number;
  total_clients_unmatched: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PdfDetectedClient {
  id: string;
  pdf_import_id: string;
  client_name_raw: string;
  client_name_normalized: string;
  matched_client_id: string | null;
  match_status: 'auto' | 'linked' | 'pending' | 'unmatched';
  match_score: number | null;
  source_pages: number[] | null;
  created_at: string;
  // Joined data
  matched_client?: {
    id: string;
    name: string;
    initials: string;
    logo_url: string | null;
  };
}

export interface PdfMetric {
  id: string;
  pdf_import_id: string;
  pdf_detected_client_id: string | null;
  client_id: string | null;
  metric_key: string;
  metric_label: string;
  metric_value_number: number | null;
  metric_value_text: string | null;
  metric_unit: string | null;
  source_pages: number[] | null;
  created_at: string;
}

export interface PdfClientAlias {
  id: string;
  alias_normalized: string;
  client_id: string;
  created_by: string;
  created_at: string;
}

// Parsed PDF data structure
export interface ParsedPdfData {
  period: {
    year: number | null;
    month: number | null;
  };
  clients: ParsedClientData[];
  rawText: string;
}

export interface ParsedClientData {
  name: string;
  nameNormalized: string;
  metrics: {
    key: string;
    label: string;
    value: number | null;
  }[];
  sourcePage: number;
}

// Matching result
export interface ClientMatchResult {
  pdfClientName: string;
  pdfClientNameNormalized: string;
  matchedClientId: string | null;
  matchedClientName: string | null;
  matchStatus: 'auto' | 'linked' | 'pending' | 'unmatched';
  matchScore: number | null;
  suggestions?: {
    clientId: string;
    clientName: string;
    score: number;
  }[];
  metrics: ParsedClientData['metrics'];
  sourcePage: number;
}

// Wizard state
export type ImportWizardStep = 'upload' | 'parsing' | 'correlation' | 'preview' | 'complete';

export interface ImportWizardState {
  step: ImportWizardStep;
  file: File | null;
  pdfImportId: string | null;
  parsedData: ParsedPdfData | null;
  matchResults: ClientMatchResult[];
  isProcessing: boolean;
  error: string | null;
}