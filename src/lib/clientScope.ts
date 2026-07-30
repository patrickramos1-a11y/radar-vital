import type { Client } from "@/types/client";

export type ClientScope = "external" | "universe" | "all";

export function isExternalClient(
  client: Pick<Client, "clientType">,
): boolean {
  return client.clientType !== "UNIVERSO_RAMOS";
}

export function filterClientsByScope(
  clients: Client[],
  scope: ClientScope,
): Client[] {
  if (scope === "all") return clients;
  if (scope === "universe") {
    return clients.filter(client => client.clientType === "UNIVERSO_RAMOS");
  }
  return clients.filter(isExternalClient);
}
