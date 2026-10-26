import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function read(query: string): string {
  return execFileSync("lovable", ["supabase", "query", query, "--json"], { encoding: "utf8" });
}

describe("Plano Mestre live release rules", () => {
  it("preserves the 15-day cadence", () => {
    const result = read("SELECT self_assessment_interval_days = 15 AS cadence_preserved FROM public.master_plan_journey_settings WHERE settings_key = 'default'");
    expect(result).toMatch(/"cadence_preserved"\s*:\s*true/);
  });
  it("preserves the initial target of three assessments", () => {
    const result = read("SELECT initial_self_assessment_target = 3 AS target_preserved FROM public.master_plan_journey_settings WHERE settings_key = 'default'");
    expect(result).toMatch(/"target_preserved"\s*:\s*true/);
  });
  it("keeps the final authentication cutover disabled", () => {
    const result = read("SELECT value = 'false'::jsonb AS cutover_disabled FROM public.system_settings WHERE key = 'auth_enforced'");
    expect(result).toMatch(/"cutover_disabled"\s*:\s*true/);
  });
  it("does not allow anonymous certification approval", () => {
    const result = read("SELECT NOT has_function_privilege('anon', 'public.master_plan_review_certification_request(uuid,uuid,jsonb,text)', 'EXECUTE') AS anonymous_approval_denied");
    expect(result).toMatch(/"anonymous_approval_denied"\s*:\s*true/);
  });
  it("preserves the curated source hash", () => {
    const result = read("SELECT count(*) = 85 AND bool_and(source_sha256 = '4f4ebb45100a3092ccdc372dbe10b5ea3013894f6d4ee35c1463fde9e94d58b1') AS source_preserved FROM (SELECT source_sha256 FROM public.master_plan_capability_library UNION ALL SELECT source_sha256 FROM public.master_plan_responsibility_library UNION ALL SELECT source_sha256 FROM public.master_plan_library_metadata) sources");
    expect(result).toMatch(/"source_preserved"\s*:\s*true/);
  });
});