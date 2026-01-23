export interface Collaborator {
  id: string;
  name: string;
  email: string | null;
  color: string;
  initials: string;
  userId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollaboratorMatchResult {
  responsavelExcel: string;
  collaboratorId?: string;
  collaboratorName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  suggestions?: { id: string; name: string; score: number }[];
  createNew?: boolean;
  ignored?: boolean;
}

// Helper function to normalize text for matching
export function normalizeCollaboratorName(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Calculate similarity score between two names
export function collaboratorSimilarityScore(str1: string, str2: string): number {
  const s1 = normalizeCollaboratorName(str1);
  const s2 = normalizeCollaboratorName(str2);
  
  if (s1 === s2) return 1;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }
  
  // Simple word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matches = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        matches++;
        break;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

// Generate initials from name
export function generateCollaboratorInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Generate a random color for new collaborators
export function generateCollaboratorColor(): string {
  const colors = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#f97316', // Orange
    '#22c55e', // Green
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#f43f5e', // Rose
    '#84cc16', // Lime
    '#0ea5e9', // Sky
    '#a855f7', // Purple
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
