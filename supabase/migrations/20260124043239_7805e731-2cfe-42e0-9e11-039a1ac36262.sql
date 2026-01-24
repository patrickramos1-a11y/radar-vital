-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-reports', 'pdf-reports', false);

-- Storage policies for pdf-reports bucket
CREATE POLICY "Anyone can upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdf-reports');

CREATE POLICY "Anyone can view PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdf-reports');

CREATE POLICY "Anyone can delete PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'pdf-reports');

-- Table: pdf_imports - Main import records
CREATE TABLE public.pdf_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_hash TEXT,
  file_size INTEGER,
  imported_by TEXT NOT NULL DEFAULT 'Sistema',
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'parsing', 'ready', 'imported', 'error')),
  report_period_year INTEGER,
  report_period_month INTEGER,
  raw_metadata JSONB,
  total_clients_detected INTEGER DEFAULT 0,
  total_clients_matched INTEGER DEFAULT 0,
  total_clients_pending INTEGER DEFAULT 0,
  total_clients_unmatched INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: pdf_detected_clients - Clients detected in PDF
CREATE TABLE public.pdf_detected_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_import_id UUID NOT NULL REFERENCES public.pdf_imports(id) ON DELETE CASCADE,
  client_name_raw TEXT NOT NULL,
  client_name_normalized TEXT NOT NULL,
  matched_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  match_status TEXT NOT NULL DEFAULT 'pending' CHECK (match_status IN ('auto', 'linked', 'pending', 'unmatched')),
  match_score NUMERIC(5,4),
  source_pages INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: pdf_metrics - Flexible metrics storage
CREATE TABLE public.pdf_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_import_id UUID NOT NULL REFERENCES public.pdf_imports(id) ON DELETE CASCADE,
  pdf_detected_client_id UUID REFERENCES public.pdf_detected_clients(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  metric_key TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  metric_value_number NUMERIC,
  metric_value_text TEXT,
  metric_unit TEXT,
  source_pages INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: pdf_client_aliases - Manual alias mappings for future imports
CREATE TABLE public.pdf_client_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias_normalized TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_detected_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_client_aliases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_imports
CREATE POLICY "Public read pdf_imports" ON public.pdf_imports FOR SELECT USING (true);
CREATE POLICY "Public insert pdf_imports" ON public.pdf_imports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update pdf_imports" ON public.pdf_imports FOR UPDATE USING (true);
CREATE POLICY "Public delete pdf_imports" ON public.pdf_imports FOR DELETE USING (true);

-- RLS Policies for pdf_detected_clients
CREATE POLICY "Public read pdf_detected_clients" ON public.pdf_detected_clients FOR SELECT USING (true);
CREATE POLICY "Public insert pdf_detected_clients" ON public.pdf_detected_clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update pdf_detected_clients" ON public.pdf_detected_clients FOR UPDATE USING (true);
CREATE POLICY "Public delete pdf_detected_clients" ON public.pdf_detected_clients FOR DELETE USING (true);

-- RLS Policies for pdf_metrics
CREATE POLICY "Public read pdf_metrics" ON public.pdf_metrics FOR SELECT USING (true);
CREATE POLICY "Public insert pdf_metrics" ON public.pdf_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update pdf_metrics" ON public.pdf_metrics FOR UPDATE USING (true);
CREATE POLICY "Public delete pdf_metrics" ON public.pdf_metrics FOR DELETE USING (true);

-- RLS Policies for pdf_client_aliases
CREATE POLICY "Public read pdf_client_aliases" ON public.pdf_client_aliases FOR SELECT USING (true);
CREATE POLICY "Public insert pdf_client_aliases" ON public.pdf_client_aliases FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update pdf_client_aliases" ON public.pdf_client_aliases FOR UPDATE USING (true);
CREATE POLICY "Public delete pdf_client_aliases" ON public.pdf_client_aliases FOR DELETE USING (true);

-- Trigger for updated_at on pdf_imports
CREATE TRIGGER update_pdf_imports_updated_at
  BEFORE UPDATE ON public.pdf_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clients_updated_at();

-- Index for faster lookups
CREATE INDEX idx_pdf_detected_clients_import_id ON public.pdf_detected_clients(pdf_import_id);
CREATE INDEX idx_pdf_detected_clients_match_status ON public.pdf_detected_clients(match_status);
CREATE INDEX idx_pdf_metrics_import_id ON public.pdf_metrics(pdf_import_id);
CREATE INDEX idx_pdf_metrics_client_id ON public.pdf_metrics(client_id);
CREATE INDEX idx_pdf_client_aliases_normalized ON public.pdf_client_aliases(alias_normalized);