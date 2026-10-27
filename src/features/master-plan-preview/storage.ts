import { z } from "zod";
import type { Challenge } from "./data";
import type { NucleusId, PreviewCapability, PreviewResponsibility } from "./model";

export const MASTER_PLAN_STORAGE_KEY = "radar-vital:plano-mestre:rascunho:v1";

export type LocalChallenge = Challenge & { previewOnly: true };
export type RequestPlan = {
  responsibilityId?: string;
  assigneeId?: string;
  plannedMonth?: string;
  dueDate?: string;
  priority?: string;
  weight?: string;
  budget?: string;
  dependencyId?: string;
  blocker?: string;
  subtasks?: string;
  comment?: string;
  attachment?: string;
};
export type LocalResponsibilityClaim = {
  personId: string;
  responsibilityId: string;
  status: "requested" | "approved" | "rejected";
  requestedAt?: string;
  decidedAt?: string;
};
export type CareerCapabilitySimulation = {
  changesByStep: Record<string, Record<string, 1 | 2 | 3>>;
  consolidatedStepIds: string[];
  savedAt: string;
};

export interface MasterPlanDraft {
  version: 1;
  savedAt: string;
  nucleusOverrides: Record<string, NucleusId | "">;
  capabilities: PreviewCapability[];
  responsibilities: PreviewResponsibility[];
  requests: LocalChallenge[];
  responsibilityOverrides: Record<string, Partial<PreviewResponsibility>>;
  requestPlans: Record<string, RequestPlan>;
  trainingRequests: Array<{ personId: string; capabilityId: string }>;
  claims: LocalResponsibilityClaim[];
  capabilityPlans: Record<string, Record<string, 0 | 1 | 2 | 3>>;
  careerCapabilitySimulations: Record<string, CareerCapabilitySimulation>;
  collaboratorNuclei: Record<string, NucleusId>;
  nucleusThresholds: Partial<Record<NucleusId, number>>;
}

const boundedText = z.string().max(20_000);
const identifier = z.string().min(1).max(200);
const capabilitySchema = z.object({
  id: identifier, title: boundedText.min(1), sectorIds: z.array(identifier).max(100),
  sourceChallengeIds: z.array(identifier).max(100), status: z.enum(["proposal", "local"]),
});
const responsibilitySchema = z.object({
  id: identifier, title: boundedText.min(1), sectorId: identifier,
  capabilityIds: z.array(identifier).max(100), sourceChallengeIds: z.array(identifier).max(100),
  holderId: identifier.nullable(), substituteId: identifier.nullable(),
  status: z.enum(["proposal", "local"]),
});
const localChallengeSchema = z.object({
  id: identifier, client_id: identifier, title: boundedText.min(1),
  description: boundedText.nullable(), status: boundedText, created_at: boundedText,
  due_at: boundedText.nullable(), expected_deliverable: boundedText.nullable(),
  success_criteria: boundedText, previewOnly: z.literal(true),
});
const requestPlanSchema = z.object({
  responsibilityId: boundedText.optional(), assigneeId: boundedText.optional(),
  plannedMonth: boundedText.optional(), dueDate: boundedText.optional(),
  priority: boundedText.optional(), weight: boundedText.optional(),
  budget: boundedText.optional(), dependencyId: boundedText.optional(),
  blocker: boundedText.optional(), subtasks: boundedText.optional(),
  comment: boundedText.optional(), attachment: boundedText.optional(),
});
const draftSchema = z.object({
  version: z.literal(1), savedAt: boundedText,
  nucleusOverrides: z.record(z.enum(["tecnico", "suporte", "administrativo", ""])),
  capabilities: z.array(capabilitySchema).max(5_000),
  responsibilities: z.array(responsibilitySchema).max(5_000),
  requests: z.array(localChallengeSchema).max(5_000),
  responsibilityOverrides: z.record(responsibilitySchema.partial()),
  requestPlans: z.record(requestPlanSchema),
  trainingRequests: z.array(z.object({ personId: identifier, capabilityId: identifier })).max(5_000),
  claims: z.array(z.object({ personId: identifier, responsibilityId: identifier, status: z.enum(["requested", "approved", "rejected"]).default("requested"), requestedAt: boundedText.optional(), decidedAt: boundedText.optional() })).max(5_000),
  capabilityPlans: z.record(z.record(z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]))).default({}),
  careerCapabilitySimulations: z.record(z.object({
    changesByStep: z.record(z.record(z.union([z.literal(1), z.literal(2), z.literal(3)]))),
    consolidatedStepIds: z.array(identifier).max(20),
    savedAt: boundedText,
  })).default({}),
  collaboratorNuclei: z.record(z.enum(["tecnico", "suporte", "administrativo"])).default({}),
  nucleusThresholds: z.record(z.number().int().min(1).max(100)).default({}),
});

export function emptyMasterPlanDraft(): MasterPlanDraft {
  return {
    version: 1, savedAt: "", nucleusOverrides: {}, capabilities: [], responsibilities: [],
    requests: [], responsibilityOverrides: {}, requestPlans: {}, trainingRequests: [], claims: [], capabilityPlans: {}, careerCapabilitySimulations: {}, collaboratorNuclei: {}, nucleusThresholds: {},
  };
}

export function parseMasterPlanDraft(value: unknown): MasterPlanDraft {
  const parsed = draftSchema.parse(value) as MasterPlanDraft;
  const uniqueIds = (records: Array<{ id: string }>) => new Set(records.map((record) => record.id)).size === records.length;
  if (!uniqueIds(parsed.capabilities) || !uniqueIds(parsed.responsibilities) || !uniqueIds(parsed.requests)) {
    throw new Error("O arquivo contém identificadores duplicados.");
  }
  return parsed;
}

export function loadMasterPlanDraft(): MasterPlanDraft {
  const raw = window.localStorage.getItem(MASTER_PLAN_STORAGE_KEY);
  return raw ? parseMasterPlanDraft(JSON.parse(raw)) : emptyMasterPlanDraft();
}

export function saveMasterPlanDraft(draft: MasterPlanDraft): MasterPlanDraft {
  const saved = { ...draft, savedAt: new Date().toISOString() };
  window.localStorage.setItem(MASTER_PLAN_STORAGE_KEY, JSON.stringify(saved));
  return saved;
}

export function mergeMasterPlanDraft(current: MasterPlanDraft, imported: MasterPlanDraft): MasterPlanDraft {
  const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]) => {
    const result = new Map(incoming.map((record) => [record.id, record]));
    existing.forEach((record) => result.set(record.id, record));
    return [...result.values()];
  };
  const mergePairs = <T extends Record<string, string>>(existing: T[], incoming: T[], key: (item: T) => string) => {
    const result = new Map(incoming.map((record) => [key(record), record]));
    existing.forEach((record) => result.set(key(record), record));
    return [...result.values()];
  };
  return {
    ...current,
    nucleusOverrides: { ...imported.nucleusOverrides, ...current.nucleusOverrides },
    capabilities: mergeById(current.capabilities, imported.capabilities),
    responsibilities: mergeById(current.responsibilities, imported.responsibilities),
    requests: mergeById(current.requests, imported.requests),
    responsibilityOverrides: { ...imported.responsibilityOverrides, ...current.responsibilityOverrides },
    requestPlans: { ...imported.requestPlans, ...current.requestPlans },
    trainingRequests: mergePairs(current.trainingRequests, imported.trainingRequests, (item) => `${item.personId}:${item.capabilityId}`),
    claims: mergePairs(current.claims, imported.claims, (item) => `${item.personId}:${item.responsibilityId}`),
    capabilityPlans: Object.fromEntries([...new Set([...Object.keys(imported.capabilityPlans), ...Object.keys(current.capabilityPlans)])].map((code) => [code, { ...(imported.capabilityPlans[code] ?? {}), ...(current.capabilityPlans[code] ?? {}) }])),
    careerCapabilitySimulations: { ...imported.careerCapabilitySimulations, ...current.careerCapabilitySimulations },
    collaboratorNuclei: { ...imported.collaboratorNuclei, ...current.collaboratorNuclei },
    nucleusThresholds: { ...imported.nucleusThresholds, ...current.nucleusThresholds },
  };
}
