import type { CapabilityRecord } from "./capabilityJourney";

export const editorial: Record<string, { summary: string; lead: string; detail: string; highlights: string[] }> = {
  T04: {
    summary: "Organizar prazos legais, contratuais e internos em um controle com responsáveis, alertas e providências antes do vencimento.",
    lead: "Cada prazo relevante precisa ter origem, responsável e próxima ação claros.",
    detail: "A pessoa identifica a regra de contagem, registra o vencimento, prioriza pelo risco de atraso e comunica quem deve agir. O histórico deve permitir verificar o aviso dado e a providência tomada a tempo.",
    highlights: ["Origem e vencimento", "Risco e responsável", "Ação antecipada"],
  },
};

export function firstLetterUpper(value: string): string {
  return value.replace(/^\s*\p{L}/u, (match) => match.toLocaleUpperCase("pt-BR"));
}

export function capabilitySummary(item: CapabilityRecord): string {
  return editorial[item.code]?.summary ?? item.summary;
}
