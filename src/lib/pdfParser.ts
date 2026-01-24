import * as pdfjsLib from 'pdfjs-dist';
import type { ParsedPdfData, ParsedClientData } from '@/types/pdfImport';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Normalize company name for matching
export function normalizeClientName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s*[-/]\s*/g, ' ') // Replace hyphens and slashes with space
    .replace(/\b(LTDA|ME|EPP|EIRELI|S\/A|SA|S\.A\.|INDUSTRIA|COMERCIO|IND|COM)\b/gi, '')
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

// Levenshtein distance for similarity
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity score (0-1)
export function calculateSimilarity(a: string, b: string): number {
  const normalizedA = normalizeClientName(a);
  const normalizedB = normalizeClientName(b);
  
  if (normalizedA === normalizedB) return 1;
  
  const maxLen = Math.max(normalizedA.length, normalizedB.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(normalizedA, normalizedB);
  return 1 - distance / maxLen;
}

// Parse the PDF text and extract client data
async function extractTextFromPdf(file: File): Promise<{ pages: string[]; rawText: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const pages: string[] = [];
  let rawText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: unknown) => (item as { str: string }).str)
      .join(' ');
    pages.push(pageText);
    rawText += pageText + '\n\n';
  }
  
  return { pages, rawText };
}

// Metric definitions for parsing
const METRIC_DEFINITIONS = [
  { key: 'cancelado', label: 'Cancelado', column: 3 },
  { key: 'em_execucao', label: 'Em Execução', column: 4 },
  { key: 'nao_feito', label: 'Não Feito', column: 5 },
  { key: 'concluido', label: 'Concluído', column: 6 },
  { key: 'total', label: 'Total', column: 7 },
  { key: 'licencas', label: 'Licenças', column: 8 },
  { key: 'protocolos', label: 'Protocolos', column: 9 },
  { key: 'projetos', label: 'Projetos', column: 10 },
  { key: 'taxas', label: 'Taxas', column: 11 },
  { key: 'contatos', label: 'Contatos', column: 12 },
];

// Parse table rows from text
function parseTableRow(text: string): { year: number; month: number; company: string; values: number[] } | null {
  // Pattern: Year Month CompanyName numbers...
  // Example: 2025 9 4 ELEMENTOS 7 1 3 11 22 3 0 1 1 37
  const pattern = /(\d{4})\s+(\d{1,2})\s+([A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇ\s\-\/\.]+?)(?:\s+(\d+))+/i;
  const match = text.match(pattern);
  
  if (!match) return null;
  
  const year = parseInt(match[1]);
  const month = parseInt(match[2]);
  const company = match[3].trim();
  
  // Extract all numbers after company name
  const numbersMatch = text.slice(text.indexOf(company) + company.length).match(/\d+/g);
  const values = numbersMatch ? numbersMatch.map(n => parseInt(n)) : [];
  
  return { year, month, company, values };
}

// Main PDF parsing function
export async function parsePdf(file: File): Promise<ParsedPdfData> {
  const { pages, rawText } = await extractTextFromPdf(file);
  
  const clients: ParsedClientData[] = [];
  let detectedYear: number | null = null;
  let detectedMonth: number | null = null;
  
  // Process each page
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const pageText = pages[pageIndex];
    
    // Split by potential row separators
    const lines = pageText.split(/(?=\d{4}\s+\d{1,2}\s+[A-Z])/i);
    
    for (const line of lines) {
      if (line.includes('Totais:')) continue; // Skip totals row
      
      const parsed = parseTableRow(line);
      if (parsed && parsed.company && parsed.company.length > 2) {
        if (!detectedYear) detectedYear = parsed.year;
        if (!detectedMonth) detectedMonth = parsed.month;
        
        const metrics: ParsedClientData['metrics'] = [];
        
        METRIC_DEFINITIONS.forEach((def, index) => {
          if (parsed.values[index] !== undefined) {
            metrics.push({
              key: def.key,
              label: def.label,
              value: parsed.values[index],
            });
          }
        });
        
        // Check if company already exists (avoid duplicates)
        const existingIndex = clients.findIndex(
          c => normalizeClientName(c.name) === normalizeClientName(parsed.company)
        );
        
        if (existingIndex === -1) {
          clients.push({
            name: parsed.company,
            nameNormalized: normalizeClientName(parsed.company),
            metrics,
            sourcePage: pageIndex + 1,
          });
        }
      }
    }
  }
  
  // Fallback: try to parse with simple regex if no clients found
  if (clients.length === 0) {
    // Look for company names followed by numbers
    const companyPattern = /([A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇ][A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇ\s\-\/\.]{3,40})\s+(\d+\s+){3,}/gi;
    let match;
    
    while ((match = companyPattern.exec(rawText)) !== null) {
      const companyName = match[1].trim();
      if (companyName.length > 3 && !clients.some(c => normalizeClientName(c.name) === normalizeClientName(companyName))) {
        clients.push({
          name: companyName,
          nameNormalized: normalizeClientName(companyName),
          metrics: [],
          sourcePage: 1,
        });
      }
    }
  }
  
  return {
    period: {
      year: detectedYear,
      month: detectedMonth,
    },
    clients,
    rawText,
  };
}

// Calculate file hash for duplicate detection
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}