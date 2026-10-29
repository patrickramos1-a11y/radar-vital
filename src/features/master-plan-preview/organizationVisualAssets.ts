const root = "/organization-map";

const sectorStickerNames: Record<string, string> = {
  "SET-01": "projetos", "SET-02": "processos_e_orgaos", "SET-03": "gestao_interna",
  "SET-04": "bem_estar", "SET-05": "operacoes", "SET-06": "marketing",
  "SET-07": "comercial", "SET-08": "financeiro", "SET-09": "rh",
  "SET-10": "contratos", "SET-11": "servicos_visitas_e_levantamentos",
};

const sectorCoverNames: Record<string, string> = {
  "SET-01": "projetos", "SET-02": "processos", "SET-03": "gestao-interna",
  "SET-04": "bem-estar", "SET-05": "operacoes", "SET-06": "marketing",
  "SET-07": "comercial", "SET-08": "financeiro", "SET-09": "rh",
  "SET-10": "contratos", "SET-11": "campo",
};

const functionStickerCodes: Record<string, string> = {
  "FUN-014": "T01", "FUN-018": "T02", "FUN-017": "T03", "FUN-015": "T04", "FUN-016": "T05",
  "FUN-009": "T06", "FUN-012": "T07", "FUN-010": "T08", "FUN-013": "T09", "FUN-011": "T10",
  "FUN-019": "T11", "FUN-020": "T12", "FUN-021": "T13", "FUN-022": "T14",
  "FUN-001": "T15", "FUN-004": "T16", "FUN-007": "T17", "FUN-031": "T18",
  "FUN-002": "T19", "FUN-003": "T20", "FUN-008": "T21",
  "FUN-036": "S01", "FUN-042": "S02", "FUN-037": "S03", "FUN-039": "S04",
  "FUN-040": "S05", "FUN-038": "S06", "FUN-033": "S07", "FUN-034": "S08", "FUN-035": "S09",
  "FUN-005": "A01", "FUN-006": "A02", "FUN-041": "A03", "FUN-025": "A04",
  "FUN-026": "A05", "FUN-028": "A06", "FUN-030": "A07", "FUN-027": "A08", "FUN-029": "A09",
  "FUN-023": "A10", "FUN-024": "A11",
};

export function nucleusStickerPath(id: string): string | undefined {
  const name = ({ "NUC-01": "tecnico", "NUC-02": "suporte", "NUC-03": "administrativo" } as Record<string, string>)[id];
  return name ? `${root}/stickers/${name}.webp` : undefined;
}

export function sectorStickerPath(id: string): string | undefined {
  const name = sectorStickerNames[id];
  return name ? `${root}/sector-stickers/${name}.webp` : undefined;
}

export function sectorCoverPath(id: string): string | undefined {
  const name = sectorCoverNames[id];
  return name ? `${root}/sectors/${name}.webp` : undefined;
}

export function functionStickerPath(id: string): string | undefined {
  const code = functionStickerCodes[id];
  return code ? `${root}/functions/${code}.webp` : undefined;
}
