import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const runLiveReleaseTests = process.env.RUN_LIVE_RELEASE_TESTS === "true";

function read(query: string): string {
  return execFileSync("lovable", ["supabase", "query", query, "--json"], { encoding: "utf8" });
}

const describeLive = runLiveReleaseTests ? describe : describe.skip;

describeLive("Plano Mestre live release rules", () => {
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
  it("keeps Patrick as the only operational administrator", () => {
    const result = read("SELECT count(*) FILTER (WHERE lower(trim(name)) LIKE 'patrick%') = 1 AND count(*) FILTER (WHERE role = 'admin') = 1 AND count(*) FILTER (WHERE lower(trim(name)) NOT LIKE 'patrick%' AND role <> 'colaborador') = 0 AS operational_roles_preserved FROM public.collaborators WHERE is_active = true");
    expect(result).toMatch(/"operational_roles_preserved"\s*:\s*true/);
  });
  it("preserves the curated source hash", () => {
    const result = read("SELECT count(*) = 96 AND bool_and(source_sha256 = 'ed1f3c2ef1cb93717fdb0e45a920fe718b81dd2894bf72f722b8eb04797f395f') AS source_preserved FROM (SELECT source_sha256 FROM public.master_plan_capability_library UNION ALL SELECT source_sha256 FROM public.master_plan_responsibility_library UNION ALL SELECT source_sha256 FROM public.master_plan_library_metadata) sources");
    expect(result).toMatch(/"source_preserved"\s*:\s*true/);
  });
});
