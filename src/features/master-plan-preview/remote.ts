import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { parseMasterPlanDraft, type MasterPlanDraft } from "./storage";

const client = supabase as unknown as SupabaseClient;
const key = "universo-ramos";

async function readDocument(): Promise<{ revision: number; draft: MasterPlanDraft }> {
  const { data, error } = await client.from("master_plan_documents")
    .select("revision,payload")
    .eq("document_key", key)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Plano Mestre não encontrado no banco.");
  return { revision: data.revision as number, draft: parseMasterPlanDraft(data.payload) };
}

export async function fetchRemoteMasterPlanDraft(): Promise<MasterPlanDraft> {
  return (await readDocument()).draft;
}

export async function updateRemoteMasterPlanDraft(
  update: (current: MasterPlanDraft) => MasterPlanDraft,
): Promise<MasterPlanDraft> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { revision, draft } = await readDocument();
    const next = parseMasterPlanDraft({ ...update(draft), savedAt: new Date().toISOString() });
    const { data, error } = await client.from("master_plan_documents")
      .update({ revision: revision + 1, payload: next })
      .eq("document_key", key)
      .eq("revision", revision)
      .select("revision,payload")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return parseMasterPlanDraft(data.payload);
  }
  throw new Error("Outro usuário atualizou o Plano Mestre ao mesmo tempo. Atualize e tente novamente.");
}

export async function deactivateMasterPlanCollaborator(
  actorId: string,
  collaboratorId: string,
): Promise<void> {
  const { error } = await client.rpc("master_plan_deactivate_collaborator", {
    p_actor_id: actorId,
    p_collaborator_id: collaboratorId,
  });
  if (error) throw new Error(error.message);
}
