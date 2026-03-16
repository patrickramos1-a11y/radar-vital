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
 * Check if a task's assigned_to array includes a collaborator name (case/accent insensitive).
 */
export function assigneeMatches(assignedTo: string[] | string | null | undefined, collaboratorName: string): boolean {
  const list = normalizeAssignedTo(assignedTo);
  const normalized = normalizeAssignee(collaboratorName);
  return list.some(a => normalizeAssignee(a) === normalized);
}

/**
 * Check if a task's assigned_to includes any name in a list.
 */
export function assigneeMatchesAny(assignedTo: string[] | string | null | undefined, names: string[]): boolean {
  const list = normalizeAssignedTo(assignedTo);
  if (list.length === 0 || names.length === 0) return false;
  return names.some(name => list.some(a => normalizeAssignee(a) === normalizeAssignee(name)));
}

/**
 * Find the collaborator color for the first matching assignee.
 */
export function findCollaboratorColor(
  assignedTo: string[] | string | null | undefined,
  colorMap: Record<string, string>
): string | undefined {
  const list = normalizeAssignedTo(assignedTo);
  for (const assignee of list) {
    const normalizedAssignee = normalizeAssignee(assignee);
    for (const [name, color] of Object.entries(colorMap)) {
      if (normalizeAssignee(name) === normalizedAssignee) return color;
    }
  }
  return undefined;
}

/**
 * Find all collaborator colors for all assignees.
 */
export function findAllCollaboratorColors(
  assignedTo: string[] | string | null | undefined,
  colorMap: Record<string, string>
): { name: string; color: string }[] {
  const list = normalizeAssignedTo(assignedTo);
  const results: { name: string; color: string }[] = [];
  for (const assignee of list) {
    const normalizedAssignee = normalizeAssignee(assignee);
    for (const [name, color] of Object.entries(colorMap)) {
      if (normalizeAssignee(name) === normalizedAssignee) {
        results.push({ name, color });
        break;
      }
    }
  }
  return results;
}

/**
 * Normalize assigned_to to always be an array (handles legacy string values).
 */
function normalizeAssignedTo(assignedTo: string[] | string | null | undefined): string[] {
  if (!assignedTo) return [];
  if (Array.isArray(assignedTo)) return assignedTo;
  return [assignedTo];
}
