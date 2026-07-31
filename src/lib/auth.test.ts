import { describe, expect, it } from "vitest";
import {
  actorName,
  isAdminRole,
  mapCollaborator,
  resolveAppRole,
  type CollaboratorRow,
} from "@/lib/auth";

const row: CollaboratorRow = {
  id: "collaborator-1",
  name: "Patrick",
  email: "patrick@example.com",
  color: "#0dd375",
  initials: "PA",
  user_id: "user-1",
  is_active: true,
  role: "administrador",
  is_central_only: false,
  photo_url: null,
  created_at: "2026-07-30T12:00:00.000Z",
  updated_at: "2026-07-30T12:00:00.000Z",
};

describe("auth domain", () => {
  it("maps database collaborators without unsafe casts", () => {
    expect(mapCollaborator(row)).toMatchObject({
      id: "collaborator-1",
      name: "Patrick",
      userId: "user-1",
      role: "administrador",
      isCentralOnly: false,
    });
  });

  it("grants admin only from the persisted role", () => {
    expect(resolveAppRole(["user"])).toBe("user");
    expect(resolveAppRole(["user", "admin"])).toBe("admin");
    expect(isAdminRole(resolveAppRole(["user"]))).toBe(false);
    expect(isAdminRole(resolveAppRole(["admin"]))).toBe(true);
  });

  it("does not infer admin privileges from a display name", () => {
    expect(actorName({ name: "Patrick" })).toBe("Patrick");
    expect(isAdminRole("user")).toBe(false);
  });
});
