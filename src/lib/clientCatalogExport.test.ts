import { describe, expect, it } from "vitest";
import { buildClientCatalogExport } from "@/lib/clientCatalogExport";
import type { Client } from "@/types/client";

function client(
  id: string,
  clientType: Client["clientType"],
  options: Partial<Client> = {},
): Client {
  return {
    id,
    name: id.toUpperCase(),
    initials: id.slice(0, 2).toUpperCase(),
    clientType,
    isActive: true,
    order: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-10-18T00:00:00.000Z",
    ...options,
  } as Client;
}

describe("client catalog export", () => {
  it("exports AC and AV clients with logos and active status", () => {
    const result = buildClientCatalogExport(
      [
        client("av", "AV", { logoUrl: "https://cdn.example/av.png", isActive: false, order: 2 }),
        client("ac", "AC", { logoUrl: "data:image/png;base64,logo", order: 1 }),
      ],
      new Date("2026-10-18T12:00:00.000Z"),
    );

    expect(result).toMatchObject({
      schemaVersion: 1,
      source: "radar-vital",
      generatedAt: "2026-10-18T12:00:00.000Z",
      includesInactive: true,
      total: 2,
      logoCount: 2,
    });
    expect(result.clients).toEqual([
      expect.objectContaining({ id: "ac", clientType: "AC", logoUrl: "data:image/png;base64,logo", isActive: true }),
      expect.objectContaining({ id: "av", clientType: "AV", logoUrl: "https://cdn.example/av.png", isActive: false }),
    ]);
  });

  it("does not include Universo Ramos records", () => {
    const result = buildClientCatalogExport([
      client("cliente", "AC"),
      client("interno", "UNIVERSO_RAMOS"),
    ]);

    expect(result.total).toBe(1);
    expect(result.clients.map((item) => item.id)).toEqual(["cliente"]);
  });

  it("uses logos loaded directly from the database when provided", () => {
    const result = buildClientCatalogExport(
      [client("ac", "AC")],
      new Date("2026-10-19T12:00:00.000Z"),
      new Map([["ac", "data:image/png;base64,database-logo"]]),
    );

    expect(result.logoCount).toBe(1);
    expect(result.clients[0].logoUrl).toBe("data:image/png;base64,database-logo");
  });
});
