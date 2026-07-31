import type { Database } from "@/integrations/supabase/types";
import type { Collaborator } from "@/types/collaborator";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type CollaboratorRow =
  Database["public"]["Tables"]["collaborators"]["Row"];

export function mapCollaborator(row: CollaboratorRow): Collaborator {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    color: row.color,
    initials: row.initials,
    userId: row.user_id,
    isActive: row.is_active,
    role: row.role || "colaborador",
    isCentralOnly: row.is_central_only,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function resolveAppRole(roles: AppRole[] | null | undefined): AppRole {
  return roles?.includes("admin") ? "admin" : "user";
}

export function isAdminRole(role: AppRole | null | undefined): boolean {
  return role === "admin";
}

export function actorName(
  collaborator: Pick<Collaborator, "name"> | null | undefined,
): string {
  return collaborator?.name?.trim() || "Sistema";
}
