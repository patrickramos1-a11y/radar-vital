/**
 * Normalize a name for case-insensitive, accent-insensitive comparison.
 */
export function normalizeAssignee(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Check if a task's assigned_to matches a collaborator name (case/accent insensitive).
 */
export function assigneeMatches(assignedTo: string | null | undefined, collaboratorName: string): boolean {
  if (!assignedTo) return false;
  return normalizeAssignee(assignedTo) === normalizeAssignee(collaboratorName);
}

/**
 * Check if a task's assigned_to matches any name in a list.
 */
export function assigneeMatchesAny(assignedTo: string | null | undefined, names: string[]): boolean {
  if (!assignedTo || names.length === 0) return false;
  const normalized = normalizeAssignee(assignedTo);
  return names.some(name => normalizeAssignee(name) === normalized);
}

/**
 * Find the collaborator color for a given assignee, using normalized matching.
 */
export function findCollaboratorColor(
  assignedTo: string | null | undefined,
  colorMap: Record<string, string>
): string | undefined {
  if (!assignedTo) return undefined;
  const normalizedAssignee = normalizeAssignee(assignedTo);
  for (const [name, color] of Object.entries(colorMap)) {
    if (normalizeAssignee(name) === normalizedAssignee) return color;
  }
  return undefined;
}
