import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLibrary } from "./journeyRemote";
import { capabilityLevelNames } from "./capabilityJourney";

const database = vi.hoisted(() => ({
  capabilities: [] as Array<{ code: string; payload: Record<string, unknown>; criteria: unknown[]; source_sha256: string }>,
  responsibilities: [] as Array<{ source_id: string; payload: Record<string, unknown>; source_sha256: string }>,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({ order: async () => ({
        data: table === "master_plan_capability_library" ? database.capabilities : database.responsibilities,
        error: null,
      }) }),
    }),
  },
}));

beforeEach(() => {
  const codes = [
    ...Array.from({ length: 5 }, (_, i) => `E${String(i + 1).padStart(2, "0")}`),
    ...Array.from({ length: 23 }, (_, i) => `F${String(i + 1).padStart(2, "0")}`),
    ...Array.from({ length: 11 }, (_, i) => `T${String(i + 1).padStart(2, "0")}`),
  ];
  database.capabilities = codes.map((code) => ({
    code, payload: { code, title: `Published ${code}`, detail: { statement: `Official ${code}` } },
    criteria: [{ id: `${code}-criterion`, level: 1, text: "Original criterion", kind: "evidence" }],
    source_sha256: "same-published-source",
  }));
  database.responsibilities = Array.from({ length: 56 }, (_, i) => ({
    source_id: `resp-${i}`, payload: { sourceId: `resp-${i}`, requiredCapabilities: [{ capabilityCode: "F01", minimumLevel: 2 }] },
    source_sha256: "same-published-source",
  }));
});

describe("official RESPONSABILIDADES 6 library", () => {
  it("accepts 39 capabilities and rejects the previous 33-capability matrix", async () => {
    expect((await fetchLibrary()).capabilities).toHaveLength(39);
    database.capabilities = database.capabilities.slice(0, 33);
    await expect(fetchLibrary()).rejects.toThrow("33/39");
  });

  it("requires exactly 56 competencies", async () => {
    database.responsibilities.pop();
    await expect(fetchLibrary()).rejects.toThrow("55/56");
  });

  it("rejects mixed source hashes", async () => {
    database.responsibilities[0].source_sha256 = "older-source";
    await expect(fetchLibrary()).rejects.toThrow("versões de fonte diferentes");
  });

  it.each(["F19", "F20", "F21", "T11", "F22", "F23"])("requires new capability %s", async (code) => {
    const row = database.capabilities.find((entry) => entry.code === code);
    if (!row) throw new Error(`Missing fixture ${code}`);
    row.code = "Z99";
    row.payload = { ...row.payload, code: "Z99" };
    await expect(fetchLibrary()).rejects.toThrow("matriz atual");
  });

  it("preserves published criteria and competency composition without recomputing them", async () => {
    const library = await fetchLibrary();
    expect(library.capabilities[0].assessmentCriteria).toEqual(database.capabilities[0].criteria);
    expect(library.responsibilities[0]).toEqual(database.responsibilities[0].payload);
  });

  it("maps Assistido, Autônomo and Multiplicador to points 1, 2 and 3", () => {
    expect([1, 2, 3].map((points) => [points, capabilityLevelNames[points]])).toEqual([
      [1, "Assistido"], [2, "Autônomo"], [3, "Multiplicador"],
    ]);
  });
});