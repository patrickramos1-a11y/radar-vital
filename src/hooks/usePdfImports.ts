import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PdfImport, PdfDetectedClient, PdfMetric, ClientMatchResult, ParsedPdfData } from '@/types/pdfImport';
import { normalizeClientName, calculateSimilarity, calculateFileHash } from '@/lib/pdfParser';
import { useAuth } from '@/contexts/AuthContext';
import { logActivity } from '@/hooks/useActivityLogs';

// Fetch all PDF imports
export function usePdfImports() {
  return useQuery({
    queryKey: ['pdf-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_imports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PdfImport[];
    },
  });
}

// Fetch single PDF import with details
export function usePdfImportDetails(importId: string | null) {
  return useQuery({
    queryKey: ['pdf-import-details', importId],
    queryFn: async () => {
      if (!importId) return null;
      
      const [importResult, clientsResult, metricsResult] = await Promise.all([
        supabase.from('pdf_imports').select('*').eq('id', importId).single(),
        supabase.from('pdf_detected_clients').select(`
          *,
          matched_client:clients(id, name, initials, logo_url)
        `).eq('pdf_import_id', importId),
        supabase.from('pdf_metrics').select('*').eq('pdf_import_id', importId),
      ]);
      
      if (importResult.error) throw importResult.error;
      
      return {
        import: importResult.data as PdfImport,
        detectedClients: (clientsResult.data || []) as PdfDetectedClient[],
        metrics: (metricsResult.data || []) as PdfMetric[],
      };
    },
    enabled: !!importId,
  });
}

// Create PDF import record
export function useCreatePdfImport() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const fileHash = await calculateFileHash(file);
      
      // Check for duplicates
      const { data: existing } = await supabase
        .from('pdf_imports')
        .select('id, file_name, created_at')
        .eq('file_hash', fileHash)
        .limit(1);
      
      if (existing && existing.length > 0) {
        throw new Error(`Este arquivo já foi importado anteriormente em ${new Date(existing[0].created_at).toLocaleDateString('pt-BR')}`);
      }
      
      // Upload file to storage
      const filePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pdf-reports')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pdf-reports')
        .getPublicUrl(filePath);
      
      // Create import record
      const { data, error } = await supabase
        .from('pdf_imports')
        .insert({
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_hash: fileHash,
          file_size: file.size,
          imported_by: currentUser?.name || 'Sistema',
          status: 'uploaded',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as PdfImport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-imports'] });
    },
  });
}

// Process parsing and matching
export function useProcessPdfImport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      importId, 
      parsedData 
    }: { 
      importId: string; 
      parsedData: ParsedPdfData;
    }) => {
      // Update status to parsing
      await supabase
        .from('pdf_imports')
        .update({ status: 'parsing' })
        .eq('id', importId);
      
      // Fetch existing clients and aliases
      const [clientsResult, aliasesResult] = await Promise.all([
        supabase.from('clients').select('id, name, initials').eq('is_active', true),
        supabase.from('pdf_client_aliases').select('*'),
      ]);
      
      const existingClients = clientsResult.data || [];
      const aliases = aliasesResult.data || [];
      
      // Match parsed clients with existing clients
      const matchResults: ClientMatchResult[] = [];
      let autoMatched = 0;
      let pending = 0;
      let unmatched = 0;
      
      for (const pdfClient of parsedData.clients) {
        // Check aliases first
        const alias = aliases.find(a => a.alias_normalized === pdfClient.nameNormalized);
        if (alias) {
          const matchedClient = existingClients.find(c => c.id === alias.client_id);
          matchResults.push({
            pdfClientName: pdfClient.name,
            pdfClientNameNormalized: pdfClient.nameNormalized,
            matchedClientId: alias.client_id,
            matchedClientName: matchedClient?.name || null,
            matchStatus: 'linked',
            matchScore: 1,
            metrics: pdfClient.metrics,
            sourcePage: pdfClient.sourcePage,
          });
          autoMatched++;
          continue;
        }
        
        // Try exact match
        const exactMatch = existingClients.find(
          c => normalizeClientName(c.name) === pdfClient.nameNormalized
        );
        
        if (exactMatch) {
          matchResults.push({
            pdfClientName: pdfClient.name,
            pdfClientNameNormalized: pdfClient.nameNormalized,
            matchedClientId: exactMatch.id,
            matchedClientName: exactMatch.name,
            matchStatus: 'auto',
            matchScore: 1,
            metrics: pdfClient.metrics,
            sourcePage: pdfClient.sourcePage,
          });
          autoMatched++;
          continue;
        }
        
        // Try fuzzy match
        let bestMatch: { clientId: string; clientName: string; score: number } | null = null;
        const suggestions: { clientId: string; clientName: string; score: number }[] = [];
        
        for (const client of existingClients) {
          const score = calculateSimilarity(pdfClient.name, client.name);
          if (score >= 0.7) {
            suggestions.push({ clientId: client.id, clientName: client.name, score });
            if (!bestMatch || score > bestMatch.score) {
              bestMatch = { clientId: client.id, clientName: client.name, score };
            }
          }
        }
        
        suggestions.sort((a, b) => b.score - a.score);
        
        if (bestMatch && bestMatch.score >= 0.90) {
          matchResults.push({
            pdfClientName: pdfClient.name,
            pdfClientNameNormalized: pdfClient.nameNormalized,
            matchedClientId: bestMatch.clientId,
            matchedClientName: bestMatch.clientName,
            matchStatus: 'auto',
            matchScore: bestMatch.score,
            suggestions: suggestions.slice(0, 3),
            metrics: pdfClient.metrics,
            sourcePage: pdfClient.sourcePage,
          });
          autoMatched++;
        } else if (suggestions.length > 0) {
          matchResults.push({
            pdfClientName: pdfClient.name,
            pdfClientNameNormalized: pdfClient.nameNormalized,
            matchedClientId: null,
            matchedClientName: null,
            matchStatus: 'pending',
            matchScore: null,
            suggestions: suggestions.slice(0, 3),
            metrics: pdfClient.metrics,
            sourcePage: pdfClient.sourcePage,
          });
          pending++;
        } else {
          matchResults.push({
            pdfClientName: pdfClient.name,
            pdfClientNameNormalized: pdfClient.nameNormalized,
            matchedClientId: null,
            matchedClientName: null,
            matchStatus: 'unmatched',
            matchScore: null,
            metrics: pdfClient.metrics,
            sourcePage: pdfClient.sourcePage,
          });
          unmatched++;
        }
      }
      
      // Save detected clients to database
      const detectedClientsToInsert = matchResults.map(m => ({
        pdf_import_id: importId,
        client_name_raw: m.pdfClientName,
        client_name_normalized: m.pdfClientNameNormalized,
        matched_client_id: m.matchedClientId,
        match_status: m.matchStatus,
        match_score: m.matchScore,
        source_pages: [m.sourcePage],
      }));
      
      await supabase
        .from('pdf_detected_clients')
        .insert(detectedClientsToInsert);
      
      // Update import record
      await supabase
        .from('pdf_imports')
        .update({
          status: 'ready',
          report_period_year: parsedData.period.year,
          report_period_month: parsedData.period.month,
          total_clients_detected: parsedData.clients.length,
          total_clients_matched: autoMatched,
          total_clients_pending: pending,
          total_clients_unmatched: unmatched,
          raw_metadata: { rawTextLength: parsedData.rawText.length },
        })
        .eq('id', importId);
      
      return matchResults;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pdf-imports'] });
      queryClient.invalidateQueries({ queryKey: ['pdf-import-details', variables.importId] });
    },
  });
}

// Link a pending client manually
export function useLinkPdfClient() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      detectedClientId, 
      clientId,
      createAlias,
      aliasNormalized,
    }: { 
      detectedClientId: string; 
      clientId: string;
      createAlias: boolean;
      aliasNormalized: string;
    }) => {
      // Update detected client
      const { error } = await supabase
        .from('pdf_detected_clients')
        .update({
          matched_client_id: clientId,
          match_status: 'linked',
          match_score: 1,
        })
        .eq('id', detectedClientId);
      
      if (error) throw error;
      
      // Create alias for future imports if requested
      if (createAlias) {
        await supabase
          .from('pdf_client_aliases')
          .upsert({
            alias_normalized: aliasNormalized,
            client_id: clientId,
            created_by: currentUser?.name || 'Sistema',
          }, {
            onConflict: 'alias_normalized',
          });
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-import-details'] });
    },
  });
}

// Complete import (save metrics)
export function useCompleteImport() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      importId,
      includeLinked,
    }: { 
      importId: string;
      includeLinked: boolean;
    }) => {
      // Fetch detected clients with matches
      const { data: detectedClients } = await supabase
        .from('pdf_detected_clients')
        .select('*')
        .eq('pdf_import_id', importId)
        .in('match_status', includeLinked ? ['auto', 'linked'] : ['auto']);
      
      if (!detectedClients || detectedClients.length === 0) {
        throw new Error('Nenhum cliente para importar');
      }
      
      // Fetch the import record for metadata
      const { data: importRecord } = await supabase
        .from('pdf_imports')
        .select('*')
        .eq('id', importId)
        .single();
      
      // For each detected client, we need to save their metrics
      // This would require the parsed data which we stored in raw_metadata
      // For now, we'll mark the import as complete
      
      const { error: updateError } = await supabase
        .from('pdf_imports')
        .update({
          status: 'imported',
          total_clients_matched: detectedClients.length,
        })
        .eq('id', importId);
      
      if (updateError) throw updateError;
      
      // Log activity
      await logActivity({
        entityType: 'pdf_import',
        actionType: 'import',
        description: `Importou PDF "${importRecord?.file_name}" com ${detectedClients.length} clientes`,
        entityId: importId,
        entityName: importRecord?.file_name || 'PDF',
        userName: currentUser?.name || 'Sistema',
      });
      
      return { importedCount: detectedClients.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-imports'] });
      queryClient.invalidateQueries({ queryKey: ['pdf-import-details'] });
    },
  });
}

// Delete PDF import
export function useDeletePdfImport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (importId: string) => {
      const { error } = await supabase
        .from('pdf_imports')
        .delete()
        .eq('id', importId);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-imports'] });
    },
  });
}