import { describe, expect, it } from "vitest";
import {
  filterClientsByScope,
  isExternalClient,
} from "@/lib/clientScope";
import { calculateTotals, type Client } from "@/types/client";

function client(
  id: string,
  clientType: Client["clientType"],
  processes: number,
): Client {
  return {
    id,
    clientType,
    name: id,
    initials: id.slice(0, 2),
    isPriority: false,
    isActive: true,
    isChecked: false,
    isHighlighted: false,
    order: 1,
    processes,
    processBreakdown: {
      total: processes,
      deferido: 0,
      emAnaliseOrgao: processes,
      emAnaliseRamos: 0,
      notificado: 0,
      reprovado: 0,
    },
    licenses: 0,
    licenseBreakdown: {
      validas: 0,
      proximoVencimento: 0,
      foraValidade: 0,
      proximaDataVencimento: null,
    },
    demands: {
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      cancelled: 0,
    },
    demandsByCollaborator: {
      celine: 0,
      gabi: 0,
      darley: 0,
      vanessa: 0,
    },
    collaborators: {
      celine: false,
      gabi: false,
      darley: false,
      vanessa: false,
    },
    municipios: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("client scope", () => {
  const clients = [
    client("ac", "AC", 2),
    client("av", "AV", 3),
    client("interno", "UNIVERSO_RAMOS", 50),
  ];

  it("keeps Universo Ramos outside the external workspace", () => {
    expect(filterClientsByScope(clients, "external").map(item => item.id))
      .toEqual(["ac", "av"]);
  });

  it("shows only internal records when Universo Ramos is selected", () => {
    expect(filterClientsByScope(clients, "universe").map(item => item.id))
      .toEqual(["interno"]);
  });

  it("classifies AC and AV as external", () => {
    expect(isExternalClient(clients[0])).toBe(true);
    expect(isExternalClient(clients[1])).toBe(true);
    expect(isExternalClient(clients[2])).toBe(false);
  });

  it("does not add internal records to external dashboard totals", () => {
    expect(calculateTotals(clients)).toMatchObject({
      totalClients: 2,
      totalProcesses: 5,
    });
  });
});
