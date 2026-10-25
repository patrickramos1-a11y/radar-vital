import { supabase } from "@/integrations/supabase/client";

// Operational records remain read-only; Plano Mestre writes use its separate document.
export interface Unit { id: string; name: string; universe_category: string | null; logo_url: string | null }
export interface Challenge { id: string; client_id: string | null; title: string; description: string | null; status: string; created_at: string; due_at: string | null; expected_deliverable: string | null; success_criteria: string }
export interface Task { id: string; client_id: string; title: string; status: string; completed: boolean; completed_at: string | null; created_at: string; due_date: string | null; assigned_to: string[] }
export interface Comment { id: string; client_id: string; comment_text: string; author_name: string; created_at: string }
export interface Collaborator { id: string; name: string; is_active: boolean; photo_url: string | null }
export interface MasterPlanContext { units: Unit[]; challenges: Challenge[]; tasks: Task[]; comments: Comment[]; collaborators: Collaborator[]; readAt: string }
export interface UnitCounts { challenges: number; tasks: number; comments: number }

const assertNoError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function fetchMasterPlanContext(): Promise<MasterPlanContext> {
  const unitsResult = await supabase.from("clients")
    .select("id,name,universe_category,logo_url")
    .eq("client_type", "UNIVERSO_RAMOS")
    .order("name");
  assertNoError(unitsResult.error);
  const units = (unitsResult.data ?? []) as Unit[];
  const ids = units.map((unit) => unit.id);
  const collaboratorsResult = await supabase.from("collaborators")
    .select("id,name,is_active,photo_url")
    .eq("is_active", true)
    .order("name");
  assertNoError(collaboratorsResult.error);

  if (ids.length === 0) {
    return { units, challenges: [], tasks: [], comments: [], collaborators: (collaboratorsResult.data ?? []) as Collaborator[], readAt: new Date().toISOString() };
  }

  const [challengesResult, tasksResult, commentsResult] = await Promise.all([
    supabase.from("challenges").select("id,client_id,title,description,status,created_at,due_at,expected_deliverable,success_criteria").in("client_id", ids).order("created_at", { ascending: false }),
    supabase.from("tasks").select("id,client_id,title,status,completed,completed_at,created_at,due_date,assigned_to").in("client_id", ids).order("created_at", { ascending: false }),
    supabase.from("client_comments").select("id,client_id,comment_text,author_name,created_at").in("client_id", ids).eq("is_archived", false).order("created_at", { ascending: false }),
  ]);
  assertNoError(challengesResult.error);
  assertNoError(tasksResult.error);
  assertNoError(commentsResult.error);
  return {
    units,
    challenges: (challengesResult.data ?? []) as Challenge[],
    tasks: (tasksResult.data ?? []) as Task[],
    comments: (commentsResult.data ?? []) as Comment[],
    collaborators: (collaboratorsResult.data ?? []) as Collaborator[],
    readAt: new Date().toISOString(),
  };
}

export function sectorUnits(context: MasterPlanContext): Unit[] {
  return context.units.filter((unit) => unit.universe_category === "SETOR");
}

export function countsForUnit(context: MasterPlanContext, id: string): UnitCounts {
  return {
    challenges: context.challenges.filter((item) => item.client_id === id).length,
    tasks: context.tasks.filter((item) => item.client_id === id).length,
    comments: context.comments.filter((item) => item.client_id === id).length,
  };
}

export function sectorRecords(context: MasterPlanContext) {
  const ids = new Set(sectorUnits(context).map((unit) => unit.id));
  return {
    challenges: context.challenges.filter((item) => item.client_id && ids.has(item.client_id)),
    tasks: context.tasks.filter((item) => ids.has(item.client_id)),
    comments: context.comments.filter((item) => ids.has(item.client_id)),
  };
}

