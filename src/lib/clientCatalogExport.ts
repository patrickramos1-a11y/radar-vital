import type { Client, ClientType } from "@/types/client";

type ExternalClientType = Extract<ClientType, "AC" | "AV">;

export interface ClientCatalogEntry {
  id: string;
  name: string;
  initials: string;
  logoUrl: string | null;
  clientType: ExternalClientType;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientCatalogExport {
  schemaVersion: 1;
  source: "radar-vital";
  generatedAt: string;
  includesInactive: true;
  total: number;
  logoCount: number;
  clients: ClientCatalogEntry[];
}

export function buildClientCatalogExport(
  clients: Client[],
  generatedAt = new Date(),
  logoByClientId: ReadonlyMap<string, string | null> = new Map(),
): ClientCatalogExport {
  const externalClients = clients
    .filter(
      (client): client is Client & { clientType: ExternalClientType } =>
        client.clientType === "AC" || client.clientType === "AV",
    )
    .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, "pt-BR"))
    .map((client) => {
      const logoUrl = logoByClientId.has(client.id)
        ? logoByClientId.get(client.id) ?? null
        : client.logoUrl ?? null;

      return {
        id: client.id,
        name: client.name,
        initials: client.initials,
        logoUrl,
        clientType: client.clientType,
        isActive: client.isActive,
        order: client.order,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      };
    });

  return {
    schemaVersion: 1,
    source: "radar-vital",
    generatedAt: generatedAt.toISOString(),
    includesInactive: true,
    total: externalClients.length,
    logoCount: externalClients.filter((client) => Boolean(client.logoUrl)).length,
    clients: externalClients,
  };
}
