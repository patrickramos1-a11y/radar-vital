import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { CapabilityLevel, CapabilityRecord, Criterion, CriterionResponse, CriterionReview } from "./capabilityJourney";
import type { SourceResponsibility } from "./capabilityDemo";
import type { ResponsibilityClaim } from "./responsibilityJourney";
import curatedSource from "../../../docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json";

export const journeySupabase = supabase as unknown as SupabaseClient;

export type Library = { capabilities: CapabilityRecord[]; responsibilities: SourceResponsibility[]; sourceSha256: string };
export type AssessmentRow = {
  id: string; collaborator_id: string; capability_code: string; answers: number[];
  indicated_level: number; comment: string; created_at: string;
};
export type RequestRow = {
  id: string; collaborator_id: string; capability_code: string; target_level: CapabilityLevel;
  status: "draft" | "submitted" | "changes_requested" | "approved";
  responses: Record<string, CriterionResponse>; reviews: Record<string, CriterionReview>;
  created_at: string; updated_at: string; submitted_at: string | null; decided_at: string | null;
};
export type TeamCertificationRow = {
  collaborator_id: string;
  capability_code: string;
  certified_level: CapabilityLevel;
  certified_by: string;
  certified_at: string;
  updated_at: string;
};
export type TeamCertificationUpdate = {
  collaboratorId: string;
  capabilityCode: string;
  level: CapabilityLevel;
};
export type TeamTrainingRequestRow = {
  collaborator_id: string;
  capability_code: string;
  target_level: CapabilityLevel;
  status: "requested" | "started" | "completed" | "cancelled";
  requested_by: string;
  requested_at: string;
  updated_at: string;
};

function result<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("A operação não retornou dados.");
  return data;
}
export async function fetchLibrary(): Promise<Library> {
  const [caps, responsibilities] = await Promise.all([
    journeySupabase.from("master_plan_capability_library").select("code,payload,criteria,source_sha256").order("code"),
    journeySupabase.from("master_plan_responsibility_library").select("source_id,payload,source_sha256").order("source_id"),
  ]);
  const capRows = result(caps.data, caps.error);
  const responsibilityRows = result(responsibilities.data, responsibilities.error);
  if (capRows.length !== 28 || responsibilityRows.length !== 56) {
    throw new Error(`Importação incompleta: ${capRows.length}/28 capacidades e ${responsibilityRows.length}/56 responsabilidades.`);
  }
  const sourceSha256 = capRows[0].source_sha256;
  if (sourceSha256 !== curatedSource.source.sha256
    || [...capRows, ...responsibilityRows].some((row) => row.source_sha256 !== sourceSha256)) {
    throw new Error("A biblioteca contém versões de fonte diferentes.");
  }
  if (capRows.some((row) => !row.payload || row.payload.code !== row.code || !row.payload.detail?.statement)
    || responsibilityRows.some((row) => !row.payload || row.payload.sourceId !== row.source_id)) {
    throw new Error("A biblioteca publicada contém fichas inválidas.");
  }
  return {
    capabilities: capRows.map((row) => ({
      ...(row.payload as CapabilityRecord),
      assessmentCriteria: row.criteria as Criterion[],
    })),
    responsibilities: responsibilityRows.map((row) => row.payload as SourceResponsibility),
    sourceSha256,
  };
}
export async function fetchAssessments(collaboratorId: string): Promise<AssessmentRow[]> {
  const { data, error } = await journeySupabase.from("master_plan_self_assessments")
    .select("id,collaborator_id,capability_code,answers,indicated_level,comment,created_at")
    .eq("collaborator_id", collaboratorId)
    .order("created_at", { ascending: false });
  return result(data, error) as AssessmentRow[];
}

export async function createRemoteAssessment(collaboratorId: string, capabilityCode: string, answers: number[], comment: string): Promise<AssessmentRow> {
  const { data, error } = await journeySupabase.rpc("master_plan_record_self_assessment", {
    p_collaborator_id: collaboratorId, p_capability_code: capabilityCode,
    p_answers: answers, p_comment: comment.trim(),
  });
  return result(data, error) as AssessmentRow;
}

export async function fetchRequests(collaboratorId: string, includeAll: boolean): Promise<RequestRow[]> {
  const query = journeySupabase.from("master_plan_certification_requests")
    .select("id,collaborator_id,capability_code,target_level,status,responses,reviews,created_at,updated_at,submitted_at,decided_at");
  const { data, error } = await (includeAll ? query : query.eq("collaborator_id", collaboratorId))
    .order("updated_at", { ascending: false });
  return result(data, error) as RequestRow[];
}

export async function fetchTeamCertifications(): Promise<TeamCertificationRow[]> {
  const { data, error } = await journeySupabase.from("master_plan_team_certifications")
    .select("collaborator_id,capability_code,certified_level,certified_by,certified_at,updated_at")
    .order("updated_at", { ascending: false });
  return result(data, error) as TeamCertificationRow[];
}

export async function applyTeamCertifications(actorId: string, updates: TeamCertificationUpdate[]): Promise<void> {
  const { error } = await journeySupabase.rpc("master_plan_apply_team_certifications", {
    p_actor_id: actorId,
    p_updates: updates,
  });
  if (error) throw new Error(error.message);
}

export async function fetchTeamTrainingRequests(): Promise<TeamTrainingRequestRow[]> {
  const { data, error } = await journeySupabase.from("master_plan_team_training_requests")
    .select("collaborator_id,capability_code,target_level,status,requested_by,requested_at,updated_at")
    .order("updated_at", { ascending: false });
  return result(data, error) as TeamTrainingRequestRow[];
}

export async function requestTeamTraining(actorId: string, collaboratorId: string, capabilityCode: string, level: CapabilityLevel): Promise<TeamTrainingRequestRow> {
  const { data, error } = await journeySupabase.rpc("master_plan_request_team_training", {
    p_actor_id: actorId,
    p_collaborator_id: collaboratorId,
    p_capability_code: capabilityCode,
    p_target_level: level,
  });
  return result(data, error) as TeamTrainingRequestRow;
}

export async function fetchResponsibilityClaims(): Promise<ResponsibilityClaim[]> {
  const { data, error } = await journeySupabase.from("master_plan_responsibility_claims")
    .select("id,collaborator_id,responsibility_source_id,status,requested_at,decided_at,decided_by,decision_note")
    .order("requested_at", { ascending: false });
  return result(data, error) as ResponsibilityClaim[];
}

export async function requestResponsibility(collaboratorId: string, responsibilitySourceId: string): Promise<ResponsibilityClaim> {
  const { data, error } = await journeySupabase.rpc("master_plan_request_responsibility", {
    p_collaborator_id: collaboratorId,
    p_responsibility_source_id: responsibilitySourceId,
  });
  return result(data, error) as ResponsibilityClaim;
}

export async function reviewResponsibilityClaim(reviewerId: string, claimId: string, decision: "approved" | "rejected", note = ""): Promise<ResponsibilityClaim> {
  const { data, error } = await journeySupabase.rpc("master_plan_review_responsibility_claim", {
    p_reviewer_id: reviewerId,
    p_claim_id: claimId,
    p_decision: decision,
    p_note: note,
  });
  return result(data, error) as ResponsibilityClaim;
}

export async function saveRequest(collaboratorId: string, id: string | null, code: string, level: CapabilityLevel,
  responses: Record<string, CriterionResponse>, submit: boolean): Promise<RequestRow> {
  const { data, error } = await journeySupabase.rpc("master_plan_save_certification_request", {
    p_collaborator_id: collaboratorId, p_id: id, p_capability_code: code,
    p_target_level: level, p_responses: responses, p_submit: submit,
  });
  return result(data, error) as RequestRow;
}

export async function reviewRequest(reviewerId: string, id: string, reviews: Record<string, CriterionReview>, decision: "approved" | "changes_requested"): Promise<RequestRow> {
  const { data, error } = await journeySupabase.rpc("master_plan_review_certification_request", {
    p_reviewer_id: reviewerId, p_id: id, p_reviews: reviews, p_decision: decision,
  });
  return result(data, error) as RequestRow;
}
