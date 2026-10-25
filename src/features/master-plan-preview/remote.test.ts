import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyMasterPlanDraft } from "./storage";
import { fetchRemoteMasterPlanDraft, updateRemoteMasterPlanDraft } from "./remote";

const database = vi.hoisted(() => ({
  revision: 0,
  payload: null as unknown,
  conflicts: 0,
  reads: 0,
  error: "",
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            database.reads += 1;
            return { data: { revision: database.revision, payload: database.payload }, error: null };
          },
        }),
      }),
      update: (next: { revision: number; payload: unknown }) => ({
        eq: () => ({
          eq: () => ({
            select: () => ({
              maybeSingle: async () => {
                if (database.error) return { data: null, error: { message: database.error } };
                if (database.conflicts > 0) { database.conflicts -= 1; return { data: null, error: null }; }
                database.revision = next.revision;
                database.payload = next.payload;
                return { data: { revision: database.revision, payload: database.payload }, error: null };
              },
            }),
          }),
        }),
      }),
    }),
  },
}));

beforeEach(() => {
  database.revision = 0;
  database.payload = emptyMasterPlanDraft();
  database.conflicts = 0;
  database.reads = 0;
  database.error = "";
});

describe("Plano Mestre remote document", () => {
  it("loads and persists a versioned draft", async () => {
    expect((await fetchRemoteMasterPlanDraft()).capabilities).toEqual([]);
    const saved = await updateRemoteMasterPlanDraft((current) => ({
      ...current,
      capabilities: [{ id: "cap-1", title: "Revisar projetos", sectorIds: ["projects"], sourceChallengeIds: [], status: "local" }],
    }));
    expect(saved.capabilities[0].title).toBe("Revisar projetos");
    expect(saved.savedAt).toBeTruthy();
    expect(database.revision).toBe(1);
  });

  it("re-reads the document after a concurrent update", async () => {
    database.conflicts = 1;
    await updateRemoteMasterPlanDraft((current) => ({ ...current, nucleusOverrides: { ...current.nucleusOverrides, projects: "tecnico" } }));
    expect(database.reads).toBe(2);
    expect(database.revision).toBe(1);
  });

  it("does not claim success when the database rejects a write", async () => {
    database.error = "permission denied";
    await expect(updateRemoteMasterPlanDraft((current) => current)).rejects.toThrow("permission denied");
    expect(database.revision).toBe(0);
  });
});
